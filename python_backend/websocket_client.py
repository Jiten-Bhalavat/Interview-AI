"""
WebSocket client for testing the ElevenLabs proxy server
"""

import asyncio
import json
import logging
import websockets
from typing import Optional

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ElevenLabsClient:
    """
    Client for testing ElevenLabs proxy WebSocket connection
    """
    
    def __init__(self, server_url: str = "ws://localhost:8000"):
        self.server_url = server_url
        self.websocket: Optional[websockets.WebSocketServerProtocol] = None
        self.conversation_id: Optional[str] = None
        
    async def connect(self, agent_id: str):
        """
        Connect to the proxy server
        """
        try:
            url = f"{self.server_url}/ws/conversation?agent_id={agent_id}"
            logger.info(f"Connecting to {url}")
            
            self.websocket = await websockets.connect(url)
            logger.info("Connected to proxy server")
            
            # Start listening for messages
            asyncio.create_task(self._listen_for_messages())
            
        except Exception as e:
            logger.error(f"Failed to connect: {str(e)}")
            raise
    
    async def _listen_for_messages(self):
        """
        Listen for messages from the server
        """
        try:
            async for message in self.websocket:
                data = json.loads(message)
                await self._handle_server_message(data)
                
        except websockets.exceptions.ConnectionClosed:
            logger.info("Connection closed by server")
        except Exception as e:
            logger.error(f"Error listening for messages: {str(e)}")
    
    async def _handle_server_message(self, data: dict):
        """
        Handle messages received from server
        """
        message_type = data.get("type")
        
        if message_type == "connection_established":
            self.conversation_id = data.get("conversation_id")
            logger.info(f"Connection established, conversation ID: {self.conversation_id}")
            
        elif message_type == "audio_response":
            logger.info("Received audio response from ElevenLabs")
            # Here you would handle audio playback
            
        elif message_type == "conversation_ended":
            logger.info("Conversation ended by server")
            
        elif message_type == "error":
            logger.error(f"Server error: {data.get('message')}")
            
        else:
            logger.info(f"Received message: {data}")
    
    async def send_audio(self, audio_data: bytes):
        """
        Send audio data to the server
        """
        if not self.websocket:
            raise RuntimeError("Not connected to server")
        
        import base64
        message = {
            "type": "audio_data",
            "data": base64.b64encode(audio_data).decode('utf-8'),
            "conversation_id": self.conversation_id
        }
        
        await self.websocket.send(json.dumps(message))
        logger.debug(f"Sent {len(audio_data)} bytes of audio")
    
    async def start_recording(self):
        """
        Start recording audio
        """
        if not self.websocket:
            raise RuntimeError("Not connected to server")
        
        message = {
            "type": "start_recording",
            "conversation_id": self.conversation_id
        }
        
        await self.websocket.send(json.dumps(message))
        logger.info("Started recording")
    
    async def stop_recording(self):
        """
        Stop recording audio
        """
        if not self.websocket:
            raise RuntimeError("Not connected to server")
        
        message = {
            "type": "stop_recording",
            "conversation_id": self.conversation_id
        }
        
        await self.websocket.send(json.dumps(message))
        logger.info("Stopped recording")
    
    async def disconnect(self):
        """
        Disconnect from server
        """
        if self.websocket:
            await self.websocket.close()
            logger.info("Disconnected from server")

# Example usage and testing
async def test_client():
    """
    Test the ElevenLabs client
    """
    agent_id = "agent_01jzmh18bxfn8s6dn76bzv8rwb"  # Your agent ID
    
    client = ElevenLabsClient()
    
    try:
        # Connect to server
        await client.connect(agent_id)
        
        # Wait a bit for connection to establish
        await asyncio.sleep(2)
        
        # Start recording
        await client.start_recording()
        
        # Simulate sending some audio data
        # In a real implementation, you'd capture this from microphone
        fake_audio = b"fake_audio_data_here" * 100
        await client.send_audio(fake_audio)
        
        # Wait a bit
        await asyncio.sleep(5)
        
        # Stop recording
        await client.stop_recording()
        
        # Keep connection alive for a bit to receive responses
        await asyncio.sleep(10)
        
    except Exception as e:
        logger.error(f"Test failed: {str(e)}")
    finally:
        await client.disconnect()

if __name__ == "__main__":
    asyncio.run(test_client())