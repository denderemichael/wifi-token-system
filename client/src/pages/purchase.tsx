import { useState } from 'react';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Wifi, CheckCircle2, Loader2 } from "lucide-react";

const PurchaseForm = ({ paymentMethod, phoneNumber, amount }: { paymentMethod: string; phoneNumber: string; amount: number }) => {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      const response = await apiRequest("POST", "/api/purchase-token", {
        phoneNumber,
        amount,
        paymentMethod
      });
      const data = await response.json();

      if (data.success) {
        setPaymentSuccess(true);
        toast({
          title: "Payment Successful!",
          description: "Your access token will be sent to your phone via SMS shortly.",
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

  if (paymentSuccess) {
    return (
      <div className="space-y-6 text-center">
        <div className="flex justify-center">
          <div className="rounded-full bg-green-500/10 p-6">
            <CheckCircle2 className="h-16 w-16 text-green-600" />
          </div>
        </div>
        <div>
          <h3 className="text-2xl font-bold mb-2">Payment Successful!</h3>
          <p className="text-muted-foreground">
            Your Wi-Fi access token has been sent to your phone via SMS.
          </p>
          <p className="text-muted-foreground mt-2">
            Check your messages and enter the token on the Wi-Fi portal to connect.
          </p>
        </div>
        <Button onClick={() => window.location.href = "/"} data-testid="button-go-to-portal">
          Go to Wi-Fi Portal
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
          Amount: ${amount} | Phone: {phoneNumber}
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

export default function Purchase() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [amount] = useState(5); // $5 for 12 hours
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const { toast } = useToast();

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
              ${amount} for 12 hours of Wi-Fi access via {paymentMethod}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PurchaseForm paymentMethod={paymentMethod} phoneNumber={phoneNumber} amount={amount} />
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
              Get 12 hours of secure Wi-Fi access for ${amount}
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
              <span className="font-medium">12 Hours Wi-Fi Access</span>
              <span className="text-2xl font-bold">${amount}</span>
            </div>
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
