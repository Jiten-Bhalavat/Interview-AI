import { Link } from "react-router-dom";
import { Play, BarChart3, Clock, Target, TrendingUp, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import UserProfile from "@/components/UserProfile";
import Sidebar from "@/components/Sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { useInterviewQuota } from "@/contexts/InterviewQuotaContext";

const Dashboard = () => {
  const { userProfile } = useAuth();
  const { quota, loading: quotaLoading } = useInterviewQuota();

  const firstName = userProfile?.displayName?.split(" ")[0] || "there";

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
                <Link to="/practice">Practice</Link>
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
                    {Math.max(0, quota.total - quota.used)}/{quota.total}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <Card className="border-2 border-blue-200 bg-blue-50/50 dark:bg-blue-950/20">
              <CardHeader>
                <CardTitle className="flex items-center text-blue-700 dark:text-blue-300">
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
                  disabled={!quotaLoading && quota.used >= quota.total}
                >
                  <Link to="/practice">
                    {quota.used >= quota.total ? 'Quota Reached' : 'Start Interview'}
                  </Link>
                </Button>
                {!quotaLoading && quota.used >= quota.total && (
                  <p className="text-xs text-red-600 mt-2 text-center">
                    Monthly limit reached. Resets {new Date(quota.resetDate).toLocaleDateString()}
                  </p>
                )}
              </CardContent>
            </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="w-5 h-5 mr-2" />
                Practice History
              </CardTitle>
              <CardDescription>
                Review your past interview sessions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" disabled>
                Coming Soon
              </Button>
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
                  {quotaLoading ? '...' : quota.used}
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
                <div className="text-2xl font-bold">-</div>
                <p className="text-xs text-muted-foreground">
                  Start practicing to see scores
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
                  {quotaLoading ? '...' : Math.max(0, quota.total - quota.used)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Until {!quotaLoading && new Date(quota.resetDate).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Getting Started */}
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
                    {quota.used > 0 ? <CheckCircle2 className="w-4 h-4" /> : '1'}
                  </div>
                  <div>
                    <h4 className="font-medium">Complete your first practice session</h4>
                    <p className="text-sm text-muted-foreground">
                      Start with a quick practice to get familiar with the AI interviewer
                    </p>
                  </div>
                  <Badge variant={quota.used > 0 ? "default" : "secondary"}>
                    {quota.used > 0 ? "Completed" : "Pending"}
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
                  <Badge variant="outline">Coming Soon</Badge>
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
                  <Badge variant="outline">Coming Soon</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;