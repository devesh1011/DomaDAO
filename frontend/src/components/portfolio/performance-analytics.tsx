"use client"

import { Trophy, TrendingUp, Target, Award, Star, Zap } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

interface PerformanceMetric {
  label: string
  value: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  description?: string
}

interface Achievement {
  id: string
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  unlocked: boolean
  progress?: number
  maxProgress?: number
}

const mockPerformanceMetrics: PerformanceMetric[] = [
  {
    label: "Best Performing Pool",
    value: "web3.nft",
    icon: Trophy,
    color: "text-yellow-600",
    description: "+13.71% ROI"
  },
  {
    label: "Highest ROI Investment",
    value: "crypto.eth",
    icon: TrendingUp,
    color: "text-green-600",
    description: "+8.97% ROI"
  },
  {
    label: "Total Voting Participation",
    value: "85%",
    icon: Target,
    color: "text-blue-600",
    description: "12 out of 14 proposals"
  },
  {
    label: "Average Holding Period",
    value: "8.5 months",
    icon: Zap,
    color: "text-purple-600",
    description: "Across all investments"
  }
]

const mockAchievements: Achievement[] = [
  {
    id: "1",
    title: "First Investment",
    description: "Made your first domain investment",
    icon: Star,
    unlocked: true
  },
  {
    id: "2",
    title: "Revenue Generator",
    description: "Earned $100+ in revenue",
    icon: Award,
    unlocked: true,
    progress: 1234,
    maxProgress: 1000
  },
  {
    id: "3",
    title: "Active Voter",
    description: "Voted on 10+ proposals",
    icon: Target,
    unlocked: true,
    progress: 12,
    maxProgress: 10
  },
  {
    id: "4",
    title: "Portfolio Builder",
    description: "Invested in 5+ different pools",
    icon: Trophy,
    unlocked: false,
    progress: 4,
    maxProgress: 5
  },
  {
    id: "5",
    title: "High Roller",
    description: "Invested $10,000+ total",
    icon: Zap,
    unlocked: false,
    progress: 12450,
    maxProgress: 10000
  },
  {
    id: "6",
    title: "Domain Expert",
    description: "Held investments for 1+ year",
    icon: Award,
    unlocked: false,
    progress: 8.5,
    maxProgress: 12
  }
]

export function PerformanceAnalytics() {
  return (
    <div className="space-y-6">
      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {mockPerformanceMetrics.map((metric, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{metric.label}</CardTitle>
              <metric.icon className={`h-4 w-4 ${metric.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              {metric.description && (
                <p className="text-xs text-muted-foreground">{metric.description}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Achievements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Achievements & Milestones
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mockAchievements.map((achievement) => (
              <div
                key={achievement.id}
                className={`p-4 border rounded-lg ${
                  achievement.unlocked
                    ? 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200'
                    : 'bg-muted/30 border-muted'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-full ${
                    achievement.unlocked
                      ? 'bg-yellow-100 text-yellow-600'
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    <achievement.icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <h4 className={`font-medium ${achievement.unlocked ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {achievement.title}
                    </h4>
                    <p className={`text-sm ${achievement.unlocked ? 'text-muted-foreground' : 'text-muted-foreground/70'}`}>
                      {achievement.description}
                    </p>

                    {achievement.progress !== undefined && achievement.maxProgress && (
                      <div className="mt-2">
                        <div className="flex justify-between text-xs mb-1">
                          <span>Progress</span>
                          <span>
                            {achievement.progress >= achievement.maxProgress
                              ? 'Complete'
                              : `${achievement.progress}/${achievement.maxProgress}`
                            }
                          </span>
                        </div>
                        <Progress
                          value={(achievement.progress / achievement.maxProgress) * 100}
                          className="h-2"
                        />
                      </div>
                    )}

                    {achievement.unlocked && (
                      <Badge variant="secondary" className="mt-2 bg-yellow-100 text-yellow-800">
                        Unlocked
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}