import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function AdminGenerate() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      toast({
        title: "Invalid Phone Number",
        description: "Please enter a valid phone number",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setGeneratedToken(null);

    try {
      const response = await apiRequest("POST", "/api/tokens/generate", {
        phoneNumber,
        amount: 0, // Manual generation is free
      });
      const data = await response.json();

      if (data.success) {
        setGeneratedToken(data.token);
        toast({
          title: "Token Generated",
          description: data.smsDelivered 
            ? "Token sent via SMS successfully" 
            : "Token generated (SMS delivery may have failed)",
        });
        setPhoneNumber("");
      } else {
        throw new Error(data.message || "Failed to generate token");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to generate token",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Generate Tokens</h1>
        <p className="text-muted-foreground mt-2">
          Manually create and send access tokens via SMS
        </p>
      </div>

      <div className="max-w-2xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Generate & Send Token
            </CardTitle>
            <CardDescription>
              Create a new token and automatically send it via SMS
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="phone-number">Phone Number</Label>
              <Input
                id="phone-number"
                type="tel"
                placeholder="+1234567890"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="h-12"
                data-testid="input-phone-admin"
              />
              <p className="text-xs text-muted-foreground">
                Token will be sent to this number immediately
              </p>
            </div>

            <Button
              onClick={handleGenerate}
              className="w-full h-12"
              disabled={isGenerating}
              data-testid="button-generate-admin"
            >
              <Send className="h-4 w-4 mr-2" />
              {isGenerating ? "Generating..." : "Generate & Send Token"}
            </Button>

            {generatedToken && (
              <div className="rounded-md border bg-card p-4 space-y-2">
                <Label>Generated Token</Label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xl font-mono tracking-wide bg-muted p-3 rounded" data-testid="text-generated-token">
                    {generatedToken}
                  </code>
                </div>
                <p className="text-xs text-muted-foreground">
                  Token has been sent via SMS and is valid for 12 hours
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
