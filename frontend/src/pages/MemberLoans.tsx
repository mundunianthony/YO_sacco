
import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Plus } from "lucide-react";

const MemberLoans = () => {
  const [loanType, setLoanType] = useState("");
  const [loanAmount, setLoanAmount] = useState("");
  const [repaymentPeriod, setRepaymentPeriod] = useState("");
  const [isApplicationOpen, setIsApplicationOpen] = useState(false);
  const { toast } = useToast();

  const handleLoanApplication = (e: React.FormEvent) => {
    e.preventDefault();
    if (loanType && loanAmount && repaymentPeriod) {
      toast({
        title: "Loan Application Submitted",
        description: "Your loan application has been submitted for review",
      });
      setLoanType("");
      setLoanAmount("");
      setRepaymentPeriod("");
      setIsApplicationOpen(false);
    }
  };

  const activeLoans = [
    {
      id: 1,
      type: "Personal",
      amount: 5000,
      remainingBalance: 3500,
      monthlyPayment: 425,
      nextDueDate: "2024-06-20",
      status: "Active"
    },
    {
      id: 2,
      type: "Emergency",
      amount: 2000,
      remainingBalance: 800,
      monthlyPayment: 200,
      nextDueDate: "2024-06-25",
      status: "Active"
    }
  ];

  const loanHistory = [
    { id: 1, type: "Personal", amount: 5000, period: "12 months", status: "Active", dateApplied: "2024-01-15" },
    { id: 2, type: "Emergency", amount: 2000, period: "6 months", status: "Active", dateApplied: "2024-03-20" },
    { id: 3, type: "Business", amount: 10000, period: "18 months", status: "Approved", dateApplied: "2024-05-01" },
    { id: 4, type: "Personal", amount: 3000, period: "9 months", status: "Repaid", dateApplied: "2023-08-10" },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active": return "bg-green-100 text-green-800";
      case "Approved": return "bg-blue-100 text-blue-800";
      case "Pending": return "bg-yellow-100 text-yellow-800";
      case "Repaid": return "bg-gray-100 text-gray-800";
      case "Rejected": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Loans</h1>
            <p className="text-muted-foreground">
              Manage your loan applications and repayments
            </p>
          </div>
          <Dialog open={isApplicationOpen} onOpenChange={setIsApplicationOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Apply for Loan
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Loan Application</DialogTitle>
                <DialogDescription>
                  Fill out the form to apply for a new loan
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleLoanApplication} className="space-y-4">
                <div>
                  <Label htmlFor="loan-type">Loan Type</Label>
                  <Select value={loanType} onValueChange={setLoanType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select loan type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="personal">Personal</SelectItem>
                      <SelectItem value="emergency">Emergency</SelectItem>
                      <SelectItem value="business">Business</SelectItem>
                      <SelectItem value="education">Education</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="loan-amount">Loan Amount ($)</Label>
                  <Input
                    id="loan-amount"
                    type="number"
                    min="100"
                    step="100"
                    placeholder="Enter loan amount"
                    value={loanAmount}
                    onChange={(e) => setLoanAmount(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="repayment-period">Repayment Period</Label>
                  <Select value={repaymentPeriod} onValueChange={setRepaymentPeriod}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select repayment period" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3 months</SelectItem>
                      <SelectItem value="6">6 months</SelectItem>
                      <SelectItem value="9">9 months</SelectItem>
                      <SelectItem value="12">12 months</SelectItem>
                      <SelectItem value="18">18 months</SelectItem>
                      <SelectItem value="24">24 months</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full">
                  Submit Application
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Active Loans
              </CardTitle>
              <CardDescription>
                Your current loan obligations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activeLoans.map((loan) => (
                  <div key={loan.id} className="p-4 bg-muted rounded-lg">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold">{loan.type} Loan</h3>
                        <p className="text-sm text-muted-foreground">
                          Original Amount: ${loan.amount.toLocaleString()}
                        </p>
                      </div>
                      <Badge className={getStatusColor(loan.status)}>
                        {loan.status}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Remaining Balance</p>
                        <p className="font-semibold">${loan.remainingBalance.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Monthly Payment</p>
                        <p className="font-semibold">${loan.monthlyPayment}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Next Due Date</p>
                        <p className="font-semibold">{loan.nextDueDate}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Loan History</CardTitle>
              <CardDescription>
                All your loan applications and their status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {loanHistory.map((loan) => (
                  <div key={loan.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <p className="font-medium">{loan.type} Loan</p>
                      <p className="text-sm text-muted-foreground">
                        ${loan.amount.toLocaleString()} • {loan.period}
                      </p>
                      <p className="text-sm text-muted-foreground">{loan.dateApplied}</p>
                    </div>
                    <Badge className={getStatusColor(loan.status)}>
                      {loan.status}
                    </Badge>
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

export default MemberLoans;
