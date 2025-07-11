#!/usr/bin/env python3
"""
ElevenLabs Conversational AI Python Backend
Handles WebSocket connections to ElevenLabs and provides API endpoints for frontend
"""

import asyncio
import json
import logging
import os
import uuid
from typing import Dict, Optional, Set
import websockets
import aiohttp
from aiohttp import web, WSMsgType
from aiohttp.web import Request, WebSocketResponse
import ssl

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ElevenLabsProxy:
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.active_connections: Dict[str, Dict] = {}
        
    async def get_signed_url(self, agent_id: str) -> str:
        """
        Get signed URL from ElevenLabs API for authenticated conversations
        """
        url = f"https://api.elevenlabs.io/v1/convai/conversation/get_signed_url"
        headers = {
            "xi-api-key": self.api_key,
            "Content-Type": "application/json"
        }
        params = {"agent_id": agent_id}
        
        async with aiohttp.ClientSession() as session:
            async with session.get(url, headers=headers, params=params) as response:
                if response.status == 200:
                    data = await response.json()
                    return data.get("signed_url")
                else:
                    raise Exception(f"Failed to get signed URL: {response.status}")
    
    async def start_conversation(self, client_ws: WebSocketResponse, agent_id: str) -> str:
        """
        Start a conversation with ElevenLabs and proxy messages
        """
        conversation_id = str(uuid.uuid4())
        
        try:
            # For public agents, construct WebSocket URL directly
            # For private agents, use signed URL
            try:
                # Try to get signed URL first (for private agents)
                signed_url = await self.get_signed_url(agent_id)
                elevenlabs_ws_url = signed_url.replace("https://", "wss://")
            except:
                # Fall back to public agent URL
                elevenlabs_ws_url = f"wss://api.elevenlabs.io/v1/convai/conversation?agent_id={agent_id}"
            
            logger.info(f"Connecting to ElevenLabs WebSocket: {elevenlabs_ws_url}")
            
            # Connect to ElevenLabs WebSocket
            elevenlabs_ws = await websockets.connect(
                elevenlabs_ws_url,
                extra_headers={"xi-api-key": self.api_key} if self.api_key else None
            )
            
            # Store connection info
            self.active_connections[conversation_id] = {
                "client_ws": client_ws,
                "elevenlabs_ws": elevenlabs_ws,
                "agent_id": agent_id
            }
            
            # Start message proxy tasks
            asyncio.create_task(self._proxy_client_to_elevenlabs(conversation_id))
            asyncio.create_task(self._proxy_elevenlabs_to_client(conversation_id))
            
            # Send connection success message to client
            await client_ws.send_str(json.dumps({
                "type": "connection_established",
                "conversation_id": conversation_id,
                "status": "connected"
            }))
            
            return conversation_id
            
        except Exception as e:
            logger.error(f"Failed to start conversation: {str(e)}")
            await client_ws.send_str(json.dumps({
                "type": "error",
                "message": f"Failed to connect to ElevenLabs: {str(e)}"
            }))
            raise
    
    async def _proxy_client_to_elevenlabs(self, conversation_id: str):
        """
        Proxy messages from client to ElevenLabs
        """
        connection = self.active_connections.get(conversation_id)
        if not connection:
            return
            
        client_ws = connection["client_ws"]
        elevenlabs_ws = connection["elevenlabs_ws"]
        
        try:
            # Send initial connection message to ElevenLabs
            await elevenlabs_ws.send(json.dumps({
                "type": "conversation_initiation_client_data",
                "conversation_config_override": {}
            }))
            
            async for message in client_ws:
                if message.type == WSMsgType.TEXT:
                    try:
                        data = json.loads(message.data)
                        logger.debug(f"Received from client: {data.get('type', 'unknown')}")
                        
                        # Forward message to ElevenLabs as-is
                        await elevenlabs_ws.send(message.data)
                        
                    except json.JSONDecodeError:
                        logger.warning(f"Invalid JSON from client: {message.data}")
                        
                elif message.type == WSMsgType.BINARY:
                    # Forward binary data (audio) to ElevenLabs
                    await elevenlabs_ws.send(message.data)
                    
                elif message.type == WSMsgType.ERROR:
                    logger.error(f"Client WebSocket error: {message.data}")
                    break
                    
        except websockets.exceptions.ConnectionClosed:
            logger.info(f"Client WebSocket closed for conversation {conversation_id}")
        except Exception as e:
            logger.error(f"Error in client-to-elevenlabs proxy: {str(e)}")
        finally:
            await self._cleanup_conversation(conversation_id)
    
    async def _proxy_elevenlabs_to_client(self, conversation_id: str):
        """
        Proxy messages from ElevenLabs to client
        """
        connection = self.active_connections.get(conversation_id)
        if not connection:
            return
            
        client_ws = connection["client_ws"]
        elevenlabs_ws = connection["elevenlabs_ws"]
        
        try:
            async for message in elevenlabs_ws:
                if isinstance(message, str):
                    # Text message - parse and potentially modify
                    try:
                        data = json.loads(message)
                        # Add conversation_id to all messages
                        data["conversation_id"] = conversation_id
                        await client_ws.send_str(json.dumps(data))
                    except json.JSONDecodeError:
                        # Forward raw text message
                        await client_ws.send_str(message)
                else:
                    # Binary message (audio data)
                    await client_ws.send_bytes(message)
                    
        except websockets.exceptions.ConnectionClosed:
            logger.info(f"ElevenLabs WebSocket closed for conversation {conversation_id}")
        except Exception as e:
            logger.error(f"Error in elevenlabs-to-client proxy: {str(e)}")
        finally:
            await self._cleanup_conversation(conversation_id)
    
    async def _cleanup_conversation(self, conversation_id: str):
        """
        Clean up conversation resources
        """
        connection = self.active_connections.pop(conversation_id, None)
        if connection:
            try:
                if "elevenlabs_ws" in connection:
                    await connection["elevenlabs_ws"].close()
            except:
                pass
            
            try:
                if "client_ws" in connection and not connection["client_ws"].closed:
                    await connection["client_ws"].send_str(json.dumps({
                        "type": "conversation_ended",
                        "conversation_id": conversation_id
                    }))
            except:
                pass
    
    async def end_conversation(self, conversation_id: str):
        """
        End a specific conversation
        """
        await self._cleanup_conversation(conversation_id)

