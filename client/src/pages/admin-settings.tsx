import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function AdminSettings() {
  const [networkName, setNetworkName] = useState("SecureNet");
  const [tokenDuration, setTokenDuration] = useState(12);
  const [autoCleanup, setAutoCleanup] = useState(true);
  const { toast } = useToast();

  const handleSave = () => {
    // todo: remove mock functionality
    toast({
      title: "Settings saved",
      description: "Your configuration has been updated successfully",
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Configure network and token settings
        </p>
      </div>

      <div className="max-w-2xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Network Configuration</CardTitle>
            <CardDescription>
              Basic network settings for the captive portal
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="network-name">Network Name</Label>
              <Input
                id="network-name"
                value={networkName}
                onChange={(e) => setNetworkName(e.target.value)}
                data-testid="input-network-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="token-duration">Token Duration (hours)</Label>
              <Input
                id="token-duration"
                type="number"
                min="1"
                max="24"
                value={tokenDuration}
                onChange={(e) => setTokenDuration(parseInt(e.target.value) || 12)}
                data-testid="input-token-duration"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Token Management</CardTitle>
            <CardDescription>
              Configure how tokens are managed and cleaned up
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="auto-cleanup">Automatic Cleanup</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically remove expired tokens from the database
                </p>
              </div>
              <Switch
                id="auto-cleanup"
                checked={autoCleanup}
                onCheckedChange={setAutoCleanup}
                data-testid="switch-auto-cleanup"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={handleSave} data-testid="button-save-settings">
            Save Settings
          </Button>
        </div>
      </div>
    </div>
  );
}
