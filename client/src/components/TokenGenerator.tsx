import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, Plus, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function TokenGenerator() {
  const [quantity, setQuantity] = useState(1);
  const [generatedTokens, setGeneratedTokens] = useState<string[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const { toast } = useToast();

  const generateToken = () => {
    // todo: remove mock functionality
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  };

  const handleGenerate = () => {
    const tokens = Array.from({ length: quantity }, () => generateToken());
    setGeneratedTokens(tokens);
    toast({
      title: "Tokens generated",
      description: `Successfully generated ${quantity} token${quantity > 1 ? 's' : ''}`,
    });
  };

  const handleCopy = (token: string, index: number) => {
    navigator.clipboard.writeText(token);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
    toast({
      title: "Copied!",
      description: "Token copied to clipboard",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Generate New Tokens
        </CardTitle>
        <CardDescription>
          Create time-limited access tokens for Wi-Fi network
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <Label htmlFor="quantity">Number of tokens</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              max="10"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
              className="mt-2"
              data-testid="input-quantity"
            />
          </div>
          <Button 
            onClick={handleGenerate} 
            className="h-10"
            data-testid="button-generate"
          >
            <Plus className="h-4 w-4 mr-2" />
            Generate
          </Button>
        </div>

        {generatedTokens.length > 0 && (
          <div className="space-y-2">
            <Label>Generated Tokens</Label>
            <div className="space-y-2">
              {generatedTokens.map((token, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 p-3 rounded-md border bg-card"
                >
                  <code className="flex-1 text-lg font-mono tracking-wide" data-testid={`text-token-${index}`}>
                    {token}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleCopy(token, index)}
                    data-testid={`button-copy-${index}`}
                  >
                    {copiedIndex === index ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
