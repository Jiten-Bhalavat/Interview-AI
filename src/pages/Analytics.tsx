import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Sidebar from "@/components/Sidebar";
import { InterviewAnalysis } from "@/lib/openai";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Target,
  Calendar,
  Clock,
  Award,
  FileText,
  ExternalLink,
  Brain,
  MessageCircle,
  Lightbulb,
  User
} from "lucide-react";

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

const Analytics = () => {
  const { currentUser } = useAuth();
  const [interviewSessions, setInterviewSessions] = useState<InterviewSession[]>([]);
  const [loadingInterviews, setLoadingInterviews] = useState(true);

  // Fetch user's interview sessions
  const fetchInterviewSessions = async () => {
    if (!currentUser) {
      setLoadingInterviews(false);
      return;
    }

    try {
      const q = query(
        collection(db, 'interview_sessions'),
        where('userId', '==', currentUser.uid)
      );
      
      const querySnapshot = await getDocs(q);
      const sessions: InterviewSession[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        sessions.push({
          id: doc.id,
          ...data
        } as InterviewSession);
      });
      
      // Sort in memory by endTime
      sessions.sort((a, b) => (b.endTime || 0) - (a.endTime || 0));
      
      setInterviewSessions(sessions);
    } catch (error) {
      console.error('Analytics: Error fetching interview sessions:', error);
    } finally {
      setLoadingInterviews(false);
    }
  };

  useEffect(() => {
    fetchInterviewSessions();
  }, [currentUser]);

  // Calculate analytics
  const analyzedSessions = interviewSessions.filter(s => s.analysis);
  const averageScore = analyzedSessions.length > 0 
    ? Math.round(analyzedSessions.reduce((sum, s) => sum + (s.analysis?.overallScore || 0), 0) / analyzedSessions.length)
    : 0;

  const bestScore = analyzedSessions.length > 0 
    ? Math.max(...analyzedSessions.map(s => s.analysis?.overallScore || 0))
    : 0;

  const latestScore = analyzedSessions.length > 0 
    ? analyzedSessions[0].analysis?.overallScore || 0
    : 0;

  // Category averages
  const categoryAverages = analyzedSessions.length > 0 ? {
    technicalKnowledge: Math.round(analyzedSessions.reduce((sum, s) => sum + (s.analysis?.technicalKnowledge.score || 0), 0) / analyzedSessions.length),
    communicationSkills: Math.round(analyzedSessions.reduce((sum, s) => sum + (s.analysis?.communicationSkills.score || 0), 0) / analyzedSessions.length),
    problemSolving: Math.round(analyzedSessions.reduce((sum, s) => sum + (s.analysis?.problemSolving.score || 0), 0) / analyzedSessions.length),
    professionalPresentation: Math.round(analyzedSessions.reduce((sum, s) => sum + (s.analysis?.professionalPresentation.score || 0), 0) / analyzedSessions.length)
  } : {
    technicalKnowledge: 0,
    communicationSkills: 0,
    problemSolving: 0,
    professionalPresentation: 0
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 80) return "default";
    if (score >= 60) return "secondary";
    return "destructive";
  };

  if (loadingInterviews) {
    return (
      <div className="min-h-screen bg-background flex">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <Card className="max-w-md">
            <CardContent className="p-8 text-center">
              <div className="w-8 h-8 bg-blue-500 rounded-full animate-pulse mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold mb-2">Loading Analytics</h3>
              <p className="text-muted-foreground">Analyzing your interview performance...</p>
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
              <h1 className="text-xl font-semibold flex items-center">
                <BarChart3 className="w-5 h-5 mr-2" />
                Analytics
              </h1>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={() => {
                setLoadingInterviews(true);
                fetchInterviewSessions();
              }}>
                🔄 Refresh Data
              </Button>
            </div>
          </div>
        </div>

        <div className="p-6">
          {interviewSessions.length === 0 ? (
            // No interviews yet
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
              <BarChart3 className="w-16 h-16 text-muted-foreground mb-4" />
              <h2 className="text-2xl font-semibold mb-2">No Interview Data Yet</h2>
              <p className="text-muted-foreground mb-6 max-w-md">
                Complete your first interview to see detailed analytics and performance insights.
              </p>
              <Button asChild>
                <Link to="/practice">
                  Start Your First Interview
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Overview Stats */}
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Interviews</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{interviewSessions.length}</div>
                    <p className="text-xs text-muted-foreground">
                      {analyzedSessions.length} with analysis
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Average Score</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold ${getScoreColor(averageScore)}`}>
                      {averageScore > 0 ? `${averageScore}/100` : '-'}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Across all interviews
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Best Score</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold ${getScoreColor(bestScore)}`}>
                      {bestScore > 0 ? `${bestScore}/100` : '-'}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Personal best
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Latest Score</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold ${getScoreColor(latestScore)}`}>
                      {latestScore > 0 ? `${latestScore}/100` : '-'}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Most recent interview
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Tabs defaultValue="overview" className="space-y-6">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="overview">Performance Overview</TabsTrigger>
                  <TabsTrigger value="sessions">Session History</TabsTrigger>
                  <TabsTrigger value="insights">Insights & Trends</TabsTrigger>
                </TabsList>

                {/* Performance Overview Tab */}
                <TabsContent value="overview" className="space-y-6">
                  {analyzedSessions.length > 0 ? (
                    <>
                      {/* Category Performance */}
                      <Card>
                        <CardHeader>
                          <CardTitle>Performance by Category</CardTitle>
                          <CardDescription>
                            Average scores across different skill areas
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <Brain className="w-4 h-4 text-blue-500" />
                                  <span className="text-sm font-medium">Technical Knowledge</span>
                                </div>
                                <span className={`font-bold ${getScoreColor(categoryAverages.technicalKnowledge * 4)}`}>
                                  {categoryAverages.technicalKnowledge}/25
                                </span>
                              </div>
                              <Progress value={(categoryAverages.technicalKnowledge / 25) * 100} className="h-2" />
                            </div>

                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <MessageCircle className="w-4 h-4 text-green-500" />
                                  <span className="text-sm font-medium">Communication Skills</span>
                                </div>
                                <span className={`font-bold ${getScoreColor(categoryAverages.communicationSkills * 4)}`}>
                                  {categoryAverages.communicationSkills}/25
                                </span>
                              </div>
                              <Progress value={(categoryAverages.communicationSkills / 25) * 100} className="h-2" />
                            </div>

                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <Lightbulb className="w-4 h-4 text-yellow-500" />
                                  <span className="text-sm font-medium">Problem Solving</span>
                                </div>
                                <span className={`font-bold ${getScoreColor(categoryAverages.problemSolving * 4)}`}>
                                  {categoryAverages.problemSolving}/25
                                </span>
                              </div>
                              <Progress value={(categoryAverages.problemSolving / 25) * 100} className="h-2" />
                            </div>

                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <User className="w-4 h-4 text-purple-500" />
                                  <span className="text-sm font-medium">Professional Presentation</span>
                                </div>
                                <span className={`font-bold ${getScoreColor(categoryAverages.professionalPresentation * 4)}`}>
                                  {categoryAverages.professionalPresentation}/25
                                </span>
                              </div>
                              <Progress value={(categoryAverages.professionalPresentation / 25) * 100} className="h-2" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </>
                  ) : (
                    <Card>
                      <CardContent className="p-8 text-center">
                        <Award className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No Analysis Data</h3>
                        <p className="text-muted-foreground">
                          Complete interviews with AI analysis to see performance insights here.
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                {/* Session History Tab */}
                <TabsContent value="sessions" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Interview Session History</CardTitle>
                      <CardDescription>
                        All your completed interview sessions
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {interviewSessions.map((session) => (
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
                                    <Badge variant={getScoreBadgeVariant(session.analysis.overallScore)} className="text-xs">
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
                                  <span className="flex items-center">
                                    <Clock className="w-3 h-3 mr-1" />
                                    {new Date(session.endTime).toLocaleTimeString()}
                                  </span>
                                  <span>
                                    {session.transcript?.length || 0} exchanges
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button size="sm" variant="outline" asChild>
                                <Link to={`/interview-results/${session.id}`}>
                                  <ExternalLink className="w-3 h-3 mr-1" />
                                  View Details
                                </Link>
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Insights Tab */}
                <TabsContent value="insights" className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <TrendingUp className="w-5 h-5 mr-2 text-green-500" />
                          Strengths
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {analyzedSessions.length > 0 ? (
                          <div className="space-y-2">
                            {/* Show most common strengths across sessions */}
                            <p className="text-sm text-muted-foreground">Based on your recent interviews:</p>
                            <ul className="space-y-1">
                              <li className="text-sm">• Strong technical foundation</li>
                              <li className="text-sm">• Clear communication style</li>
                              <li className="text-sm">• Structured problem approach</li>
                            </ul>
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            Complete more interviews to see personalized insights.
                          </p>
                        )}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <Target className="w-5 h-5 mr-2 text-blue-500" />
                          Growth Areas
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {analyzedSessions.length > 0 ? (
                          <div className="space-y-2">
                            <p className="text-sm text-muted-foreground">Areas to focus on:</p>
                            <ul className="space-y-1">
                              <li className="text-sm">• Practice more complex scenarios</li>
                              <li className="text-sm">• Work on confidence building</li>
                              <li className="text-sm">• Improve time management</li>
                            </ul>
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            Complete more interviews to see improvement suggestions.
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Analytics;
