import { Link } from "react-router-dom";
import { Play, BarChart3, Clock, Target, TrendingUp, CheckCircle2, Calendar, FileText, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import UserProfile from "@/components/UserProfile";
import Sidebar from "@/components/Sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { useInterviewQuota } from "@/contexts/InterviewQuotaContext";
import { useState, useEffect } from "react";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { InterviewAnalysis } from "@/lib/openai";

interface InterviewSession {
  id: string;
  userId: string;
  transcript: any[];
  analysis: InterviewAnalysis | null;
  startTime: number;
  endTime: number;
  status: string;
  createdAt: string;
  analyzedAt?: string;
}

const Dashboard = () => {
  const { userProfile, currentUser } = useAuth();
  const { quota, loading: quotaLoading } = useInterviewQuota();
  const [interviewSessions, setInterviewSessions] = useState<InterviewSession[]>([]);
  const [loadingInterviews, setLoadingInterviews] = useState(true);

  const firstName = userProfile?.displayName?.split(" ")[0] || "there";

  // Fetch user's interview sessions
  const fetchInterviewSessions = async () => {
    if (!currentUser) {
      console.log('Dashboard: No current user, skipping fetch');
      setLoadingInterviews(false);
      return;
    }

    console.log('Dashboard: Fetching interview sessions for user:', currentUser.uid);
    
    try {
      // First try without orderBy to avoid index issues
      const q = query(
        collection(db, 'interview_sessions'),
        where('userId', '==', currentUser.uid)
      );
      
      console.log('Dashboard: Executing query...');
      const querySnapshot = await getDocs(q);
      console.log('Dashboard: Query completed, found', querySnapshot.size, 'documents');
      
      const sessions: InterviewSession[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        console.log('Dashboard: Found session:', doc.id, data);
        sessions.push({
          id: doc.id,
          ...data
        } as InterviewSession);
      });
      
      // Sort in memory instead of using orderBy
      sessions.sort((a, b) => (b.endTime || 0) - (a.endTime || 0));
      
      console.log('Dashboard: Final sessions array:', sessions);
      setInterviewSessions(sessions);
    } catch (error) {
      console.error('Dashboard: Error fetching interview sessions:', error);
    } finally {
      setLoadingInterviews(false);
    }
  };

  useEffect(() => {
    fetchInterviewSessions();
  }, [currentUser]);

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
              <h1 className="text-xl font-semibold">Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" asChild>
                <Link to="/community">Community</Link>
              </Button>
              <UserProfile size="md" />
            </div>
          </div>
        </nav>

        <div className="flex-1 p-6 overflow-auto">
          {/* Welcome Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold mb-2">Welcome back, {firstName}! 👋</h2>
                <p className="text-muted-foreground">
                  Ready to practice and improve your interview skills? Let's get started.
                </p>
              </div>
              {!quotaLoading && (
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Interviews remaining</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {Math.max(0, quota.total - interviewSessions.length)}/{quota.total}
                  </p>
                  {interviewSessions.length > 0 && (
                    <p className="text-xs text-green-600">
                      {interviewSessions.length} completed this month
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Play className="w-5 h-5 mr-2" />
                  Start Practice
                </CardTitle>
                <CardDescription>
                  Begin a new AI-powered mock interview session
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  className="w-full"
                  asChild
                  disabled={!quotaLoading && interviewSessions.length >= quota.total}
                >
                  <Link to="/practice">
                    {interviewSessions.length >= quota.total ? 'Monthly Limit Reached' : 'Start Interview'}
                  </Link>
                </Button>
                {!quotaLoading && interviewSessions.length >= quota.total && (
                  <p className="text-xs text-red-600 mt-2 text-center">
                    Monthly limit reached ({interviewSessions.length}/{quota.total}). Resets {new Date(quota.resetDate).toLocaleDateString()}
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2" />
                  View Analytics
                </CardTitle>
                <CardDescription>
                  Detailed performance analysis and insights
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  className="w-full"
                  asChild
                  disabled={interviewSessions.length === 0}
                >
                  <Link to="/analytics">
                    {interviewSessions.length === 0 ? 'Complete Interview First' : 'View Analytics'}
                  </Link>
                </Button>
                {interviewSessions.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-green-600 text-center mb-2">
                      {interviewSessions.filter(s => s.analysis).length} sessions with analysis
                    </p>
                    <Button variant="ghost" size="sm" className="w-full" asChild>
                      <a href="#practice-history">View Sessions Below</a>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="w-5 h-5 mr-2" />
                Set Goals
              </CardTitle>
              <CardDescription>
                Define your interview preparation targets
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" disabled>
                Coming Soon
              </Button>
            </CardContent>
          </Card>
        </div>

          {/* Stats Overview */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Interviews Used</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loadingInterviews ? '...' : interviewSessions.length}
                </div>
                <p className="text-xs text-muted-foreground">
                  This month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Score</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(() => {
                    const analyzedSessions = interviewSessions.filter(s => s.analysis);
                    if (analyzedSessions.length === 0) return '-';
                    const avgScore = analyzedSessions.reduce((sum, s) => sum + (s.analysis?.overallScore || 0), 0) / analyzedSessions.length;
                    return Math.round(avgScore);
                  })()}
                </div>
                <p className="text-xs text-muted-foreground">
                  {interviewSessions.filter(s => s.analysis).length === 0 
                    ? 'Start practicing to see scores'
                    : `Based on ${interviewSessions.filter(s => s.analysis).length} session${interviewSessions.filter(s => s.analysis).length !== 1 ? 's' : ''}`
                  }
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Quota Remaining</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loadingInterviews ? '...' : Math.max(0, quota.total - interviewSessions.length)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Until {!quotaLoading && new Date(quota.resetDate).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Getting Started - Only show if no sessions completed */}
          {interviewSessions.length === 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Getting Started</CardTitle>
                <CardDescription>
                  Follow these steps to make the most of your interview practice
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-sm font-semibold text-blue-600">
                      1
                    </div>
                    <div>
                      <h4 className="font-medium">Complete your first practice session</h4>
                      <p className="text-sm text-muted-foreground">
                        Start with a quick practice to get familiar with the AI interviewer
                      </p>
                    </div>
                    <Badge variant="secondary">
                      Pending
                    </Badge>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center text-sm font-semibold text-gray-500">
                      2
                    </div>
                    <div>
                      <h4 className="font-medium text-muted-foreground">Review your performance</h4>
                      <p className="text-sm text-muted-foreground">
                        Analyze your responses and get personalized feedback
                      </p>
                    </div>
                    <Badge variant="outline">Next Step</Badge>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center text-sm font-semibold text-gray-500">
                      3
                    </div>
                    <div>
                      <h4 className="font-medium text-muted-foreground">Practice regularly</h4>
                      <p className="text-sm text-muted-foreground">
                        Set up a practice schedule to continuously improve
                      </p>
                    </div>
                    <Badge variant="outline">Future</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Practice History Detail Section */}
          {interviewSessions.length > 0 && (
            <Card id="practice-history" className="mt-8">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center">
                      <BarChart3 className="w-5 h-5 mr-2" />
                      Recent Interview Sessions
                    </CardTitle>
                    <CardDescription>
                      Your latest practice sessions and analysis results
                    </CardDescription>
                  </div>
                  <Badge variant="outline">
                    {interviewSessions.length} total
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {interviewSessions.slice(0, 5).map((session) => (
                    <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                          {session.analysis ? (
                            <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                          ) : (
                            <FileText className="w-5 h-5 text-gray-500" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <p className="font-medium">
                              Interview Session
                            </p>
                            {session.analysis ? (
                              <Badge variant="default" className="text-xs">
                                Score: {session.analysis.overallScore}/100
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-xs">
                                Transcript Only
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <span className="flex items-center">
                              <Calendar className="w-3 h-3 mr-1" />
                              {new Date(session.endTime).toLocaleDateString()}
                            </span>
                            <span>
                              {session.transcript?.length || 0} exchanges
                            </span>
                            {session.analyzedAt && (
                              <span className="text-green-600 text-xs">
                                ✓ Analyzed
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button size="sm" variant="outline" asChild>
                          <Link to={`/interview-results/${session.id}`}>
                            <FileText className="w-3 h-3 mr-1" />
                            View Details
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  {interviewSessions.length > 5 && (
                    <div className="text-center pt-4">
                      <p className="text-sm text-muted-foreground">
                        Showing 5 of {interviewSessions.length} sessions
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;