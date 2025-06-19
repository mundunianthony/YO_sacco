import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { DollarSign, Plus, Minus } from "lucide-react";
import { memberApi } from "@/lib/api";

interface SavingsData {
  currentBalance: number;
  transactions: Array<{
    _id: string;
    type: string;
    amount: number;
    createdAt: string;
    description: string;
    balanceAfter: number;
  }>;
}

const MemberSavings = () => {
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [savingsData, setSavingsData] = useState<SavingsData | null>(null);
  const { toast } = useToast();

  const fetchSavingsData = async () => {
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
  };

  useEffect(() => {
    fetchSavingsData();
  }, [toast]);

  const handleDeposit = async (e: React.FormEvent) => {
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
        paymentMethod: 'cash', // You might want to add a payment method selector
      });

      toast({
        title: "Deposit Successful",
        description: `UGX${amount.toLocaleString()} has been added to your savings`,
      });
      
      setDepositAmount("");
      setIsDepositOpen(false);
      fetchSavingsData(); // Refresh data
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process deposit",
        variant: "destructive",
      });
    }
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

      await memberApi.makeWithdrawal({
        amount,
        paymentMethod: 'cash', // You might want to add a payment method selector
      });

      toast({
        title: "Withdrawal Successful",
        description: `UGX${amount.toLocaleString()} has been withdrawn from your savings`,
      });
      
      setWithdrawAmount("");
      setIsWithdrawOpen(false);
      fetchSavingsData(); // Refresh data
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process withdrawal",
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
                UGX{savingsData?.currentBalance.toLocaleString() ?? '0'}
              </div>
              <p className="text-muted-foreground mt-2">
                Available for withdrawal
              </p>
              <div className="flex gap-2 mt-4">
                <Dialog open={isDepositOpen} onOpenChange={setIsDepositOpen}>
                  <DialogTrigger asChild>
                    <Button className="flex-1">
                      <Plus className="h-4 w-4 mr-2" />
                      Deposit
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Make a Deposit</DialogTitle>
                      <DialogDescription>
                        Add money to your savings account
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleDeposit} className="space-y-4">
                      <div>
                        <Label htmlFor="deposit-amount">Amount (UGX)</Label>
                        <Input
                          id="deposit-amount"
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
                          Maximum: UGX{savingsData?.currentBalance.toLocaleString() ?? '0'}
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
                  <div key={transaction._id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${
                        transaction.amount > 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                      }`}>
                        {transaction.amount > 0 ? 
                          <Plus className="h-4 w-4" /> : 
                          <Minus className="h-4 w-4" />
                        }
                      </div>
                      <div>
                        <p className="font-medium">{transaction.type}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(transaction.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${
                        transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.amount > 0 ? '+' : ''}UGX{Math.abs(transaction.amount).toLocaleString()}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Balance: UGX{transaction.balanceAfter.toLocaleString()}
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
