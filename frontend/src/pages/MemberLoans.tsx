import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { CreditCard, Plus, DollarSign } from "lucide-react";
import { memberApi } from "@/lib/api";

interface Loan {
  _id: string;
  loanNumber: string;
  amount: number;
  purpose: string;
  status: string;
  interestRate: number;
  term: number;
  monthlyPayment: number;
  totalPayment: number;
  remainingBalance: number;
  nextPaymentDate: string;
  createdAt: string;
}

const MemberLoans = () => {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [isApplyOpen, setIsApplyOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const { toast } = useToast();

  const [loanApplication, setLoanApplication] = useState({
    amount: "",
    purpose: "",
    term: "12",
    collateral: "",
    guarantors: [{ name: "", phone: "", address: "", relationship: "" }],
  });

  const [paymentData, setPaymentData] = useState({
    amount: "",
    paymentMethod: "cash",
  });

  const fetchLoans = async () => {
    try {
      const response = await memberApi.getLoans();
      setLoans(response.data.data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load loans",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoans();
  }, [toast]);

  const handleLoanApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const amount = parseFloat(loanApplication.amount);
      const term = parseInt(loanApplication.term);

      if (amount <= 0 || term <= 0) {
        toast({
          title: "Invalid Input",
          description: "Please enter valid amount and term",
          variant: "destructive",
        });
        return;
      }

      await memberApi.applyForLoan({
        amount,
        purpose: loanApplication.purpose,
        term,
        collateral: loanApplication.collateral,
        guarantors: loanApplication.guarantors.filter(g => g.name && g.phone),
      });

      toast({
        title: "Loan Application Submitted",
        description: "Your loan application has been submitted for review",
      });

      setLoanApplication({
        amount: "",
        purpose: "",
        term: "12",
        collateral: "",
        guarantors: [{ name: "", phone: "", address: "", relationship: "" }],
      });
      setIsApplyOpen(false);
      fetchLoans();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit loan application",
        variant: "destructive",
      });
    }
  };

  const handleLoanPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLoan) return;

    try {
      const amount = parseFloat(paymentData.amount);
      if (amount <= 0) {
        toast({
          title: "Invalid Amount",
          description: "Please enter a valid amount",
          variant: "destructive",
        });
        return;
      }

      await memberApi.makeLoanPayment(selectedLoan._id, {
        amount,
        paymentMethod: paymentData.paymentMethod,
      });

      toast({
        title: "Payment Successful",
        description: `$${amount.toLocaleString()} has been applied to your loan`,
      });

      setPaymentData({ amount: "", paymentMethod: "cash" });
      setIsPaymentOpen(false);
      setSelectedLoan(null);
      fetchLoans();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process payment",
        variant: "destructive",
      });
    }
  };

  const addGuarantor = () => {
    setLoanApplication({
      ...loanApplication,
      guarantors: [
        ...loanApplication.guarantors,
        { name: "", phone: "", address: "", relationship: "" },
      ],
    });
  };

  const removeGuarantor = (index: number) => {
    setLoanApplication({
      ...loanApplication,
      guarantors: loanApplication.guarantors.filter((_, i) => i !== index),
    });
  };

  const updateGuarantor = (index: number, field: string, value: string) => {
    const updatedGuarantors = [...loanApplication.guarantors];
    updatedGuarantors[index] = { ...updatedGuarantors[index], [field]: value };
    setLoanApplication({ ...loanApplication, guarantors: updatedGuarantors });
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
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Loans</h1>
            <p className="text-muted-foreground">
              Manage your loans and payments
            </p>
          </div>
          <Dialog open={isApplyOpen} onOpenChange={setIsApplyOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Apply for Loan
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Apply for a Loan</DialogTitle>
                <DialogDescription>
                  Fill in the details to apply for a loan
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleLoanApplication} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="amount">Loan Amount ($)</Label>
                    <Input
                      id="amount"
                      type="number"
                      min="1000"
                      step="100"
                      value={loanApplication.amount}
                      onChange={(e) => setLoanApplication({ ...loanApplication, amount: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="term">Term (months)</Label>
                    <Input
                      id="term"
                      type="number"
                      min="1"
                      max="36"
                      value={loanApplication.term}
                      onChange={(e) => setLoanApplication({ ...loanApplication, term: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="purpose">Purpose</Label>
                  <Input
                    id="purpose"
                    value={loanApplication.purpose}
                    onChange={(e) => setLoanApplication({ ...loanApplication, purpose: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="collateral">Collateral (Optional)</Label>
                  <Input
                    id="collateral"
                    value={loanApplication.collateral}
                    onChange={(e) => setLoanApplication({ ...loanApplication, collateral: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Guarantors</Label>
                  {loanApplication.guarantors.map((guarantor, index) => (
                    <div key={index} className="grid grid-cols-2 gap-4 mt-2">
                      <div>
                        <Input
                          placeholder="Name"
                          value={guarantor.name}
                          onChange={(e) => updateGuarantor(index, 'name', e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <Input
                          placeholder="Phone"
                          value={guarantor.phone}
                          onChange={(e) => updateGuarantor(index, 'phone', e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <Input
                          placeholder="Address"
                          value={guarantor.address}
                          onChange={(e) => updateGuarantor(index, 'address', e.target.value)}
                          required
                        />
                      </div>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Relationship"
                          value={guarantor.relationship}
                          onChange={(e) => updateGuarantor(index, 'relationship', e.target.value)}
                          required
                        />
                        {index > 0 && (
                          <Button
                            type="button"
                            variant="destructive"
                            onClick={() => removeGuarantor(index)}
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-2"
                    onClick={addGuarantor}
                  >
                    Add Guarantor
                  </Button>
                </div>
                <Button type="submit" className="w-full">
                  Submit Application
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {loans.map((loan) => (
            <Card key={loan._id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>Loan #{loan.loanNumber}</CardTitle>
                    <CardDescription>
                      {loan.purpose}
                    </CardDescription>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                    loan.status === 'active' ? 'bg-green-100 text-green-800' :
                    loan.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    loan.status === 'paid' ? 'bg-blue-100 text-blue-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Amount</p>
                    <p className="font-medium">${loan.amount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Monthly Payment</p>
                    <p className="font-medium">${loan.monthlyPayment.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Remaining Balance</p>
                    <p className="font-medium">${loan.remainingBalance.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Next Payment</p>
                    <p className="font-medium">
                      {loan.nextPaymentDate
                        ? new Date(loan.nextPaymentDate).toLocaleDateString()
                        : 'N/A'}
                    </p>
                  </div>
                </div>
                {loan.status === 'active' && (
                  <div className="mt-4">
                    <Button
                      onClick={() => {
                        setSelectedLoan(loan);
                        setIsPaymentOpen(true);
                      }}
                    >
                      <DollarSign className="h-4 w-4 mr-2" />
                      Make Payment
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Make Loan Payment</DialogTitle>
              <DialogDescription>
                Enter the payment amount for loan #{selectedLoan?.loanNumber}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleLoanPayment} className="space-y-4">
              <div>
                <Label htmlFor="payment-amount">Amount ($)</Label>
                <Input
                  id="payment-amount"
                  type="number"
                  min="1"
                  max={selectedLoan?.remainingBalance}
                  step="0.01"
                  value={paymentData.amount}
                  onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                  required
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Maximum: ${selectedLoan?.remainingBalance.toLocaleString()}
                </p>
              </div>
              <Button type="submit" className="w-full">
                Confirm Payment
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default MemberLoans;
