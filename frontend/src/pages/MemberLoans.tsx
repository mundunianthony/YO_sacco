import { useState, useEffect, useRef } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { CreditCard, Plus, DollarSign, CheckCircle, X, Wallet, Clock } from "lucide-react";
import { memberApi, adminApi } from "@/lib/api";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";

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
  totalPaidAmount?: number;
  paymentProgress?: number;
  nextPaymentDate: string;
  createdAt: string;
  paymentHistory: Array<{
    amount: number;
    date: string;
    receiptNumber: string;
    paymentType?: 'partial' | 'full';
  }>;
}

interface Member {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  memberId: string;
  role: string;
}

interface UserProfile {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  memberId: string;
  savingsBalance: number;
  loanBalance: number;
}

const MemberLoans = () => {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [isApplyOpen, setIsApplyOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const { toast } = useToast();

  const [loanApplication, setLoanApplication] = useState({
    amount: "",
    purpose: "",
    term: "12",
    collateral: "",
    guarantors: [],
  });

  const [paymentData, setPaymentData] = useState({
    amount: "",
    paymentType: "partial", // partial or full
  });

  const [members, setMembers] = useState<Member[]>([]);
  const [selectedGuarantors, setSelectedGuarantors] = useState<string[]>([]);
  const [guarantorSearch, setGuarantorSearch] = useState("");
  const [isGuarantorPopoverOpen, setIsGuarantorPopoverOpen] = useState(false);
  const currentUser = JSON.parse(localStorage.getItem("currentUser") || '{}');

  // Check if user has an active or pending loan
  const hasActiveLoan = loans.some(l => l.status === 'active' || l.status === 'pending' || l.status === 'approved');

  const filteredMembers = members.filter(m =>
    m.role === 'member' &&
    m._id !== currentUser._id &&
    ((`${m.firstName} ${m.lastName}`.toLowerCase().includes(guarantorSearch.toLowerCase())) ||
     (m.email?.toLowerCase().includes(guarantorSearch.toLowerCase()))
    )
  );

  const handleGuarantorToggle = (memberId: string) => {
    setSelectedGuarantors(prev => 
      prev.includes(memberId) 
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  const removeGuarantor = (memberId: string) => {
    setSelectedGuarantors(prev => prev.filter(id => id !== memberId));
  };

  const fetchLoans = async () => {
    try {
      const response = await memberApi.getLoans();
      setLoans(response.data.data);
      // Debug log
      console.log('Fetched loans:', response.data.data.map(l => ({
        loanNumber: l.loanNumber,
        totalPaidAmount: l.totalPaidAmount,
        paymentProgress: l.paymentProgress,
        paymentHistory: l.paymentHistory?.length
      })));
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

  const fetchUserProfile = async () => {
    try {
      const response = await memberApi.getProfile();
      setUserProfile(response.data.data);
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
    }
  };

  useEffect(() => {
    fetchLoans();
    fetchUserProfile();
    // Fetch members for guarantor selection
    const fetchMembers = async () => {
      try {
        const response = await memberApi.getAllMembers();
        setMembers(response.data.data || []);
        console.log('Fetched members:', response.data.data, 'Current user:', currentUser);
      } catch (error) {
        // ignore
      }
    };
    fetchMembers();
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
        guarantors: selectedGuarantors,
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
        guarantors: [],
      });
      setSelectedGuarantors([]);
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
    if (!selectedLoan || !userProfile) return;

    try {
      let amount = parseFloat(paymentData.amount);
      
      // If full payment is selected, use the remaining balance
      if (paymentData.paymentType === "full") {
        amount = selectedLoan.remainingBalance;
      }

      if (amount <= 0) {
        toast({
          title: "Invalid Amount",
          description: "Please enter a valid amount",
          variant: "destructive",
        });
        return;
      }

      // Ensure amount is an integer (no decimals)
      const paymentAmount = Math.floor(amount);
      if (paymentAmount !== amount) {
        toast({
          title: "Invalid Amount",
          description: "Amount must be a whole number (no decimals)",
          variant: "destructive",
        });
        return;
      }

      if (paymentAmount > selectedLoan.remainingBalance) {
        toast({
          title: "Amount Too High",
          description: "Payment amount cannot exceed remaining balance",
          variant: "destructive",
        });
        return;
      }

      if (paymentAmount > userProfile.savingsBalance) {
        toast({
          title: "Insufficient Savings",
          description: "You don't have enough money in your savings account. Please add money to your savings first.",
          variant: "destructive",
        });
        return;
      }

      await memberApi.makeLoanPayment(selectedLoan._id, {
        amount: paymentAmount,
      });

      toast({
        title: "Payment Successful",
        description: `UGX${paymentAmount.toLocaleString()} has been deducted from your savings and applied to your loan${paymentAmount === selectedLoan.remainingBalance ? '. Your loan is now cleared!' : ''}`,
      });

      setPaymentData({ amount: "", paymentType: "partial" });
      setIsPaymentOpen(false);
      setSelectedLoan(null);
      fetchLoans();
      fetchUserProfile(); // Refresh user profile to get updated savings balance
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to process payment",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'approved':
        return <Badge className="bg-blue-100 text-blue-800">Approved</Badge>;
      case 'paid':
        return <Badge className="bg-green-100 text-green-800">Cleared</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  const getPaymentTypeBadge = (paymentType: 'partial' | 'full') => {
    return paymentType === 'full' ? (
      <Badge className="bg-green-100 text-green-800 text-xs">
        <CheckCircle className="h-3 w-3 mr-1" />
        Full Payment
      </Badge>
    ) : (
      <Badge className="bg-blue-100 text-blue-800 text-xs">
        <Clock className="h-3 w-3 mr-1" />
        Partial Payment
      </Badge>
    );
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
              <Button disabled={hasActiveLoan}>
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
                    <Label htmlFor="amount">Loan Amount (UGX)</Label>
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
                  <Label>Guarantors (Select other members)</Label>
                  <Popover open={isGuarantorPopoverOpen} onOpenChange={setIsGuarantorPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={isGuarantorPopoverOpen}
                        className="w-full justify-between"
                      >
                        {selectedGuarantors.length === 0
                          ? "Select guarantors..."
                          : `${selectedGuarantors.length} guarantor(s) selected`}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                      <div className="p-3 border-b">
                        <Input
                          placeholder="Search members..."
                          value={guarantorSearch}
                          onChange={(e) => setGuarantorSearch(e.target.value)}
                          className="h-8"
                        />
                      </div>
                      <ScrollArea className="h-64">
                        <div className="p-1">
                          {filteredMembers.length === 0 ? (
                            <div className="p-2 text-sm text-muted-foreground text-center">
                              No members found
                            </div>
                          ) : (
                            filteredMembers.map((member) => (
                              <div
                                key={member._id}
                                className="flex items-center space-x-2 p-2 hover:bg-accent rounded-sm cursor-pointer"
                                onClick={() => handleGuarantorToggle(member._id)}
                              >
                                <Checkbox
                                  checked={selectedGuarantors.includes(member._id)}
                                  onChange={() => handleGuarantorToggle(member._id)}
                                />
                                <div className="flex-1">
                                  <div className="text-sm font-medium">
                                    {member.firstName} {member.lastName}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {member.email}
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </ScrollArea>
                    </PopoverContent>
                  </Popover>
                  
                  {/* Selected Guarantors Display */}
                  {selectedGuarantors.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {selectedGuarantors.map(id => {
                        const member = members.find(m => m._id === id);
                        return member ? (
                          <Badge key={id} variant="secondary" className="flex items-center gap-1">
                            {member.firstName} {member.lastName}
                            <button
                              type="button"
                              onClick={() => removeGuarantor(id)}
                              className="ml-1 hover:text-destructive"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ) : null;
                      })}
                    </div>
                  )}
                </div>
                <Button type="submit" className="w-full">
                  Submit Application
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Savings Balance Card */}
        {userProfile && (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-blue-800">Available Savings Balance</p>
                    <p className="text-lg font-bold text-blue-900">UGX{userProfile.savingsBalance.toLocaleString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-blue-600">Loan payments will be deducted from your savings</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {hasActiveLoan && (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-yellow-800">
                <CreditCard className="h-4 w-4" />
                <p className="text-sm">
                  You already have an active loan application or loan. You cannot apply for another loan until your current loan is cleared.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 gap-6">
          {loans.map((loan) => (
            <Card key={loan._id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      Loan #{loan.loanNumber}
                      {loan.status === 'paid' && <CheckCircle className="h-5 w-5 text-green-600" />}
                    </CardTitle>
                    <CardDescription>
                      {loan.purpose}
                    </CardDescription>
                  </div>
                  <div>
                    {getStatusBadge(loan.status)}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Amount</p>
                    <p className="font-medium">UGX{(loan.amount || 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Term</p>
                    <p className="font-medium">{loan.term || 0} months</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Interest Rate</p>
                    <p className="font-medium">{loan.interestRate || 0}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Monthly Payment</p>
                    <p className="font-medium">UGX{(loan.monthlyPayment || 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Payment</p>
                    <p className="font-medium">UGX{(loan.totalPayment || 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Remaining Balance</p>
                    <p className="font-medium text-lg text-primary">UGX{(loan.remainingBalance || 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Paid</p>
                    <p className="font-medium text-green-600">UGX{(loan.totalPaidAmount || 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Payment Progress</p>
                    <div className="flex items-center space-x-2">
                      {loan.status === 'rejected' ? (
                        <span className="text-sm text-gray-500">Not applicable</span>
                      ) : loan.status === 'paid' || loan.status === 'cleared' ? (
                        <>
                          <Progress value={100} className="w-16" />
                          <span className="text-sm font-medium text-green-600">100%</span>
                        </>
                      ) : (
                        <>
                          <Progress value={((loan.paymentProgress || 0) * 100)} className="w-16" />
                          <span className="text-sm font-medium text-green-600">
                            {((loan.paymentProgress || 0) * 100).toFixed(1)}%
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  {loan.nextPaymentDate && (
                    <div>
                      <p className="text-sm text-muted-foreground">Next Payment Due</p>
                      <p className="font-medium">{new Date(loan.nextPaymentDate).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>
                {loan.paymentHistory && loan.paymentHistory.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-2">Payment History</h3>
                    <div className="border rounded-md">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Receipt</TableHead>
                            <TableHead>Payment Type</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {loan.paymentHistory.map((payment, index) => (
                            <TableRow key={index}>
                              <TableCell>{new Date(payment.date).toLocaleDateString()}</TableCell>
                              <TableCell>UGX{(payment.amount || 0).toLocaleString()}</TableCell>
                              <TableCell>{payment.receiptNumber || 'N/A'}</TableCell>
                              <TableCell>{getPaymentTypeBadge(payment.paymentType || 'partial')}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
                {loan.status === 'active' && (
                  <div className="mt-6 flex justify-end">
                    <Button onClick={() => {
                      setSelectedLoan(loan);
                      setIsPaymentOpen(true);
                    }}>
                      <DollarSign className="h-4 w-4 mr-2" />
                      Make Payment
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Payment Dialog */}
        <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Make Loan Payment</DialogTitle>
              <DialogDescription>
                Payment will be deducted from your savings account
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleLoanPayment} className="space-y-4">
              {/* Savings Balance Info */}
              {userProfile && (
                <div className="p-3 bg-blue-50 rounded-md">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-blue-700">Available Savings:</span>
                    <span className="font-medium text-blue-900">UGX{userProfile.savingsBalance.toLocaleString()}</span>
                  </div>
                </div>
              )}
              
              <div>
                <Label htmlFor="paymentType">Payment Type</Label>
                <Select
                  value={paymentData.paymentType}
                  onValueChange={(value) => setPaymentData({ ...paymentData, paymentType: value as "partial" | "full" })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="partial">Partial Payment</SelectItem>
                    <SelectItem value="full">Full Payment (UGX{(selectedLoan?.remainingBalance || 0).toLocaleString()})</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {paymentData.paymentType === "partial" && (
                <div>
                  <Label htmlFor="paymentAmount">Amount (UGX)</Label>
                  <Input
                    id="paymentAmount"
                    type="number"
                    min="1"
                    step="1"
                    placeholder="Enter whole number amount"
                    value={paymentData.amount}
                    onChange={(e) => {
                      // Only allow integers
                      const value = e.target.value;
                      if (value === '' || /^\d+$/.test(value)) {
                        setPaymentData({ ...paymentData, amount: value });
                      }
                    }}
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Enter a whole number amount (no decimals)
                  </p>
                </div>
              )}
              <Button type="submit" className="w-full">
                Process Payment
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default MemberLoans;

