import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function AdminHistory() {
  // todo: remove mock functionality
  const history = [
    { id: "1", token: "A8K9X2P4", created: "Nov 13, 10:30 AM", used: "Nov 13, 10:35 AM", expired: "Nov 13, 10:30 PM", status: "expired" },
    { id: "2", token: "M3N7Q5R8", created: "Nov 13, 09:15 AM", used: "Nov 13, 09:20 AM", expired: "Nov 13, 09:15 PM", status: "expired" },
    { id: "3", token: "L6T2Y9W3", created: "Nov 13, 08:00 AM", used: "Nov 13, 08:05 AM", expired: "Nov 13, 08:00 PM", status: "expired" },
    { id: "4", token: "P4H8K3N2", created: "Nov 12, 03:45 PM", used: "Not used", expired: "Nov 13, 03:45 AM", status: "unused" },
  ];

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
          <div className="space-y-4">
            {history.map((item) => (
              <div
                key={item.id}
                className="flex items-start gap-4 p-4 rounded-md border bg-card hover-elevate"
                data-testid={`history-item-${item.id}`}
              >
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-3">
                    <code className="font-mono text-sm font-medium">
                      {item.token}
                    </code>
                    <Badge variant={item.status === "expired" ? "secondary" : "destructive"} className="text-xs">
                      {item.status === "expired" ? "Expired" : "Unused"}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <span>Created: {item.created}</span>
                    <span className="mx-2">•</span>
                    <span>Used: {item.used}</span>
                    <span className="mx-2">•</span>
                    <span>Expired: {item.expired}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
