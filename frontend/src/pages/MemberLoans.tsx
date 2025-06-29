import { useState, useEffect, useRef } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { CreditCard, Plus, DollarSign } from "lucide-react";
import { memberApi, adminApi } from "@/lib/api";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createPortal } from "react-dom";

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
    guarantors: [],
  });

  const [paymentData, setPaymentData] = useState({
    amount: "",
    paymentMethod: "cash",
  });

  const [members, setMembers] = useState<any[]>([]);
  const [selectedGuarantors, setSelectedGuarantors] = useState<string[]>([]);
  const [guarantorSearch, setGuarantorSearch] = useState("");
  const currentUser = JSON.parse(localStorage.getItem("currentUser") || '{}');

  const filteredMembers = members.filter(m =>
    m.role === 'member' &&
    m._id !== currentUser._id &&
    ((`${m.firstName} ${m.lastName}`.toLowerCase().includes(guarantorSearch.toLowerCase())) ||
     (m.email?.toLowerCase().includes(guarantorSearch.toLowerCase()))
    )
  );

  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownStyle, setDropdownStyle] = useState({} as React.CSSProperties);
  const [dropdownDirection, setDropdownDirection] = useState<'up' | 'down'>('down');

  useEffect(() => {
    if (!showDropdown) return;
    const input = inputRef.current;
    if (input) {
      const rect = input.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const direction = spaceBelow < 250 && spaceAbove > spaceBelow ? 'up' : 'down';
      setDropdownDirection(direction);
      setDropdownStyle({
        position: 'absolute',
        left: rect.left + window.scrollX,
        width: rect.width,
        zIndex: 9999,
        top: direction === 'down' ? rect.bottom + window.scrollY + 4 : undefined,
        bottom: direction === 'up' ? window.innerHeight - rect.top + 4 : undefined,
        maxHeight: 250,
        background: 'white',
        borderRadius: 8,
        boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
        border: '1px solid #e5e7eb',
        padding: 8,
        overflowY: 'auto',
      });
    }
  }, [showDropdown, guarantorSearch]);

  useEffect(() => {
    if (!showDropdown) return;
    const handleClick = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        dropdownRef.current.contains(e.target as Node)
      ) {
        // Allow interaction inside dropdown
        return;
      }
      if (
        inputRef.current &&
        inputRef.current.contains(e.target as Node)
      ) {
        // Allow interaction with input
        return;
      }
      setShowDropdown(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showDropdown]);

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
        description: `UGX${amount.toLocaleString()} has been applied to your loan`,
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
              <Button disabled={loans.some(l => l.status === 'active' || l.status === 'pending')}>
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
                  <Label>Guarantors</Label>
                  <div className="relative">
                    <Input
                      ref={inputRef}
                      placeholder="Search members..."
                      value={guarantorSearch || ''}
                      onFocus={() => setShowDropdown(true)}
                      onChange={e => {
                        setGuarantorSearch(e.target.value);
                        setShowDropdown(true);
                      }}
                      className="mb-2"
                    />
                    {showDropdown && createPortal(
                      <div
                        ref={dropdownRef}
                        style={dropdownStyle}
                        className="modern-guarantor-dropdown"
                      >
                        {filteredMembers.length === 0 ? (
                          <div className="p-2 text-muted-foreground">No members found.</div>
                        ) : (
                          filteredMembers.map((member) => (
                            <label
                              key={member._id}
                              className="flex items-center gap-2 px-2 py-1 cursor-pointer rounded hover:bg-gray-100 transition"
                              onMouseDown={e => e.stopPropagation()}
                            >
                              <input
                                type="checkbox"
                                value={member._id}
                                checked={selectedGuarantors.includes(member._id)}
                                onChange={e => {
                                  if (e.target.checked) {
                                    setSelectedGuarantors([...selectedGuarantors, member._id]);
                                  } else {
                                    setSelectedGuarantors(selectedGuarantors.filter(id => id !== member._id));
                                  }
                                }}
                                onMouseDown={e => e.stopPropagation()}
                              />
                              <span className="truncate">{member.firstName} {member.lastName}</span>
                            </label>
                          ))
                        )}
                      </div>,
                      document.body
                    )}
                    <div className="mt-2 flex flex-wrap gap-2">
                      {selectedGuarantors.map(id => {
                        const member = members.find(m => m._id === id);
                        return member ? (
                          <span key={id} className="bg-gray-200 rounded px-2 py-1 text-xs">
                            {member.firstName} {member.lastName}
                          </span>
                        ) : null;
                      })}
                    </div>
                  </div>
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
                    <p className="font-medium">UGX{loan.amount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Monthly Payment</p>
                    <p className="font-medium">UGX{loan.monthlyPayment.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Remaining Balance</p>
                    <p className="font-medium">UGX{loan.remainingBalance.toLocaleString()}</p>
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
                <Label htmlFor="payment-amount">Amount (UGX)</Label>
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
                  Maximum: UGX{selectedLoan?.remainingBalance.toLocaleString()}
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
