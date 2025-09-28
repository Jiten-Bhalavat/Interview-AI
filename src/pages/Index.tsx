import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Mic, ArrowLeft } from "lucide-react";
import { ConversationInterface } from "@/components/ConversationInterface";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import UserProfile from "@/components/UserProfile";
import Sidebar from "@/components/Sidebar";
import { useInterviewQuota } from "@/contexts/InterviewQuotaContext";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [hasStarted, setHasStarted] = useState(false);
  const { quota, useInterview, loading } = useInterviewQuota();
  const { toast } = useToast();

  // Your ElevenLabs API key from environment variables
  const apiKey = import.meta.env.VITE_ELEVENLABS_API_KEY;

  // You'll need to create a Conversational AI agent in ElevenLabs UI and get the agent ID
  const agentId = import.meta.env.VITE_ELEVENLABS_AGENT_ID;

  const remainingInterviews = Math.max(0, quota.total - quota.used);

  const handleStartInterview = async () => {
    console.log('Starting interview...', { quota, loading });

    if (quota.used >= quota.total) {
      toast({
        title: "Interview quota reached",
        description: "You've used all your interviews for this month. Your quota will reset next month.",
        variant: "destructive",
      });
      return;
    }

    try {
      // For now, let's start the interview directly and update quota afterwards
      setHasStarted(true);

      // Try to update quota in background
      const success = await useInterview();
      if (success) {
        toast({
          title: "Interview started",
          description: `You have ${remainingInterviews - 1} interviews remaining this month.`,
        });
      } else {
        console.warn('Failed to update quota, but interview started');
        toast({
          title: "Interview started",
          description: "Interview session has begun.",
        });
      }
    } catch (error) {
      console.error('Error starting interview:', error);
      toast({
        title: "Failed to start interview",
        description: "There was an error starting your interview. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (hasStarted) {
    return (
      <div className="min-h-screen bg-background flex">
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Top Navigation */}
          <nav className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="px-6 h-16 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button variant="ghost" size="sm" onClick={() => setHasStarted(false)}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  End Interview
                </Button>
                <h1 className="text-xl font-semibold">Live Interview Session</h1>
              </div>
              <UserProfile size="md" />
            </div>
          </nav>

          {/* Interview Interface */}
          <div className="flex-1">
            <ConversationInterface agentId={agentId} apiKey={apiKey} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Navigation */}
        <nav className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="px-6 h-16 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/dashboard">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Link>
              </Button>
              <h1 className="text-xl font-semibold">AI Interview Practice</h1>
            </div>
            <UserProfile size="md" />
          </div>
        </nav>

        {/* Content */}
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md w-full space-y-6">
            <Card>
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mic className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-2xl">Ready to Practice?</CardTitle>
                <CardDescription>
                  Start your AI-powered mock interview session. You'll get real-time feedback and personalized questions.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted/50 rounded-lg p-4 text-center">
                  <p className="text-sm text-muted-foreground mb-1">Interviews remaining this month</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {loading ? '...' : remainingInterviews}/{quota.total}
                  </p>
                </div>

                <Button
                  onClick={handleStartInterview}
                  disabled={loading || quota.used >= quota.total}
                  className="w-full"
                  size="lg"
                >
                  {quota.used >= quota.total ? 'Quota Reached' : 'Start Interview Session'}
                </Button>


                {quota.used >= quota.total && (
                  <p className="text-xs text-red-600 text-center">
                    Your monthly interview quota has been reached. It will reset on{' '}
                    {new Date(quota.resetDate).toLocaleDateString()}.
                  </p>
                )}

                <div className="text-center text-sm text-muted-foreground">
                  <p>💡 Tip: Use this session to practice common interview questions</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
