import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { InterviewAnalysis, TranscriptEntry } from "@/lib/openai";
import {
  BarChart3,
  Brain,
  MessageCircle,
  Lightbulb,
  User,
  TrendingUp,
  TrendingDown,
  FileText,
  Award,
  Target
} from "lucide-react";

interface InterviewAnalysisProps {
  analysis: InterviewAnalysis;
  transcript?: TranscriptEntry[];
  sessionId: string;
}

const InterviewAnalysisComponent = ({ analysis, transcript, sessionId }: InterviewAnalysisProps) => {
  const [selectedCategory, setSelectedCategory] = useState<string>("");

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

  const categories = [
    {
      key: "technicalKnowledge",
      title: "Technical Knowledge",
      icon: Brain,
      data: analysis.technicalKnowledge,
      maxScore: 25
    },
    {
      key: "communicationSkills",
      title: "Communication Skills",
      icon: MessageCircle,
      data: analysis.communicationSkills,
      maxScore: 25
    },
    {
      key: "problemSolving",
      title: "Problem Solving",
      icon: Lightbulb,
      data: analysis.problemSolving,
      maxScore: 25
    },
    {
      key: "professionalPresentation",
      title: "Professional Presentation",
      icon: User,
      data: analysis.professionalPresentation,
      maxScore: 25
    }
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6 p-6">
      {/* Header with Overall Score */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center text-2xl">
                <Award className="w-6 h-6 mr-3 text-blue-500" />
                Interview Analysis Results
              </CardTitle>
              <CardDescription>
                Session ID: {sessionId} • Analyzed on {new Date().toLocaleDateString()}
              </CardDescription>
            </div>
            <div className="text-center">
              <div className={`text-4xl font-bold ${getScoreColor(analysis.overallScore)}`}>
                {analysis.overallScore}
              </div>
              <div className="text-sm text-muted-foreground">out of 100</div>
              <Badge variant={getScoreBadgeVariant(analysis.overallScore)} className="mt-2">
                {analysis.overallScore >= 80 ? "Excellent" :
                 analysis.overallScore >= 60 ? "Good" : "Needs Improvement"}
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="detailed">Detailed Analysis</TabsTrigger>
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
          <TabsTrigger value="transcript">Transcript</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {categories.map((category) => {
              const Icon = category.icon;
              const percentage = (category.data.score / category.maxScore) * 100;

              return (
                <Card key={category.key} className="hover:shadow-lg transition-shadow cursor-pointer"
                      onClick={() => setSelectedCategory(category.key)}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <Icon className="w-5 h-5 text-blue-500" />
                      <span className={`text-lg font-bold ${getScoreColor(category.data.score)}`}>
                        {category.data.score}/{category.maxScore}
                      </span>
                    </div>
                    <CardTitle className="text-sm">{category.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Progress value={percentage} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-2">
                      {percentage.toFixed(0)}% of maximum score
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Quick Insights */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <TrendingUp className="w-5 h-5 mr-2 text-green-500" />
                  Strengths
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {analysis.strengths.map((strength, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <div className="w-2 h-2 rounded-full bg-green-500 mt-2 flex-shrink-0" />
                      <span className="text-sm">{strength}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <TrendingDown className="w-5 h-5 mr-2 text-red-500" />
                  Areas for Improvement
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {analysis.areasForImprovement.map((area, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <div className="w-2 h-2 rounded-full bg-red-500 mt-2 flex-shrink-0" />
                      <span className="text-sm">{area}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Detailed Analysis Tab */}
        <TabsContent value="detailed" className="space-y-6">
          {categories.map((category) => {
            const Icon = category.icon;
            const breakdownEntries = Object.entries(category.data.breakdown);

            return (
              <Card key={category.key}>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Icon className="w-5 h-5 mr-2 text-blue-500" />
                    {category.title}
                    <Badge variant="outline" className="ml-auto">
                      {category.data.score}/{category.maxScore}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {breakdownEntries.map(([key, value]) => (
                      <div key={key} className="text-center p-3 bg-muted/50 rounded-lg">
                        <div className={`text-lg font-bold ${getScoreColor(value as number)}`}>
                          {value}
                        </div>
                        <div className="text-xs text-muted-foreground capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-l-blue-500">
                    <p className="text-sm">{category.data.feedback}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        {/* Feedback Tab */}
        <TabsContent value="feedback" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="w-5 h-5 mr-2 text-blue-500" />
                Comprehensive Feedback
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none">
                <p className="text-sm leading-relaxed">{analysis.detailedFeedback}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Lightbulb className="w-5 h-5 mr-2 text-yellow-500" />
                Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {analysis.recommendations.map((recommendation, index) => (
                  <li key={index} className="flex items-start space-x-3">
                    <div className="w-6 h-6 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                      {index + 1}
                    </div>
                    <span className="text-sm">{recommendation}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Transcript Tab */}
        <TabsContent value="transcript" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="w-5 h-5 mr-2 text-blue-500" />
                Interview Transcript
              </CardTitle>
              <CardDescription>
                Complete conversation log from your interview session
              </CardDescription>
            </CardHeader>
            <CardContent>
              {transcript && transcript.length > 0 ? (
                <ScrollArea className="h-96 w-full rounded-md border p-4">
                  <div className="space-y-4">
                    {transcript.map((entry, index) => (
                      <div key={index} className={`p-3 rounded-lg ${
                        entry.speaker === 'user' ? 'bg-blue-50 ml-8' : 'bg-gray-50 mr-8'
                      }`}>
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant={entry.speaker === 'user' ? 'default' : 'secondary'}>
                            {entry.speaker === 'user' ? 'You' : 'AI Interviewer'}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(entry.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-sm">{entry.message}</p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>No transcript available for this session</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default InterviewAnalysisComponent;