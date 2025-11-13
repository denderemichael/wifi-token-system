import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Clock, TrendingUp } from "lucide-react";

interface Stat {
  title: string;
  value: string;
  icon: React.ReactNode;
  description?: string;
}

interface StatsCardsProps {
  stats: Stat[];
}

export function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      {stats.map((stat, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            <div className="rounded-md bg-primary/10 p-2">
              {stat.icon}
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold" data-testid={`stat-${index}`}>{stat.value}</div>
            {stat.description && (
              <p className="text-xs text-muted-foreground mt-1">
                {stat.description}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Default stats for demo
export function DefaultStatsCards() {
  // todo: remove mock functionality
  const stats = [
    {
      title: "Active Tokens",
      value: "12",
      icon: <Activity className="h-4 w-4 text-primary" />,
      description: "Currently valid",
    },
    {
      title: "Expiring Soon",
      value: "3",
      icon: <Clock className="h-4 w-4 text-orange-500" />,
      description: "Less than 2 hours",
    },
    {
      title: "Generated Today",
      value: "28",
      icon: <TrendingUp className="h-4 w-4 text-green-600" />,
      description: "+15% from yesterday",
    },
  ];

  return <StatsCards stats={stats} />;
}
