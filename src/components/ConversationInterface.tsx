import { useState } from "react";
import { useConversation } from "@11labs/react";
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

  const conversation = useConversation({
    onConnect: () => {
      console.log("Connected to conversation");
      toast({
        title: "Connected",
        description: "Voice conversation started successfully",
      });
    },
    onDisconnect: (reason) => {
      console.log("Disconnected from conversation. Reason:", reason);
      setIsListening(false);
      toast({
        title: "Disconnected",
        description: `Voice conversation ended${reason ? `: ${reason}` : ''}`,
      });
    },
    onMessage: (message) => {
      console.log("Message received:", message);
      // Handle messages - when user stops speaking
      if (message.source === "user") {
        setIsListening(false);
      }
    },
    onError: (error) => {
      console.error("Conversation error:", error);
      toast({
        title: "Error",
        description: "An error occurred during the conversation",
        variant: "destructive",
      });
    },
  });

  const handleVoiceToggle = async () => {
    if (conversation.status === "connected") {
      await conversation.endSession();
    } else {
      if (!agentId) {
        toast({
          title: "Agent ID Required",
          description: "Please add your ElevenLabs Agent ID to start conversations",
          variant: "destructive",
        });
        return;
      }

      if (!apiKey) {
        toast({
          title: "API Key Required", 
          description: "ElevenLabs API key is required for authentication",
          variant: "destructive",
        });
        return;
      }

      try {
        // Request microphone permission
        await navigator.mediaDevices.getUserMedia({ audio: true });
        
        // Try without authorization first (for public agents)
        await conversation.startSession({ 
          agentId: agentId
        });
        setIsListening(true);
      } catch (error) {
        console.error("Failed to start conversation:", error);
        toast({
          title: "Connection Failed",
          description: error instanceof Error ? error.message : "Failed to connect to ElevenLabs",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full bg-background p-8">
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
              isConnected={conversation.status === "connected"}
              isSpeaking={conversation.isSpeaking}
              isListening={isListening}
              onClick={handleVoiceToggle}
              disabled={!agentId}
            />

            {/* Status Display */}
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center space-x-2">
                <div 
                  className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                    conversation.status === "connected" 
                      ? "bg-green-500 shadow-voice animate-pulse" 
                      : "bg-muted"
                  }`} 
                />
                <span className="text-sm font-medium capitalize">
                  {conversation.status === "connected" ? "Connected" : "Disconnected"}
                </span>
              </div>
              
              {conversation.status === "connected" && (
                <p className="text-xs text-muted-foreground">
                  {conversation.isSpeaking 
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