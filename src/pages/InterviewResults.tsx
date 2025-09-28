import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Download, Share2 } from "lucide-react";
import InterviewAnalysisComponent from "@/components/InterviewAnalysis";
import { InterviewAnalysis, TranscriptEntry } from "@/lib/openai";
import Sidebar from "@/components/Sidebar";

const InterviewResults = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [analysis, setAnalysis] = useState<InterviewAnalysis | null>(null);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const fetchInterviewData = async () => {
      if (!sessionId || !currentUser) {
        setError("Session ID or user authentication missing");
        setLoading(false);
        return;
      }

      try {
        const sessionRef = doc(db, 'interview_sessions', sessionId);
        const sessionDoc = await getDoc(sessionRef);

        if (!sessionDoc.exists()) {
          setError("Interview session not found");
          setLoading(false);
          return;
        }

        const sessionData = sessionDoc.data();

        // Check if user owns this session
        if (sessionData.userId !== currentUser.uid) {
          setError("Unauthorized access to this interview session");
          setLoading(false);
          return;
        }

        setTranscript(sessionData.transcript || []);
        setAnalysis(sessionData.analysis || null);
      } catch (err) {
        console.error("Error fetching interview data:", err);
        setError("Failed to load interview data");
      } finally {
        setLoading(false);
      }
    };

    fetchInterviewData();
  }, [sessionId, currentUser]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <Card className="max-w-md">
            <CardContent className="p-8 text-center">
              <div className="w-8 h-8 bg-blue-500 rounded-full animate-pulse mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold mb-2">Loading Interview Results</h3>
              <p className="text-muted-foreground">Please wait while we fetch your analysis...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <Card className="max-w-md">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ArrowLeft className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Error Loading Results</h3>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={() => navigate('/dashboard')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="min-h-screen bg-background flex">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <Card className="max-w-md">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Share2 className="w-8 h-8 text-yellow-500" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Analysis Pending</h3>
              <p className="text-muted-foreground mb-4">
                Your interview was recorded but analysis is still processing or failed.
              </p>
              <div className="space-y-2">
                <Button onClick={() => navigate('/dashboard')} className="w-full">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
                <Button variant="outline" onClick={() => window.location.reload()} className="w-full">
                  Refresh Results
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <div className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="px-6 h-16 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
              <h1 className="text-xl font-semibold">Interview Analysis</h1>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export PDF
              </Button>
              <Button variant="outline" size="sm">
                <Share2 className="w-4 h-4 mr-2" />
                Share Results
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <InterviewAnalysisComponent
            analysis={analysis}
            transcript={transcript}
            sessionId={sessionId || "unknown"}
          />
        </div>
      </div>
    </div>
  );
};

export default InterviewResults;