import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Wifi, CheckCircle2, AlertCircle, Loader2, CreditCard } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";

export function CaptivePortal() {
  const [token, setToken] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) return;

    setStatus("loading");
    
    try {
      const response = await apiRequest("POST", "/api/validate-token", { 
        token: token.trim() 
      });
      const data = await response.json();

      if (data.valid) {
        setStatus("success");
        setMessage(data.message || "Access granted! You are now connected to the network.");
      } else {
        setStatus("error");
        setMessage(data.message || "Invalid or expired token.");
      }
    } catch (error: any) {
      setStatus("error");
      setMessage("Error validating token. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center space-y-4 pb-8">
          <div className="flex justify-center">
            <div className="rounded-full bg-primary/10 p-6">
              <Wifi className="h-16 w-16 text-primary" />
            </div>
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">Welcome to SecureNet</CardTitle>
            <CardDescription className="text-sm mt-2">
              Enter your access token to connect for 12 hours
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {status === "success" ? (
            <Alert className="border-green-500/50 bg-green-500/10">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700 dark:text-green-400">
                {message}
              </AlertDescription>
            </Alert>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Input
                  type="text"
                  placeholder="Enter your access token"
                  value={token}
                  onChange={(e) => setToken(e.target.value.toUpperCase())}
                  className="h-14 text-center text-lg font-mono tracking-wide"
                  disabled={status === "loading"}
                  data-testid="input-token"
                />
              </div>

              {status === "error" && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{message}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full h-12 text-base font-semibold uppercase tracking-wide"
                disabled={status === "loading" || !token.trim()}
                data-testid="button-connect"
              >
                {status === "loading" ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Connect to Wi-Fi"
                )}
              </Button>
            </form>
          )}

          <div className="text-center text-xs text-muted-foreground pt-2">
            <p>Don't have a token?</p>
            <Link href="/purchase">
              <Button variant="ghost" className="h-auto p-0 text-xs" data-testid="link-purchase">
                <CreditCard className="h-3 w-3 mr-1" />
                Purchase Wi-Fi Access
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
