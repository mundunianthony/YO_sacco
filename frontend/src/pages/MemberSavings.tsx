import { useState, useEffect, useCallback } from "react";
import { Layout } from "@/components/Layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { DollarSign, Plus, Minus, ArrowLeft } from "lucide-react";
import { memberApi } from "@/lib/api";
import mmImage from "@/assets/mm.png";
import amImage from "@/assets/am.png";
import cardImage from "@/assets/card.png";

interface SavingsData {
  currentBalance: number;
  transactions: Array<{
    _id: string;
    type: string;
    amount: number;
    createdAt: string;
    description: string;
    balanceAfter: number;
    status: string;
  }>;
}

type PaymentMethod = "mobile_money" | "airtel_money" | "card";
type DepositStep = "method_selection" | "mobile_form" | "card_form";

interface CardDetails {
  cardNumber: string;
  cardHolderName: string;
  expiryDate: string;
  cvv: string;
}

const MemberSavings = () => {
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [savingsData, setSavingsData] = useState<SavingsData | null>(null);
  const [depositStep, setDepositStep] =
    useState<DepositStep>("method_selection");
  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState<PaymentMethod | null>(null);
  const [cardDetails, setCardDetails] = useState<CardDetails>({
    cardNumber: "",
    cardHolderName: "",
    expiryDate: "",
    cvv: "",
  });
  const { toast } = useToast();

  const fetchSavingsData = useCallback(async () => {
    try {
      const response = await memberApi.getSavings();
      setSavingsData(response.data.data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load savings data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchSavingsData();
  }, [fetchSavingsData]);

  const resetDepositState = () => {
    setDepositAmount("");
    setCardDetails({
      cardNumber: "",
      cardHolderName: "",
      expiryDate: "",
      cvv: "",
    });
    setSelectedPaymentMethod(null);
    setDepositStep("method_selection");
  };

  const handleDepositDialogClose = () => {
    setIsDepositOpen(false);
    resetDepositState();
  };

  const handlePaymentMethodSelect = (method: PaymentMethod) => {
    setSelectedPaymentMethod(method);
    if (method === "mobile_money" || method === "airtel_money") {
      setDepositStep("mobile_form");
    } else if (method === "card") {
      setDepositStep("card_form");
    }
  };

  const handleBackToMethodSelection = () => {
    setDepositStep("method_selection");
    setSelectedPaymentMethod(null);
  };

  const handleMobileDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const amount = parseFloat(depositAmount);
      if (amount <= 0) {
        toast({
          title: "Invalid Amount",
          description: "Please enter a valid amount",
          variant: "destructive",
        });
        return;
      }

      await memberApi.makeDeposit({
        amount,
        paymentMethod:
          selectedPaymentMethod === "mobile_money"
            ? "mobile_money"
            : "airtel_money",
      });

      toast({
        title: "Deposit Successful",
        description: `UGX${amount.toLocaleString()} has been added to your savings via ${
          selectedPaymentMethod === "mobile_money"
            ? "Mobile Money"
            : "Airtel Money"
        }`,
      });

      handleDepositDialogClose();
      fetchSavingsData(); // Refresh data
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process deposit",
        variant: "destructive",
      });
    }
  };

  const handleCardDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const amount = parseFloat(depositAmount);
      if (amount <= 0) {
        toast({
          title: "Invalid Amount",
          description: "Please enter a valid amount",
          variant: "destructive",
        });
        return;
      }

      // Validate card details (basic validation)
      if (
        !cardDetails.cardNumber ||
        !cardDetails.cardHolderName ||
        !cardDetails.expiryDate ||
        !cardDetails.cvv
      ) {
        toast({
          title: "Incomplete Details",
          description: "Please fill in all card details",
          variant: "destructive",
        });
        return;
      }

      await memberApi.makeDeposit({
        amount,
        paymentMethod: "card",
      });

      toast({
        title: "Deposit Successful",
        description: `UGX${amount.toLocaleString()} has been added to your savings via Card Payment`,
      });

      handleDepositDialogClose();
      fetchSavingsData(); // Refresh data
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process deposit",
        variant: "destructive",
      });
    }
  };

  const handleDeposit = async (e: React.FormEvent) => {
    // This function is now handled by handleMobileDeposit and handleCardDeposit
    e.preventDefault();
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const amount = parseFloat(withdrawAmount);
      if (amount <= 0) {
        toast({
          title: "Invalid Amount",
          description: "Please enter a valid amount",
          variant: "destructive",
        });
        return;
      }

      if (amount > (savingsData?.currentBalance ?? 0)) {
        toast({
          title: "Insufficient Funds",
          description: "You cannot withdraw more than your current balance",
          variant: "destructive",
        });
        return;
      }

      const response = await memberApi.makeWithdrawal({
        amount,
        paymentMethod: "cash", // You might want to add a payment method selector
      });

      toast({
        title: "Withdrawal Request Submitted",
        description: response.data.message || "Please wait for admin approval",
      });

      setWithdrawAmount("");
      setIsWithdrawOpen(false);
      fetchSavingsData(); // Refresh data
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit withdrawal request",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Savings Account</h1>
          <p className="text-muted-foreground">
            Manage your deposits and withdrawals
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Current Balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                UGX{savingsData?.currentBalance.toLocaleString() ?? "0"}
              </div>
              <p className="text-muted-foreground mt-2">
                Available for withdrawal
              </p>
              <div className="flex gap-2 mt-4">
                <Dialog
                  open={isDepositOpen}
                  onOpenChange={(open) => {
                    if (!open) {
                      handleDepositDialogClose();
                    } else {
                      setIsDepositOpen(true);
                    }
                  }}
                >
                  <DialogTrigger asChild>
                    <Button className="flex-1">
                      <Plus className="h-4 w-4 mr-2" />
                      Deposit
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    {depositStep === "method_selection" && (
                      <>
                        <DialogHeader>
                          <DialogTitle>Choose Payment Method</DialogTitle>
                          <DialogDescription>
                            Select how you want to make your deposit
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <h3 className="font-medium mb-3">
                              Mobile Transactions
                            </h3>
                            <div className="grid grid-cols-2 gap-3">
                              <Button
                                variant="outline"
                                className="h-20 flex flex-col items-center justify-center space-y-2 hover:bg-primary/5"
                                onClick={() =>
                                  handlePaymentMethodSelect("mobile_money")
                                }
                              >
                                <img
                                  src={mmImage}
                                  alt="Mobile Money"
                                  className="w-8 h-8 object-contain"
                                />
                                <span className="text-sm">Mobile Money</span>
                              </Button>
                              <Button
                                variant="outline"
                                className="h-20 flex flex-col items-center justify-center space-y-2 hover:bg-primary/5"
                                onClick={() =>
                                  handlePaymentMethodSelect("airtel_money")
                                }
                              >
                                <img
                                  src={amImage}
                                  alt="Airtel Money"
                                  className="w-8 h-8 object-contain"
                                />
                                <span className="text-sm">Airtel Money</span>
                              </Button>
                            </div>
                          </div>
                          <div>
                            <h3 className="font-medium mb-3">Card Payments</h3>
                            <Button
                              variant="outline"
                              className="w-full h-20 flex flex-col items-center justify-center space-y-2 hover:bg-primary/5"
                              onClick={() => handlePaymentMethodSelect("card")}
                            >
                              <img
                                src={cardImage}
                                alt="Card Payment"
                                className="w-8 h-8 object-contain"
                              />
                              <span className="text-sm">Card Payment</span>
                            </Button>
                          </div>
                        </div>
                      </>
                    )}

                    {depositStep === "mobile_form" && (
                      <>
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={handleBackToMethodSelection}
                            >
                              <ArrowLeft className="h-4 w-4" />
                            </Button>
                            {selectedPaymentMethod === "mobile_money"
                              ? "Mobile Money"
                              : "Airtel Money"}{" "}
                            Deposit
                          </DialogTitle>
                          <DialogDescription>
                            Enter the amount you want to deposit
                          </DialogDescription>
                        </DialogHeader>
                        <form
                          onSubmit={handleMobileDeposit}
                          className="space-y-4"
                        >
                          <div>
                            <Label htmlFor="mobile-deposit-amount">
                              Amount (UGX)
                            </Label>
                            <Input
                              id="mobile-deposit-amount"
                              type="number"
                              min="1"
                              step="0.01"
                              placeholder="Enter amount"
                              value={depositAmount}
                              onChange={(e) => setDepositAmount(e.target.value)}
                              required
                            />
                          </div>
                          <Button type="submit" className="w-full">
                            Confirm Deposit
                          </Button>
                        </form>
                      </>
                    )}

                    {depositStep === "card_form" && (
                      <>
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={handleBackToMethodSelection}
                            >
                              <ArrowLeft className="h-4 w-4" />
                            </Button>
                            Card Payment Deposit
                          </DialogTitle>
                          <DialogDescription>
                            Enter your card details and deposit amount
                          </DialogDescription>
                        </DialogHeader>
                        <form
                          onSubmit={handleCardDeposit}
                          className="space-y-4"
                        >
                          <div>
                            <Label htmlFor="card-number">Card Number</Label>
                            <Input
                              id="card-number"
                              type="text"
                              placeholder="1234 5678 9012 3456"
                              value={cardDetails.cardNumber}
                              onChange={(e) =>
                                setCardDetails({
                                  ...cardDetails,
                                  cardNumber: e.target.value,
                                })
                              }
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="card-holder-name">
                              Card Holder Name
                            </Label>
                            <Input
                              id="card-holder-name"
                              type="text"
                              placeholder="John Doe"
                              value={cardDetails.cardHolderName}
                              onChange={(e) =>
                                setCardDetails({
                                  ...cardDetails,
                                  cardHolderName: e.target.value,
                                })
                              }
                              required
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label htmlFor="expiry-date">Expiry Date</Label>
                              <Input
                                id="expiry-date"
                                type="text"
                                placeholder="MM/YY"
                                value={cardDetails.expiryDate}
                                onChange={(e) =>
                                  setCardDetails({
                                    ...cardDetails,
                                    expiryDate: e.target.value,
                                  })
                                }
                                required
                              />
                            </div>
                            <div>
                              <Label htmlFor="cvv">CVV</Label>
                              <Input
                                id="cvv"
                                type="text"
                                placeholder="123"
                                value={cardDetails.cvv}
                                onChange={(e) =>
                                  setCardDetails({
                                    ...cardDetails,
                                    cvv: e.target.value,
                                  })
                                }
                                required
                              />
                            </div>
                          </div>
                          <div>
                            <Label htmlFor="card-deposit-amount">
                              Amount (UGX)
                            </Label>
                            <Input
                              id="card-deposit-amount"
                              type="number"
                              min="1"
                              step="0.01"
                              placeholder="Enter amount"
                              value={depositAmount}
                              onChange={(e) => setDepositAmount(e.target.value)}
                              required
                            />
                          </div>
                          <Button type="submit" className="w-full">
                            Confirm Deposit
                          </Button>
                        </form>
                      </>
                    )}
                  </DialogContent>
                </Dialog>

                <Dialog open={isWithdrawOpen} onOpenChange={setIsWithdrawOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="flex-1">
                      <Minus className="h-4 w-4 mr-2" />
                      Withdraw
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Request Withdrawal</DialogTitle>
                      <DialogDescription>
                        Withdraw money from your savings account
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleWithdraw} className="space-y-4">
                      <div>
                        <Label htmlFor="withdraw-amount">Amount (UGX)</Label>
                        <Input
                          id="withdraw-amount"
                          type="number"
                          min="1"
                          max={savingsData?.currentBalance}
                          step="0.01"
                          placeholder="Enter amount"
                          value={withdrawAmount}
                          onChange={(e) => setWithdrawAmount(e.target.value)}
                          required
                        />
                        <p className="text-sm text-muted-foreground mt-1">
                          Maximum: UGX
                          {savingsData?.currentBalance.toLocaleString() ?? "0"}
                        </p>
                      </div>
                      <Button type="submit" className="w-full">
                        Confirm Withdrawal
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>
                Your recent deposits and withdrawals
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {savingsData?.transactions.map((transaction) => (
                  <div
                    key={transaction._id}
                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-full ${
                          transaction.amount > 0
                            ? "bg-green-100 text-green-600"
                            : "bg-red-100 text-red-600"
                        }`}
                      >
                        {transaction.amount > 0 ? (
                          <Plus className="h-4 w-4" />
                        ) : (
                          <Minus className="h-4 w-4" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{transaction.type}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(transaction.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className={`font-semibold ${
                          transaction.amount > 0
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {transaction.amount > 0 ? "+" : ""}UGX
                        {Math.abs(transaction.amount).toLocaleString()}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {transaction.status === "pending"
                          ? "Pending Approval"
                          : "Completed"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default MemberSavings;
