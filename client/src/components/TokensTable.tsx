import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Copy, Trash2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Token {
  id: string;
  token: string;
  created: Date;
  expires: Date;
  status: "active" | "expiring" | "expired";
}

interface TokensTableProps {
  tokens: Token[];
  onRevoke?: (id: string) => void;
}

export function TokensTable({ tokens, onRevoke }: TokensTableProps) {
  const [revokeId, setRevokeId] = useState<string | null>(null);
  const { toast } = useToast();

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getTimeRemaining = (expires: Date) => {
    const now = new Date();
    const diff = expires.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diff <= 0) return "Expired";
    return `${hours}h ${minutes}m`;
  };

  const getProgress = (created: Date, expires: Date) => {
    const now = new Date();
    const total = expires.getTime() - created.getTime();
    const elapsed = now.getTime() - created.getTime();
    return Math.min(100, Math.max(0, (elapsed / total) * 100));
  };

  const handleCopy = (token: string) => {
    navigator.clipboard.writeText(token);
    toast({
      title: "Copied!",
      description: "Token copied to clipboard",
    });
  };

  const handleRevoke = () => {
    if (revokeId && onRevoke) {
      onRevoke(revokeId);
      toast({
        title: "Token revoked",
        description: "The token has been successfully revoked",
      });
    }
    setRevokeId(null);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Active Tokens</CardTitle>
          <CardDescription>
            Manage and monitor currently active access tokens
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Token</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Time Remaining</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tokens.map((token) => (
                  <TableRow key={token.id}>
                    <TableCell>
                      <code className="font-mono text-sm font-medium" data-testid={`text-token-${token.id}`}>
                        {token.token}
                      </code>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(token.created)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(token.expires)}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 min-w-[120px]">
                        <div className="text-sm font-medium">
                          {getTimeRemaining(token.expires)}
                        </div>
                        <Progress value={100 - getProgress(token.created, token.expires)} className="h-1" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          token.status === "active"
                            ? "default"
                            : token.status === "expiring"
                            ? "secondary"
                            : "destructive"
                        }
                        className="gap-1"
                        data-testid={`badge-status-${token.id}`}
                      >
                        <span className={`h-2 w-2 rounded-full ${
                          token.status === "active"
                            ? "bg-green-500"
                            : token.status === "expiring"
                            ? "bg-orange-500"
                            : "bg-red-500"
                        }`} />
                        {token.status === "active" ? "Active" : token.status === "expiring" ? "Expiring" : "Expired"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleCopy(token.token)}
                          data-testid={`button-copy-${token.id}`}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setRevokeId(token.id)}
                          data-testid={`button-revoke-${token.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={!!revokeId} onOpenChange={() => setRevokeId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke Token?</AlertDialogTitle>
            <AlertDialogDescription>
              This will immediately invalidate the token and disconnect any users currently using it. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-revoke">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRevoke} data-testid="button-confirm-revoke">
              Revoke Token
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// Mock data for demo
export function TokensTableDemo() {
  // todo: remove mock functionality
  const [tokens, setTokens] = useState<Token[]>([
    {
      id: "1",
      token: "A8K9X2P4",
      created: new Date(Date.now() - 5 * 60 * 60 * 1000),
      expires: new Date(Date.now() + 7 * 60 * 60 * 1000),
      status: "active",
    },
    {
      id: "2",
      token: "M3N7Q5R8",
      created: new Date(Date.now() - 10 * 60 * 60 * 1000),
      expires: new Date(Date.now() + 2 * 60 * 60 * 1000),
      status: "active",
    },
    {
      id: "3",
      token: "L6T2Y9W3",
      created: new Date(Date.now() - 11 * 60 * 60 * 1000),
      expires: new Date(Date.now() + 1 * 60 * 60 * 1000),
      status: "expiring",
    },
    {
      id: "4",
      token: "P4H8K3N2",
      created: new Date(Date.now() - 8 * 60 * 60 * 1000),
      expires: new Date(Date.now() + 4 * 60 * 60 * 1000),
      status: "active",
    },
  ]);

  const handleRevoke = (id: string) => {
    setTokens(tokens.filter(t => t.id !== id));
  };

  return <TokensTable tokens={tokens} onRevoke={handleRevoke} />;
}
