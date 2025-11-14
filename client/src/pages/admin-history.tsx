import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminHistory() {
  const { data: allTokens, isLoading } = useQuery<any[]>({
    queryKey: ["/api/tokens"],
  });

  const now = new Date();
  const historyTokens = allTokens?.filter(t => 
    new Date(t.expiresAt) < now || t.isRevoked
  ).sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  ) || [];

  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Token History</h1>
        <p className="text-muted-foreground mt-2">
          View all previously generated and expired tokens
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Token Timeline</CardTitle>
          <CardDescription>
            Complete history of token generation and usage
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map(i => (
                <Skeleton key={i} className="h-24" />
              ))}
            </div>
          ) : historyTokens.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No expired or revoked tokens yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {historyTokens.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start gap-4 p-4 rounded-md border bg-card hover-elevate"
                  data-testid={`history-item-${item.id}`}
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <code className="font-mono text-sm font-medium">
                        {item.token}
                      </code>
                      <Badge 
                        variant={item.isRevoked ? "destructive" : "secondary"} 
                        className="text-xs"
                      >
                        {item.isRevoked ? "Revoked" : "Expired"}
                      </Badge>
                      {item.smsDelivered && (
                        <Badge variant="outline" className="text-xs">
                          SMS Delivered
                        </Badge>
                      )}
                      {item.paymentIntentId !== "MANUAL_GENERATION" && (
                        <Badge variant="outline" className="text-xs">
                          ${item.amount}
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <span>Created: {formatDate(item.createdAt)}</span>
                      <span className="mx-2">•</span>
                      <span>Used: {item.usedAt ? formatDate(item.usedAt) : "Not used"}</span>
                      <span className="mx-2">•</span>
                      <span>Expired: {formatDate(item.expiresAt)}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Phone: {item.phoneNumber}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
