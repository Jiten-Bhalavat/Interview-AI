# ElevenLabs Conversational AI Python Backend

A Python backend server that proxies connections to ElevenLabs Conversational AI WebSocket API, providing real-time voice conversation capabilities for your frontend applications.

## Features

- **WebSocket Proxy**: Seamless proxy between your frontend and ElevenLabs
- **Real-time Audio**: Handles audio streaming in both directions
- **Authentication**: Manages ElevenLabs API key authentication
- **Conversation Management**: Tracks and manages multiple simultaneous conversations
- **Error Handling**: Robust error handling and connection management
- **CORS Support**: Configurable CORS for frontend integration

## Installation

1. **Clone or copy the backend files to your project**

2. **Install dependencies**:
```bash
pip install -r requirements.txt
```

3. **Set up environment variables**:
```bash
cp .env.example .env
# Edit .env with your ElevenLabs API key
```

4. **Run the server**:
```bash
python main.py
```

The server will start on `http://localhost:8000`

## Configuration

### Environment Variables

Create a `.env` file with the following variables:

```env
# Required
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here

# Optional
SERVER_HOST=localhost
SERVER_PORT=8000
DEBUG=false
CORS_ORIGINS=*
```

## API Endpoints

### WebSocket Connection
- **URL**: `ws://localhost:8000/ws/conversation?agent_id={agent_id}`
- **Purpose**: Real-time voice conversation
- **Parameters**: 
  - `agent_id`: Your ElevenLabs agent ID

### HTTP Endpoints

#### Start Conversation
- **POST** `/api/conversation/start`
- **Body**: `{"agent_id": "your_agent_id"}`
- **Response**: `{"websocket_url": "ws://...", "agent_id": "...", "status": "ready"}`

#### End Conversation  
- **POST** `/api/conversation/end`
- **Body**: `{"conversation_id": "conversation_id"}`
- **Response**: `{"conversation_id": "...", "status": "ended"}`

#### Health Check
- **GET** `/api/health`
- **Response**: `{"status": "healthy", "service": "elevenlabs-proxy", "active_conversations": 0}`

## WebSocket Message Format

### Client to Server

**Start Recording**:
```json
{
  "type": "start_recording",
  "conversation_id": "conversation_id"
}
```

**Audio Data**:
```json
{
  "type": "audio_data", 
  "data": "base64_encoded_audio",
  "conversation_id": "conversation_id"
}
```

**Stop Recording**:
```json
{
  "type": "stop_recording",
  "conversation_id": "conversation_id"
}
```

### Server to Client

**Connection Established**:
```json
{
  "type": "connection_established",
  "conversation_id": "unique_id", 
  "status": "connected"
}
```

**Audio Response**:
```json
{
  "type": "audio_response",
  "data": "base64_encoded_audio",
  "conversation_id": "conversation_id",
  "timestamp": 1234567890.123
}
```

**Error**:
```json
{
  "type": "error",
  "message": "Error description"
}
```

## Frontend Integration

Update your TypeScript frontend to connect to the Python backend instead of directly to ElevenLabs:

```typescript
// Replace the ElevenLabs WebSocket URL with your Python backend
const websocketUrl = `ws://localhost:8000/ws/conversation?agent_id=${agentId}`;

// Connect to Python backend instead of ElevenLabs directly
const ws = new WebSocket(websocketUrl);
```

## Architecture

```
Frontend (TypeScript) 
    ↕ WebSocket
Python Backend Server
    ↕ WebSocket  
ElevenLabs API
```

The Python backend acts as a proxy, handling:
- Authentication with ElevenLabs
- WebSocket connection management
- Audio data forwarding
- Error handling and reconnection
- Conversation state management

## Testing

Test the WebSocket connection using the included client:

```bash
python websocket_client.py
```

## File Structure

```
python_backend/
├── main.py              # Main server application
├── config.py            # Configuration management
├── audio_handler.py     # Audio streaming logic  
├── websocket_client.py  # Test client
├── requirements.txt     # Python dependencies
├── .env.example        # Environment variables template
└── README.md           # This file
```

## Dependencies

- **aiohttp**: Async HTTP server framework
- **websockets**: WebSocket client library
- **python-dotenv**: Environment variable management
- **uvloop**: High-performance event loop (optional)

## Security Notes

- Store your ElevenLabs API key securely in environment variables
- Use HTTPS/WSS in production
- Configure CORS appropriately for your frontend domain
- Consider rate limiting for production use

## Troubleshooting

### Common Issues

1. **Connection Failed**: Check your ElevenLabs API key and agent ID
2. **CORS Errors**: Update `CORS_ORIGINS` in your `.env` file
3. **Audio Issues**: Ensure proper base64 encoding of audio data
4. **WebSocket Timeouts**: Check network connectivity to ElevenLabs

### Logs

Enable debug logging by setting `DEBUG=true` in your `.env` file for detailed connection and message logs.

## Production Deployment

For production deployment:

1. Use a production WSGI server like Gunicorn with uvloop
2. Set up proper logging and monitoring
3. Use environment-specific configuration
4. Implement rate limiting and authentication
5. Use HTTPS/WSS with proper SSL certificates

Example production command:
```bash
gunicorn main:app --worker-class aiohttp.GunicornWebWorker --bind 0.0.0.0:8000
```