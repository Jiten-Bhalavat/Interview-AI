"""
Audio handling utilities for ElevenLabs integration
"""

import asyncio
import json
import logging
import base64
from typing import Dict, Optional, Callable
import websockets

logger = logging.getLogger(__name__)

class AudioStreamHandler:
    """
    Handles audio streaming between client and ElevenLabs
    """
    
    def __init__(self, conversation_id: str):
        self.conversation_id = conversation_id
        self.is_recording = False
        self.is_playing = False
        self.audio_queue = asyncio.Queue()
        
    async def handle_client_audio(self, audio_data: bytes, elevenlabs_ws):
        """
        Process audio data from client and forward to ElevenLabs
        """
        try:
            # ElevenLabs expects audio in specific format
            # For WebRTC/browser audio, we might need to convert format
            
            # Create audio message for ElevenLabs
            audio_message = {
                "type": "audio",
                "data": base64.b64encode(audio_data).decode('utf-8'),
                "timestamp": asyncio.get_event_loop().time()
            }
            
            await elevenlabs_ws.send(json.dumps(audio_message))
            logger.debug(f"Forwarded {len(audio_data)} bytes of audio to ElevenLabs")
            
        except Exception as e:
            logger.error(f"Error handling client audio: {str(e)}")
    
    async def handle_elevenlabs_audio(self, audio_data: bytes, client_ws):
        """
        Process audio data from ElevenLabs and forward to client
        """
        try:
            # Forward audio response to client
            audio_response = {
                "type": "audio_response", 
                "data": base64.b64encode(audio_data).decode('utf-8'),
                "conversation_id": self.conversation_id,
                "timestamp": asyncio.get_event_loop().time()
            }
            
            await client_ws.send_str(json.dumps(audio_response))
            logger.debug(f"Forwarded {len(audio_data)} bytes of audio to client")
            
        except Exception as e:
            logger.error(f"Error handling ElevenLabs audio: {str(e)}")
    
    def start_recording(self):
        """Start recording audio from client"""
        self.is_recording = True
        logger.info(f"Started recording for conversation {self.conversation_id}")
    
    def stop_recording(self):
        """Stop recording audio from client"""
        self.is_recording = False
        logger.info(f"Stopped recording for conversation {self.conversation_id}")
    
    def start_playback(self):
        """Start audio playback to client"""
        self.is_playing = True
        logger.info(f"Started playback for conversation {self.conversation_id}")
    
    def stop_playback(self):
        """Stop audio playback to client"""
        self.is_playing = False
        logger.info(f"Stopped playback for conversation {self.conversation_id}")

class ConversationManager:
    """
    Manages conversation state and audio streams
    """
    
    def __init__(self):
        self.conversations: Dict[str, Dict] = {}
        
    def create_conversation(self, conversation_id: str, client_ws, elevenlabs_ws, agent_id: str):
        """
        Create a new conversation with audio handling
        """
        audio_handler = AudioStreamHandler(conversation_id)
        
        self.conversations[conversation_id] = {
            "client_ws": client_ws,
            "elevenlabs_ws": elevenlabs_ws,
            "agent_id": agent_id,
            "audio_handler": audio_handler,
            "status": "connected",
            "created_at": asyncio.get_event_loop().time()
        }
        
        logger.info(f"Created conversation {conversation_id} for agent {agent_id}")
        return audio_handler
    
    def get_conversation(self, conversation_id: str) -> Optional[Dict]:
        """Get conversation by ID"""
        return self.conversations.get(conversation_id)
    
    async def end_conversation(self, conversation_id: str):
        """End and cleanup conversation"""
        conversation = self.conversations.pop(conversation_id, None)
        if conversation:
            try:
                # Stop audio handling
                if "audio_handler" in conversation:
                    audio_handler = conversation["audio_handler"]
                    audio_handler.stop_recording()
                    audio_handler.stop_playback()
                
                # Close WebSocket connections
                if "elevenlabs_ws" in conversation:
                    await conversation["elevenlabs_ws"].close()
                
                # Notify client
                if "client_ws" in conversation and not conversation["client_ws"].closed:
                    await conversation["client_ws"].send_str(json.dumps({
                        "type": "conversation_ended",
                        "conversation_id": conversation_id,
                        "status": "disconnected"
                    }))
                    
                logger.info(f"Ended conversation {conversation_id}")
                
            except Exception as e:
                logger.error(f"Error ending conversation {conversation_id}: {str(e)}")
    
    async def handle_message(self, conversation_id: str, message_type: str, data: dict):
        """
        Handle different types of messages for a conversation
        """
        conversation = self.get_conversation(conversation_id)
        if not conversation:
            logger.error(f"Conversation {conversation_id} not found")
            return
        
        audio_handler = conversation["audio_handler"]
        client_ws = conversation["client_ws"]
        elevenlabs_ws = conversation["elevenlabs_ws"]
        
        try:
            if message_type == "start_recording":
                audio_handler.start_recording()
                await client_ws.send_str(json.dumps({
                    "type": "recording_started",
                    "conversation_id": conversation_id
                }))
                
            elif message_type == "stop_recording":
                audio_handler.stop_recording()
                await client_ws.send_str(json.dumps({
                    "type": "recording_stopped", 
                    "conversation_id": conversation_id
                }))
                
            elif message_type == "audio_data" and audio_handler.is_recording:
                audio_data = base64.b64decode(data.get("data", ""))
                await audio_handler.handle_client_audio(audio_data, elevenlabs_ws)
                
            elif message_type == "conversation_config":
                # Forward configuration to ElevenLabs
                await elevenlabs_ws.send(json.dumps(data))
                
            else:
                logger.warning(f"Unknown message type: {message_type}")
                
        except Exception as e:
            logger.error(f"Error handling message {message_type}: {str(e)}")
    
    def get_active_conversations(self) -> Dict[str, Dict]:
        """Get all active conversations"""
        return {
            conv_id: {
                "agent_id": conv["agent_id"],
                "status": conv["status"],
                "created_at": conv["created_at"]
            }
            for conv_id, conv in self.conversations.items()
        }