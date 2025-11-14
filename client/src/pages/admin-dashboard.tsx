import { useQuery } from "@tanstack/react-query";
import { StatsCards } from "@/components/StatsCards";
import { TokensTable } from "@/components/TokensTable";
import { Activity, Clock, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminDashboard() {
  const { data: tokens, isLoading, refetch } = useQuery<any[]>({
    queryKey: ["/api/tokens/active"],
  });

  const handleRevoke = async (id: string) => {
    try {
      const response = await fetch(`/api/tokens/${id}/revoke`, {
        method: "POST",
      });
      if (response.ok) {
        refetch();
      }
    } catch (error) {
      console.error("Failed to revoke token:", error);
    }
  };

  const now = new Date();
  const activeTokens = tokens?.filter(t => 
    new Date(t.expiresAt) > now && !t.isRevoked
  ) || [];
  
  const expiringTokens = activeTokens.filter(t => {
    const hoursLeft = (new Date(t.expiresAt).getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursLeft < 2;
  });

  const todayTokens = tokens?.filter(t => {
    const created = new Date(t.createdAt);
    return created.toDateString() === now.toDateString();
  }) || [];

  const stats = [
    {
      title: "Active Tokens",
      value: activeTokens.length.toString(),
      icon: <Activity className="h-4 w-4 text-primary" />,
      description: "Currently valid",
    },
    {
      title: "Expiring Soon",
      value: expiringTokens.length.toString(),
      icon: <Clock className="h-4 w-4 text-orange-500" />,
      description: "Less than 2 hours",
    },
    {
      title: "Generated Today",
      value: todayTokens.length.toString(),
      icon: <TrendingUp className="h-4 w-4 text-green-600" />,
      description: "Purchased today",
    },
  ];

  const tableTokens = activeTokens.map(t => ({
    id: t.id,
    token: t.token,
    created: new Date(t.createdAt),
    expires: new Date(t.expiresAt),
    status: (() => {
      const hoursLeft = (new Date(t.expiresAt).getTime() - now.getTime()) / (1000 * 60 * 60);
      if (hoursLeft < 2) return "expiring" as const;
      return "active" as const;
    })(),
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Overview of active tokens and network access
        </p>
      </div>

      {isLoading ? (
        <>
          <div className="grid gap-6 md:grid-cols-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <Skeleton className="h-64" />
        </>
      ) : (
        <>
          <StatsCards stats={stats} />
          <TokensTable tokens={tableTokens} onRevoke={handleRevoke} />
        </>
      )}
    </div>
  );
}
