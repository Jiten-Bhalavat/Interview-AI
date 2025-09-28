import { useState, useRef } from "react";
import { useConversation } from "@11labs/react";
import { VoiceButton } from "./VoiceButton";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { TranscriptEntry, transcribeAudio, analyzeInterview } from "@/lib/openai";
import { useAuth } from "@/contexts/AuthContext";
import { doc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useNavigate } from "react-router-dom";
import { BarChart3 } from "lucide-react";

interface ConversationInterfaceProps {
  agentId?: string;
  apiKey?: string;
  onInterviewComplete?: (sessionId: string, analysis: any) => void;
}

export const ConversationInterface = ({ agentId, apiKey, onInterviewComplete }: ConversationInterfaceProps) => {
  const { toast } = useToast();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [sessionId, setSessionId] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [finalSessionId, setFinalSessionId] = useState<string>("");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Generate session ID when starting interview
  const generateSessionId = () => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    return `interview_${timestamp}_${random}`;
  };

  // Add transcript entry
  const addToTranscript = (speaker: 'user' | 'ai', message: string) => {
    const entry: TranscriptEntry = {
      speaker,
      message,
      timestamp: Date.now()
    };
    setTranscript(prev => [...prev, entry]);
  };

  // Start audio recording for user speech
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        try {
          const transcribedText = await transcribeAudio(audioBlob);
          if (transcribedText.trim()) {
            addToTranscript('user', transcribedText);
          }
        } catch (error) {
          console.error('Transcription failed:', error);
          // Add fallback entry on failure
          addToTranscript('user', '[Speech recorded - transcription failed]');
        }
      };

      mediaRecorder.start();
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  };

  // Stop audio recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  // Save transcript to Firebase
  const saveTranscriptToFirebase = async (sessionId: string, transcript: TranscriptEntry[]) => {
    if (!currentUser) {
      console.error('Cannot save transcript: No current user');
      throw new Error('No authenticated user');
    }

    if (!sessionId) {
      console.error('Cannot save transcript: No session ID');
      throw new Error('No session ID provided');
    }

    if (!transcript || transcript.length === 0) {
      console.error('Cannot save transcript: Empty transcript');
      throw new Error('Empty transcript');
    }

    try {
      console.log('Saving transcript with sessionId:', sessionId);
      console.log('User ID:', currentUser.uid);
      console.log('Transcript entries:', transcript.length);
      
      const sessionRef = doc(db, 'interview_sessions', sessionId);
      const sessionData = {
        userId: currentUser.uid,
        transcript,
        startTime: transcript[0]?.timestamp || Date.now(),
        endTime: Date.now(),
        status: 'completed',
        createdAt: new Date().toISOString()
      };
      
      console.log('Session data to save:', sessionData);
      await setDoc(sessionRef, sessionData);
      console.log('✅ Transcript saved successfully to Firebase');
      
    } catch (error) {
      console.error('❌ Failed to save transcript to Firebase:', error);
      throw error;
    }
  };

  // Analyze interview and save results
  const analyzeAndSaveInterview = async (sessionId: string, transcript: TranscriptEntry[]) => {
    if (!currentUser) {
      console.error('Cannot analyze: No current user');
      return;
    }
    
    if (!transcript || transcript.length === 0) {
      console.error('Cannot analyze: Empty transcript');
      return;
    }

    setIsAnalyzing(true);
    try {
      console.log('Starting interview analysis...');
      console.log('Transcript for analysis:', transcript);
      
      const analysis = await analyzeInterview(transcript);
      console.log('Analysis result:', analysis);

      // Save analysis to Firebase
      console.log('Saving analysis to Firebase...');
      const sessionRef = doc(db, 'interview_sessions', sessionId);
      await updateDoc(sessionRef, {
        analysis,
        analyzedAt: new Date().toISOString()
      });
      console.log('✅ Analysis saved successfully to Firebase');

      toast({
        title: "Analysis Complete! 📊",
        description: `Interview scored ${analysis.overallScore}/100. View detailed feedback in your results.`,
      });

      setAnalysisComplete(true);
      setFinalSessionId(sessionId);

      // Callback to parent component
      if (onInterviewComplete) {
        onInterviewComplete(sessionId, analysis);
      }

    } catch (error) {
      console.error('❌ Analysis failed:', error);
      toast({
        title: "Analysis Failed",
        description: "Interview saved but analysis failed. You can review the transcript.",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const conversation = useConversation({
    onConnect: () => {
      console.log("Connected to conversation");
      // Generate new session ID for this interview
      const newSessionId = generateSessionId();
      setSessionId(newSessionId);
      setTranscript([]);

      toast({
        title: "Interview Started! 🎤",
        description: "Your responses are being recorded for analysis",
      });
    },
    onDisconnect: async (reason) => {
      console.log("Disconnected from conversation. Reason:", reason);
      setIsListening(false);
      stopRecording();

      // Get the current transcript state
      const currentTranscript = transcript;
      const currentSessionId = sessionId;
      
      console.log("onDisconnect - Session ID:", currentSessionId);
      console.log("onDisconnect - Transcript length:", currentTranscript.length);
      console.log("onDisconnect - Current User:", currentUser?.uid);

      // Save transcript and analyze if we have content
      if (currentTranscript.length > 0 && currentSessionId && currentUser) {
        console.log("Saving transcript to Firebase...");
        try {
          await saveTranscriptToFirebase(currentSessionId, currentTranscript);
          console.log("Transcript saved successfully");
          
          console.log("Starting interview analysis...");
          await analyzeAndSaveInterview(currentSessionId, currentTranscript);
          console.log("Analysis completed");
        } catch (error) {
          console.error("Error during save/analysis:", error);
          toast({
            title: "Save Error",
            description: "Failed to save interview. Please check console for details.",
            variant: "destructive"
          });
        }
      } else {
        console.log("Not saving - missing data:", {
          transcriptLength: currentTranscript.length,
          sessionId: currentSessionId,
          userId: currentUser?.uid
        });
      }

      toast({
        title: "Interview Ended",
        description: currentTranscript.length > 0 ? "Analyzing your performance..." : "Session completed",
      });
    },
    onMessage: (message) => {
      console.log("Message received:", message);

      // Add AI responses to transcript
      if (message.source === "ai" && message.message) {
        addToTranscript('ai', message.message);
      }

      // Handle user speech detection
      if (message.source === "user") {
        if (message.type === "user_started_speaking") {
          setIsListening(true);
          startRecording();
        } else if (message.type === "user_stopped_speaking") {
          setIsListening(false);
          stopRecording();
        }
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
                      : isAnalyzing
                      ? "bg-blue-500 animate-pulse"
                      : "bg-muted"
                  }`}
                />
                <span className="text-sm font-medium capitalize">
                  {isAnalyzing
                    ? "Analyzing..."
                    : conversation.status === "connected"
                    ? "Connected"
                    : "Disconnected"
                  }
                </span>
              </div>

              {conversation.status === "connected" && (
                <p className="text-xs text-muted-foreground">
                  {conversation.isSpeaking
                    ? "AI is speaking..."
                    : isListening
                    ? "🎤 Recording your response..."
                    : "Ready for conversation"
                  }
                </p>
              )}

              {isAnalyzing && (
                <p className="text-xs text-muted-foreground">
                  📊 Analyzing your interview performance...
                </p>
              )}

              {transcript.length > 0 && conversation.status !== "connected" && !isAnalyzing && (
                <p className="text-xs text-green-600">
                  ✅ {transcript.length} exchanges recorded
                </p>
              )}
            </div>

            {/* Debug Information */}
            {transcript.length > 0 && (
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                  Debug: {transcript.length} messages recorded | Session: {sessionId || 'none'}
                </p>
                {sessionId && transcript.length > 0 && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={async () => {
                      try {
                        console.log("Manual save triggered");
                        await saveTranscriptToFirebase(sessionId, transcript);
                        await analyzeAndSaveInterview(sessionId, transcript);
                        toast({
                          title: "Manual Save Complete",
                          description: "Interview saved and analyzed manually"
                        });
                      } catch (error) {
                        console.error("Manual save failed:", error);
                        toast({
                          title: "Manual Save Failed", 
                          description: String(error),
                          variant: "destructive"
                        });
                      }
                    }}
                  >
                    💾 Manual Save & Analyze
                  </Button>
                )}
              </div>
            )}

            {/* Results Button */}
            {analysisComplete && finalSessionId && (
              <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                <p className="text-sm text-green-700 dark:text-green-300 mb-3">
                  ✅ Your interview analysis is ready!
                </p>
                <Button
                  onClick={() => navigate(`/interview-results/${finalSessionId}`)}
                  className="w-full"
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  View Detailed Results
                </Button>
              </div>
            )}

            {/* Configuration Notice */}
            {!agentId && !analysisComplete && (
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