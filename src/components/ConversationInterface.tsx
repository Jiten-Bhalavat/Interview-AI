import { useState, useRef, useCallback, useEffect } from "react";
import { VoiceButton } from "./VoiceButton";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface ConversationInterfaceProps {
  agentId?: string;
  apiKey?: string;
}

export const ConversationInterface = ({ agentId, apiKey }: ConversationInterfaceProps) => {
  const { toast } = useToast();
  const [isListening, setIsListening] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const handleConnect = useCallback(() => {
    console.log("Connected to conversation");
    setIsConnected(true);
    toast({
      title: "Connected",
      description: "Voice conversation started successfully",
    });
  }, [toast]);

  const handleDisconnect = useCallback(() => {
    console.log("Disconnected from conversation");
    setIsConnected(false);
    setIsListening(false);
    setIsSpeaking(false);
    toast({
      title: "Disconnected",
      description: "Voice conversation ended",
    });
  }, [toast]);

  const handleMessage = useCallback((data: any) => {
    console.log("Message received:", data);
    
    if (data.type === "audio_response") {
      setIsSpeaking(true);
    } else if (data.source === "user") {
      setIsListening(false);
    } else if (data.source === "ai") {
      setIsSpeaking(false);
    }
  }, []);

  const handleError = useCallback((error: any) => {
    console.error("Conversation error:", error);
    toast({
      title: "Error",
      description: "An error occurred during the conversation",
      variant: "destructive",
    });
  }, [toast]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        } 
      });
      
      streamRef.current = stream;
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0 && wsRef.current?.readyState === WebSocket.OPEN) {
          // Send binary audio data
          wsRef.current.send(event.data);
        }
      };
      
      mediaRecorder.start(100); // Send data every 100ms
      setIsListening(true);
    } catch (error) {
      console.error("Error starting recording:", error);
      handleError(error);
    }
  }, [handleError]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    setIsListening(false);
  }, []);

  const connectToBackend = useCallback(async () => {
    if (!agentId) {
      toast({
        title: "Agent ID Required",
        description: "Please add your ElevenLabs Agent ID to start conversations",
        variant: "destructive",
      });
      return;
    }

    // Check if Python backend is running
    try {
      const response = await fetch('http://localhost:8000/api/health');
      if (!response.ok) {
        throw new Error('Backend not responding');
      }
    } catch (error) {
      toast({
        title: "Backend Not Running",
        description: "Please start the Python backend: cd python_backend && python main.py",
        variant: "destructive",
      });
      return;
    }

    try {
      // Connect to Python backend WebSocket
      const wsUrl = `ws://localhost:8000/ws/conversation?agent_id=${agentId}`;
      console.log("Connecting to:", wsUrl);
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        console.log("WebSocket connected");
        handleConnect();
        startRecording();
      };
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleMessage(data);
        } catch (error) {
          console.log("Received non-JSON message:", event.data);
        }
      };
      
      ws.onclose = (event) => {
        console.log("WebSocket closed:", event.code, event.reason);
        handleDisconnect();
        stopRecording();
      };
      
      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        handleError(error);
      };
      
      wsRef.current = ws;
      
    } catch (error) {
      console.error("Failed to start conversation:", error);
      toast({
        title: "Connection Failed",
        description: error instanceof Error ? error.message : "Failed to connect to backend",
        variant: "destructive",
      });
    }
  }, [agentId, toast, handleConnect, handleDisconnect, handleMessage, handleError, startRecording, stopRecording]);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    stopRecording();
  }, [stopRecording]);

  const handleVoiceToggle = useCallback(async () => {
    if (isConnected) {
      disconnect();
    } else {
      await connectToBackend();
    }
  }, [isConnected, disconnect, connectToBackend]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            AI Voice Assistant
          </h1>
          <p className="text-muted-foreground text-lg">
            Real-time conversational AI with ultra-low latency
          </p>
        </div>

        {/* Voice Interface Card */}
        <Card className="p-8 bg-card/50 backdrop-blur-sm border-border/50">
          <div className="flex flex-col items-center space-y-6">
            {/* Voice Button */}
            <VoiceButton
              isConnected={isConnected}
              isSpeaking={isSpeaking}
              isListening={isListening}
              onClick={handleVoiceToggle}
              disabled={!agentId}
            />

            {/* Status Display */}
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center space-x-2">
                <div 
                  className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                    isConnected 
                      ? "bg-green-500 shadow-voice animate-pulse" 
                      : "bg-muted"
                  }`} 
                />
                <span className="text-sm font-medium capitalize">
                  {isConnected ? "Connected" : "Disconnected"}
                </span>
              </div>
              
              {isConnected && (
                <p className="text-xs text-muted-foreground">
                  {isSpeaking 
                    ? "AI is speaking..." 
                    : isListening 
                    ? "Listening for your voice..." 
                    : "Ready for conversation"
                  }
                </p>
              )}
            </div>

            {/* Configuration Notice */}
            {!agentId && (
              <div className="text-center p-4 bg-muted/50 rounded-lg border border-border/50">
                <p className="text-sm text-muted-foreground">
                  Configure your ElevenLabs Agent ID to start
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* Instructions */}
        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            Click the button to start a voice conversation
          </p>
          <p className="text-xs text-muted-foreground">
            Target latency: &lt;300ms end-to-end
          </p>
        </div>
      </div>
    </div>
  );
};