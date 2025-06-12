
import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { DollarSign, Plus, Minus } from "lucide-react";

const MemberSavings = () => {
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const { toast } = useToast();

  const currentBalance = 12456;

  const handleDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    if (parseFloat(depositAmount) > 0) {
      toast({
        title: "Deposit Successful",
        description: `$${depositAmount} has been added to your savings`,
      });
      setDepositAmount("");
      setIsDepositOpen(false);
    }
  };

  const handleWithdraw = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(withdrawAmount);
    if (amount > 0 && amount <= currentBalance) {
      toast({
        title: "Withdrawal Successful",
        description: `$${withdrawAmount} has been withdrawn from your savings`,
      });
      setWithdrawAmount("");
      setIsWithdrawOpen(false);
    } else if (amount > currentBalance) {
      toast({
        title: "Insufficient Funds",
        description: "You cannot withdraw more than your current balance",
        variant: "destructive",
      });
    }
  };

  const transactions = [
    { id: 1, type: "Deposit", amount: 500, date: "2024-06-12", balance: 12456 },
    { id: 2, type: "Withdrawal", amount: -200, date: "2024-06-10", balance: 11956 },
    { id: 3, type: "Deposit", amount: 300, date: "2024-06-08", balance: 12156 },
    { id: 4, type: "Deposit", amount: 1000, date: "2024-06-05", balance: 11856 },
    { id: 5, type: "Withdrawal", amount: -150, date: "2024-06-01", balance: 10856 },
  ];

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
                ${currentBalance.toLocaleString()}
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
                        <Label htmlFor="deposit-amount">Amount ($)</Label>
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
                        <Label htmlFor="withdraw-amount">Amount ($)</Label>
                        <Input
                          id="withdraw-amount"
                          type="number"
                          min="1"
                          max={currentBalance}
                          step="0.01"
                          placeholder="Enter amount"
                          value={withdrawAmount}
                          onChange={(e) => setWithdrawAmount(e.target.value)}
                          required
                        />
                        <p className="text-sm text-muted-foreground mt-1">
                          Maximum: ${currentBalance.toLocaleString()}
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
                {transactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
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
                        <p className="text-sm text-mute    -foreground">{transaction.date}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${
                        transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.amount > 0 ? '+' : ''}${Math.abs(transaction.amount).toLocaleString()}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Balance: ${transaction.balance.toLocaleString()}
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
