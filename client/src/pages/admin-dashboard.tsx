import { DefaultStatsCards } from "@/components/StatsCards";
import { TokensTableDemo } from "@/components/TokensTable";

export default function AdminDashboard() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Overview of active tokens and network access
        </p>
      </div>

      <DefaultStatsCards />
      <TokensTableDemo />
    </div>
  );
}
