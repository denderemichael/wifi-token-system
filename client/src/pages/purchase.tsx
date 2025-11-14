// Stripe payment integration for token purchase
import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Wifi, CheckCircle2, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
const stripePromise = import.meta.env.VITE_STRIPE_PUBLIC_KEY
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY)
  : null;

const PurchaseForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin + "/purchase-success",
      },
      redirect: "if_required",
    });

    if (error) {
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
      setIsProcessing(false);
    } else {
      setPaymentSuccess(true);
      toast({
        title: "Payment Successful!",
        description: "Your access token will be sent to your phone via SMS shortly.",
      });
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      <Button
        type="submit"
        className="w-full h-12 text-base font-semibold"
        disabled={!stripe || isProcessing}
        data-testid="button-pay"
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          "Pay & Get Wi-Fi Access"
        )}
      </Button>
      <p className="text-xs text-muted-foreground text-center">
        You will receive your access token via SMS immediately after payment
      </p>
    </form>
  );
};

export default function Purchase() {
  const [clientSecret, setClientSecret] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [amount] = useState(5); // $5 for 12 hours
  const [isCreatingIntent, setIsCreatingIntent] = useState(false);
  const { toast } = useToast();

  const handleGetToken = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      toast({
        title: "Invalid Phone Number",
        description: "Please enter a valid phone number",
        variant: "destructive",
      });
      return;
    }

    if (!stripePromise) {
      toast({
        title: "Payment Not Available",
        description: "Stripe is not configured. Please contact administrator.",
        variant: "destructive",
      });
      return;
    }

    setIsCreatingIntent(true);

    try {
      const response = await apiRequest("POST", "/api/create-payment-intent", { 
        phoneNumber, 
        amount 
      });
      const data = await response.json();
      
      if (data.clientSecret) {
        setClientSecret(data.clientSecret);
      } else {
        throw new Error(data.message || "Failed to create payment");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to initialize payment",
        variant: "destructive",
      });
    } finally {
      setIsCreatingIntent(false);
    }
  };

  if (!stripePromise) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Payment Not Available</CardTitle>
            <CardDescription>
              Payment processing is not configured. Please contact the administrator.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!clientSecret) {
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
                placeholder="+1234567890"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="h-12 text-base"
                data-testid="input-phone"
              />
              <p className="text-xs text-muted-foreground">
                Your access token will be sent to this number via SMS
              </p>
            </div>

            <div className="rounded-md border bg-muted/50 p-4">
              <div className="flex justify-between items-center">
                <span className="font-medium">12 Hours Wi-Fi Access</span>
                <span className="text-2xl font-bold">${amount}</span>
              </div>
            </div>

            <Button
              onClick={handleGetToken}
              className="w-full h-12 text-base font-semibold"
              disabled={isCreatingIntent}
              data-testid="button-continue-to-payment"
            >
              {isCreatingIntent ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                "Continue to Payment"
              )}
            </Button>

            <div className="text-center text-xs text-muted-foreground pt-2">
              <p>Secure payment powered by Stripe</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show payment form when clientSecret is available
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Complete Payment</CardTitle>
          <CardDescription>
            ${amount} for 12 hours of Wi-Fi access
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <PurchaseForm />
          </Elements>
        </CardContent>
      </Card>
    </div>
  );
}
