import { useState, useEffect } from 'react';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Wifi, CheckCircle2, Loader2 } from "lucide-react";

const PurchaseForm = ({ paymentMethod, phoneNumber, network }: { paymentMethod: string; phoneNumber: string; network: Network }) => {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentData, setPaymentData] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      const response = await apiRequest("POST", "/api/purchase-token", {
        phoneNumber,
        networkId: network.id,
        paymentMethod
      });
      const data = await response.json();

      if (data.success) {
        setPaymentData(data);
        toast({
          title: "Payment Initiated!",
          description: "Complete your payment using the instructions below. Your token will be sent via SMS once payment is confirmed.",
        });
      } else {
        throw new Error(data.message || "Payment failed");
      }
    } catch (error: any) {
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (paymentData) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-blue-500/10 p-6">
              <Wifi className="h-16 w-16 text-blue-600" />
            </div>
          </div>
          <h3 className="text-2xl font-bold mb-2">Complete Your Payment</h3>
          <p className="text-muted-foreground">
            Follow the instructions below to complete your ${network.tokenPrice} payment for {network.name}.
          </p>
        </div>

        <div className="rounded-md border bg-muted/50 p-4">
          <h4 className="font-semibold mb-2">Payment Instructions</h4>
          {paymentMethod === 'paynow' && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                1. Open your Paynow app or scan the QR code
              </p>
              <p className="text-sm text-muted-foreground">
                2. Complete payment for ${network.tokenPrice}
              </p>
              <p className="text-sm text-muted-foreground">
                3. Your token will be sent via SMS once payment is confirmed
              </p>
              {paymentData.paymentUrl && (
                <div className="mt-4">
                  <Button asChild className="w-full">
                    <a href={paymentData.paymentUrl} target="_blank" rel="noopener noreferrer">
                      Open Paynow App
                    </a>
                  </Button>
                </div>
              )}
            </div>
          )}
          {paymentMethod === 'ecocash' && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                1. Dial *151*1# on your phone
              </p>
              <p className="text-sm text-muted-foreground">
                2. Select "Send Money"
              </p>
              <p className="text-sm text-muted-foreground">
                3. Enter merchant code: {paymentData.merchantCode || 'Contact admin for code'}
              </p>
              <p className="text-sm text-muted-foreground">
                4. Enter amount: ${network.tokenPrice}
              </p>
            </div>
          )}
          {paymentMethod === 'onemoney' && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                1. Dial *100# on your phone
              </p>
              <p className="text-sm text-muted-foreground">
                2. Select "Pay Merchant"
              </p>
              <p className="text-sm text-muted-foreground">
                3. Enter merchant code: {paymentData.merchantCode || 'Contact admin for code'}
              </p>
              <p className="text-sm text-muted-foreground">
                4. Enter amount: ${network.tokenPrice}
              </p>
            </div>
          )}
        </div>

        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            Reference: {paymentData.reference}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            You will receive your access token via SMS immediately after payment confirmation
          </p>
        </div>

        <Button onClick={() => window.location.href = "/"} variant="outline" className="w-full">
          Back to Wi-Fi Portal
        </Button>
      </div>
    );
  }

  const getPaymentInstructions = () => {
    switch (paymentMethod) {
      case 'ecocash':
        return "Dial *151*1# and send money to the merchant number shown above.";
      case 'onemoney':
        return "Dial *100# and select Pay Merchant, then enter the merchant code.";
      case 'paynow':
        return "Scan the QR code or use Paynow app to complete payment.";
      default:
        return "Follow the payment instructions for your selected method.";
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-md border bg-muted/50 p-4">
        <h4 className="font-semibold mb-2">Payment Instructions</h4>
        <p className="text-sm text-muted-foreground">{getPaymentInstructions()}</p>
        <p className="text-sm text-muted-foreground mt-2">
          Amount: ${network.tokenPrice} | Phone: {phoneNumber}
        </p>
      </div>
      <Button
        type="submit"
        className="w-full h-12 text-base font-semibold"
        disabled={isProcessing}
        data-testid="button-pay"
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          "Confirm Payment & Get Token"
        )}
      </Button>
      <p className="text-xs text-muted-foreground text-center">
        You will receive your access token via SMS immediately after payment confirmation
      </p>
    </form>
  );
};

interface Network {
  id: string;
  name: string;
  ssid: string;
  tokenPrice: number;
  tokenDuration: string;
  isActive: boolean;
}

export default function Purchase() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [selectedNetworkId, setSelectedNetworkId] = useState("");
  const [networks, setNetworks] = useState<Network[]>([]);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const loadNetworks = async () => {
      try {
        const response = await apiRequest("GET", "/api/networks/active");
        const data = await response.json();
        setNetworks(data);
        if (data.length > 0) {
          setSelectedNetworkId(data[0].id);
        }
      } catch (error) {
        console.error('Failed to load networks:', error);
        toast({
          title: "Error",
          description: "Failed to load network options",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    loadNetworks();
  }, [toast]);

  const selectedNetwork = networks.find(n => n.id === selectedNetworkId);

  const handleContinueToPayment = () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      toast({
        title: "Invalid Phone Number",
        description: "Please enter a valid phone number",
        variant: "destructive",
      });
      return;
    }

    if (!paymentMethod) {
      toast({
        title: "Select Payment Method",
        description: "Please choose a payment method",
        variant: "destructive",
      });
      return;
    }

    setShowPaymentForm(true);
  };

  if (showPaymentForm) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <Card className="w-full max-w-md shadow-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Complete Payment</CardTitle>
            <CardDescription>
              ${selectedNetwork?.tokenPrice} for {selectedNetwork?.tokenDuration} hours of Wi-Fi access via {paymentMethod}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PurchaseForm paymentMethod={paymentMethod} phoneNumber={phoneNumber} network={selectedNetwork!} />
          </CardContent>
        </Card>
      </div>
    );
  }

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
            <CardTitle className="text-2xl font-bold">Purchase Wi-Fi Access</CardTitle>
            <CardDescription className="text-sm mt-2">
              Get secure Wi-Fi access with flexible pricing options
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+263123456789"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="h-12 text-base"
              data-testid="input-phone"
            />
            <p className="text-xs text-muted-foreground">
              Your access token will be sent to this number via SMS
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="network">WiFi Network</Label>
            <Select value={selectedNetworkId} onValueChange={setSelectedNetworkId}>
              <SelectTrigger className="h-12">
                <SelectValue placeholder="Select WiFi network" />
              </SelectTrigger>
              <SelectContent>
                {networks.map((network) => (
                  <SelectItem key={network.id} value={network.id}>
                    {network.name} - ${network.tokenPrice} for {network.tokenDuration} hours
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment-method">Payment Method</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger className="h-12">
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ecocash">EcoCash</SelectItem>
                <SelectItem value="onemoney">OneMoney</SelectItem>
                <SelectItem value="paynow">Paynow</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border bg-muted/50 p-4">
            <div className="flex justify-between items-center">
              <span className="font-medium">{selectedNetwork?.tokenDuration} Hours Wi-Fi Access</span>
              <span className="text-2xl font-bold">${selectedNetwork?.tokenPrice}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {selectedNetwork?.name} ({selectedNetwork?.ssid})
            </p>
          </div>

          <Button
            onClick={handleContinueToPayment}
            className="w-full h-12 text-base font-semibold"
            data-testid="button-continue-to-payment"
          >
            Continue to Payment
          </Button>

          <div className="text-center text-xs text-muted-foreground pt-2">
            <p>Secure payment powered by Zimbabwean mobile money</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
