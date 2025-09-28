import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  Home,
  Mic,
  BarChart3,
  Settings,
  HelpCircle,
  Calendar,
  Users,
  Crown
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useInterviewQuota } from "@/contexts/InterviewQuotaContext";
import { useAuth } from "@/contexts/AuthContext";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

const Sidebar = () => {
  const location = useLocation();
  const { quota, loading } = useInterviewQuota();
  const { currentUser } = useAuth();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [interviewSessionsCount, setInterviewSessionsCount] = useState(0);
  const [loadingInterviews, setLoadingInterviews] = useState(true);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Practice Interview', href: '/practice', icon: Mic },
    { name: 'Analytics', href: '/analytics', icon: BarChart3 },
    { name: 'Schedule', href: '/schedule', icon: Calendar },
  ];

  const isActive = (href: string) => location.pathname === href;

  // Use actual interview sessions count instead of quota system
  const actualSessionsUsed = interviewSessionsCount;
  const quotaPercentage = quota.total > 0 ? (actualSessionsUsed / quota.total) * 100 : 0;
  const remainingInterviews = Math.max(0, quota.total - actualSessionsUsed);

  // Fetch user's interview sessions count (same logic as Dashboard)
  const fetchInterviewSessionsCount = async () => {
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
      setInterviewSessionsCount(querySnapshot.size);
    } catch (error) {
      console.error('Sidebar: Error fetching interview sessions count:', error);
    } finally {
      setLoadingInterviews(false);
    }
  };

  useEffect(() => {
    fetchInterviewSessionsCount();
  }, [currentUser]);

  return (
    <div className="w-64 bg-background border-r border-border/40 h-screen flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-border/40">
        <Link to="/dashboard" className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
            <Mic className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-xl">InterviewAI</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={`flex items-center space-x-3 px-3 py-3 rounded-lg transition-colors ${
                isActive(item.href)
                  ? 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                  : item.disabled
                  ? 'text-muted-foreground cursor-not-allowed opacity-50'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
              onClick={(e) => item.disabled && e.preventDefault()}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.name}</span>
              {item.disabled && (
                <Badge variant="outline" className="text-xs ml-auto">
                  Soon
                </Badge>
              )}
            </Link>
          );
        })}
      </nav>


      {/* Help & Settings */}
      <div className="p-4 border-t border-border/40 space-y-2">
        <Button variant="ghost" size="sm" className="w-full justify-start" disabled>
          <HelpCircle className="w-4 h-4 mr-3" />
          Help & Support
        </Button>
        
        <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full justify-start">
              <Settings className="w-4 h-4 mr-3" />
              Settings
              {!loadingInterviews && remainingInterviews < quota.total && (
                <Badge variant="outline" className="ml-auto text-xs">
                  {remainingInterviews}/5
                </Badge>
              )}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <Settings className="w-5 h-5 mr-2" />
                Settings
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {/* Interview Quota Section */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center justify-between">
                    <span>Interview Quota</span>
                    <Crown className="w-4 h-4 text-yellow-500" />
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {!loadingInterviews ? (
                    <>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-blue-600 mb-1">
                          {remainingInterviews}/{quota.total}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Interviews remaining this month
                        </p>
                        <p className="text-xs text-blue-600 mt-1">
                          {actualSessionsUsed} completed this month
                        </p>
                      </div>

                      <Progress
                        value={quotaPercentage}
                        className="h-2"
                      />

                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">
                          Resets {new Date(quota.resetDate).toLocaleDateString()}
                        </p>
                      </div>

                      {remainingInterviews === 0 && (
                        <div className="text-center p-2 bg-red-50 dark:bg-red-950 rounded border border-red-200 dark:border-red-800">
                          <p className="text-xs text-red-600 dark:text-red-400">
                            Monthly limit reached ({actualSessionsUsed}/{quota.total})
                          </p>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="space-y-2">
                      <div className="h-8 bg-muted animate-pulse rounded"></div>
                      <div className="h-2 bg-muted animate-pulse rounded"></div>
                      <div className="h-4 bg-muted animate-pulse rounded"></div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Future Settings Sections */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">More Settings</h4>
                <Button variant="ghost" size="sm" className="w-full justify-start" disabled>
                  <span className="text-muted-foreground">Account Settings</span>
                  <Badge variant="outline" className="ml-auto text-xs">Soon</Badge>
                </Button>
                <Button variant="ghost" size="sm" className="w-full justify-start" disabled>
                  <span className="text-muted-foreground">Preferences</span>
                  <Badge variant="outline" className="ml-auto text-xs">Soon</Badge>
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Sidebar;