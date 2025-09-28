import { Link, useLocation } from "react-router-dom";
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
import { useInterviewQuota } from "@/contexts/InterviewQuotaContext";

const Sidebar = () => {
  const location = useLocation();
  const { quota, loading } = useInterviewQuota();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Practice Interview', href: '/practice', icon: Mic },
    { name: 'Analytics', href: '/analytics', icon: BarChart3, disabled: true },
    { name: 'Schedule', href: '/schedule', icon: Calendar },
  ];

  const isActive = (href: string) => location.pathname === href;

  const quotaPercentage = quota.total > 0 ? (quota.used / quota.total) * 100 : 0;
  const remainingInterviews = Math.max(0, quota.total - quota.used);

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

      {/* Interview Quota Card */}
      <div className="p-4 border-t border-border/40">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center justify-between">
              <span>AI Interviews</span>
              <Crown className="w-4 h-4 text-yellow-500" />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {!loading ? (
              <>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Used this month</span>
                  <span className="font-semibold">
                    {quota.used}/{quota.total}
                  </span>
                </div>

                <Progress
                  value={quotaPercentage}
                  className="h-2"
                />

                <div className="text-center">
                  {remainingInterviews > 0 ? (
                    <p className="text-xs text-muted-foreground">
                      {remainingInterviews} interview{remainingInterviews !== 1 ? 's' : ''} remaining
                    </p>
                  ) : (
                    <p className="text-xs text-red-600">
                      Quota reached for this month
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    Resets {new Date(quota.resetDate).toLocaleDateString()}
                  </p>
                </div>

                {remainingInterviews > 0 ? (
                  <Button size="sm" className="w-full" asChild>
                    <Link to="/practice">
                      Start Interview
                    </Link>
                  </Button>
                ) : (
                  <Button size="sm" variant="outline" className="w-full" disabled>
                    Upgrade Plan
                  </Button>
                )}
              </>
            ) : (
              <div className="space-y-2">
                <div className="h-4 bg-muted animate-pulse rounded"></div>
                <div className="h-2 bg-muted animate-pulse rounded"></div>
                <div className="h-8 bg-muted animate-pulse rounded"></div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Help & Settings */}
      <div className="p-4 border-t border-border/40 space-y-2">
        <Button variant="ghost" size="sm" className="w-full justify-start" disabled>
          <HelpCircle className="w-4 h-4 mr-3" />
          Help & Support
        </Button>
        <Button variant="ghost" size="sm" className="w-full justify-start" disabled>
          <Settings className="w-4 h-4 mr-3" />
          Settings
        </Button>
      </div>
    </div>
  );
};

export default Sidebar;