class ConversationServer:
    def __init__(self, api_key: str):
        self.elevenlabs_proxy = ElevenLabsProxy(api_key)
        self.app = web.Application()
        self._setup_routes()
    
    def _setup_routes(self):
        """
        Set up HTTP and WebSocket routes
        """
        self.app.router.add_get('/ws/conversation', self.websocket_handler)
        self.app.router.add_post('/api/conversation/start', self.start_conversation_handler)
        self.app.router.add_post('/api/conversation/end', self.end_conversation_handler)
        self.app.router.add_get('/api/health', self.health_check)
        
        # CORS middleware
        self.app.middlewares.append(self._cors_handler)
    
    async def _cors_handler(self, request: Request, handler):
        """
        Handle CORS for all requests
        """
        response = await handler(request)
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
        return response
    
    async def websocket_handler(self, request: Request) -> WebSocketResponse:
        """
        Handle WebSocket connections from frontend
        """
        ws = WebSocketResponse()
        await ws.prepare(request)
        
        agent_id = request.query.get('agent_id')
        if not agent_id:
            await ws.send_str(json.dumps({
                "type": "error",
                "message": "agent_id parameter is required"
            }))
            return ws
        
        try:
            conversation_id = await self.elevenlabs_proxy.start_conversation(ws, agent_id)
            logger.info(f"Started conversation {conversation_id} for agent {agent_id}")
            
            # Keep connection alive until closed
            async for msg in ws:
                if msg.type == WSMsgType.ERROR:
                    logger.error(f"WebSocket error: {msg.data}")
                    break
                    
        except Exception as e:
            logger.error(f"WebSocket handler error: {str(e)}")
        
        return ws
    
    async def start_conversation_handler(self, request: Request) -> web.Response:
        """
        HTTP endpoint to start a conversation
        """
        try:
            data = await request.json()
            agent_id = data.get('agent_id')
            
            if not agent_id:
                return web.json_response(
                    {"error": "agent_id is required"}, 
                    status=400
                )
            
            # For HTTP API, we return the WebSocket URL the client should connect to
            ws_url = f"ws://localhost:8000/ws/conversation?agent_id={agent_id}"
            
            return web.json_response({
                "websocket_url": ws_url,
                "agent_id": agent_id,
                "status": "ready"
            })
            
        except Exception as e:
            logger.error(f"Start conversation error: {str(e)}")
            return web.json_response(
                {"error": str(e)}, 
                status=500
            )
    
    async def end_conversation_handler(self, request: Request) -> web.Response:
        """
        HTTP endpoint to end a conversation
        """
        try:
            data = await request.json()
            conversation_id = data.get('conversation_id')
            
            if not conversation_id:
                return web.json_response(
                    {"error": "conversation_id is required"}, 
                    status=400
                )
            
            await self.elevenlabs_proxy.end_conversation(conversation_id)
            
            return web.json_response({
                "conversation_id": conversation_id,
                "status": "ended"
            })
            
        except Exception as e:
            logger.error(f"End conversation error: {str(e)}")
            return web.json_response(
                {"error": str(e)}, 
                status=500
            )
    
    async def health_check(self, request: Request) -> web.Response:
        """
        Health check endpoint
        """
        return web.json_response({
            "status": "healthy",
            "service": "elevenlabs-proxy",
            "active_conversations": len(self.elevenlabs_proxy.active_connections)
        })

def main():
    """
    Main entry point
    """
    # Get API key from environment variable
    api_key = os.getenv('ELEVENLABS_API_KEY')
    if not api_key:
        logger.error("ELEVENLABS_API_KEY environment variable is required")
        return
    
    # Create and run server
    server = ConversationServer(api_key)
    
    logger.info("Starting ElevenLabs Proxy Server on http://localhost:8000")
    web.run_app(server.app, host='localhost', port=8000)

if __name__ == '__main__':
    main()