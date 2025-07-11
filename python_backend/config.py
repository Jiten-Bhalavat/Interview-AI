"""
Configuration settings for ElevenLabs Proxy Server
"""

import os
from dataclasses import dataclass
from typing import Optional

@dataclass
class ElevenLabsConfig:
    """ElevenLabs API configuration"""
    api_key: str
    base_url: str = "https://api.elevenlabs.io"
    websocket_url: str = "wss://api.elevenlabs.io"
    api_version: str = "v1"
    
    @property
    def conversation_endpoint(self) -> str:
        return f"{self.base_url}/{self.api_version}/convai/conversation"
    
    @property
    def websocket_endpoint(self) -> str:
        return f"{self.websocket_url}/{self.api_version}/convai/conversation"

@dataclass
class ServerConfig:
    """Server configuration"""
    host: str = "localhost"
    port: int = 8000
    debug: bool = False
    cors_origins: list = None
    
    def __post_init__(self):
        if self.cors_origins is None:
            self.cors_origins = ["*"]

def load_config() -> tuple[ElevenLabsConfig, ServerConfig]:
    """
    Load configuration from environment variables
    """
    # Load environment variables from .env file if present
    try:
        from dotenv import load_dotenv
        load_dotenv()
    except ImportError:
        pass
    
    # ElevenLabs configuration
    api_key = os.getenv('ELEVENLABS_API_KEY')
    if not api_key:
        raise ValueError("ELEVENLABS_API_KEY environment variable is required")
    
    elevenlabs_config = ElevenLabsConfig(
        api_key=api_key,
        base_url=os.getenv('ELEVENLABS_BASE_URL', "https://api.elevenlabs.io"),
        websocket_url=os.getenv('ELEVENLABS_WS_URL', "wss://api.elevenlabs.io"),
        api_version=os.getenv('ELEVENLABS_API_VERSION', "v1")
    )
    
    # Server configuration
    server_config = ServerConfig(
        host=os.getenv('SERVER_HOST', "localhost"),
        port=int(os.getenv('SERVER_PORT', "8000")),
        debug=os.getenv('DEBUG', "false").lower() == "true",
        cors_origins=os.getenv('CORS_ORIGINS', "*").split(",")
    )
    
    return elevenlabs_config, server_config