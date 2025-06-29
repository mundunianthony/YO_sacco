import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { adminApi } from "@/lib/api";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, DollarSign, Users, AlertTriangle } from "lucide-react";

interface Loan {
  _id: string;
  loanNumber: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
    memberId: string;
  };
  amount: number;
  purpose: string;
  status: string;
  term: number;
  interestRate: number;
  monthlyPayment: number;
  totalPayment: number;
  remainingBalance: number;
  nextPaymentDate: string;
  lastPaymentDate: string;
  approvedBy?: {
    firstName: string;
    lastName: string;
  };
  approvedAt: string;
  createdAt: string;
  paymentHistory: Array<{
    amount: number;
    date: string;
    receiptNumber: string;
  }>;
}

interface LoanStats {
  total: number;
  pending: number;
  active: number;
  paid: number;
  defaulted: number;
  totalAmount: number;
  totalInterest: number;
}

const AdminLoans = () => {
  const [allLoans, setAllLoans] = useState<Loan[]>([]);
  const [pendingLoans, setPendingLoans] = useState<Loan[]>([]);
  const [activeLoans, setActiveLoans] = useState<Loan[]>([]);
  const [approvedLoans, setApprovedLoans] = useState<Loan[]>([]);
  const [paidLoans, setPaidLoans] = useState<Loan[]>([]);
  const [defaultedLoans, setDefaultedLoans] = useState<Loan[]>([]);
  const [loanStats, setLoanStats] = useState<LoanStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [isLoanDetailsOpen, setIsLoanDetailsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAmount, setFilterAmount] = useState("all");
  const { toast } = useToast();

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  useEffect(() => {
    fetchLoans();
    fetchLoanStats();
  }, []);

  const fetchLoans = async () => {
    try {
      const response = await adminApi.getLoans();
      const loans = response.data.data;
      setAllLoans(loans);
      
      setPendingLoans(loans.filter((loan: Loan) => loan.status === 'pending'));
      setActiveLoans(loans.filter((loan: Loan) => loan.status === 'active'));
      setApprovedLoans(loans.filter((loan: Loan) => loan.status === 'approved'));
      setPaidLoans(loans.filter((loan: Loan) => loan.status === 'paid' || loan.status === 'cleared'));
      setDefaultedLoans(loans.filter((loan: Loan) => loan.status === 'defaulted'));
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

  const fetchLoanStats = async () => {
    try {
      const response = await adminApi.getLoanStats();
      setLoanStats(response.data.data);
    } catch (error) {
      console.error("Failed to load loan stats:", error);
    }
  };

  const handleApproveLoan = async (loanId: string) => {
    try {
      await adminApi.updateLoanStatus(loanId, { status: 'approved' });
      toast({
        title: "Success",
        description: "Loan approved successfully",
      });
      fetchLoans();
      fetchLoanStats();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to approve loan",
        variant: "destructive",
      });
    }
  };

  const handleRejectLoan = async (loanId: string) => {
    try {
      await adminApi.updateLoanStatus(loanId, { 
        status: 'rejected',
        rejectionReason: 'Application rejected by admin'
      });
      toast({
        title: "Success",
        description: "Loan rejected successfully",
      });
      fetchLoans();
      fetchLoanStats();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reject loan",
        variant: "destructive",
      });
    }
  };

  const handleActivateLoan = async (loanId: string) => {
    try {
      await adminApi.updateLoanStatus(loanId, { status: 'active' });
      toast({
        title: "Success",
        description: "Loan activated successfully",
      });
      fetchLoans();
      fetchLoanStats();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to activate loan",
        variant: "destructive",
      });
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'pending':
        return 'outline';
      case 'approved':
        return 'secondary';
      case 'active':
        return 'default';
      case 'paid':
      case 'cleared':
        return 'default';
      case 'defaulted':
        return 'destructive';
      case 'rejected':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-600';
      case 'approved':
        return 'text-blue-600';
      case 'active':
        return 'text-green-600';
      case 'paid':
      case 'cleared':
        return 'text-green-600';
      case 'defaulted':
        return 'text-red-600';
      case 'rejected':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const viewLoanDetails = (loan: Loan) => {
    setSelectedLoan(loan);
    setIsLoanDetailsOpen(true);
  };

  const filterLoans = (loans: Loan[]) => {
    return loans.filter((loan) => {
      const matchesSearch = searchTerm === "" || 
        loan.user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        loan.user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        loan.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        loan.loanNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        loan.purpose.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesAmount = filterAmount === "all" || 
        (filterAmount === "small" && loan.amount < 100000) ||
        (filterAmount === "medium" && loan.amount >= 100000 && loan.amount < 500000) ||
        (filterAmount === "large" && loan.amount >= 500000);
      
      return matchesSearch && matchesAmount;
    });
  };

  // Prepare chart data
  const loanStatusData = [
    { name: 'Pending', value: pendingLoans.length },
    { name: 'Approved', value: approvedLoans.length },
    { name: 'Active', value: activeLoans.length },
    { name: 'Paid/Cleared', value: paidLoans.length },
    { name: 'Defaulted', value: defaultedLoans.length },
  ];

  const loanAmountData = [
    { range: 'Small (<100K)', count: allLoans.filter(l => l.amount < 100000).length },
    { range: 'Medium (100K-500K)', count: allLoans.filter(l => l.amount >= 100000 && l.amount < 500000).length },
    { range: 'Large (>500K)', count: allLoans.filter(l => l.amount >= 500000).length },
  ];

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
          <h1 className="text-3xl font-bold">Loan Management</h1>
          <p className="text-muted-foreground">
            Review and manage loan applications and active loans
          </p>
        </div>

        {/* Statistics Cards */}
        {loanStats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Loans</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loanStats.total}</div>
                <p className="text-xs text-muted-foreground">
                  {loanStats.active} currently active
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">UGX{loanStats.totalAmount.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  Outstanding loans
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Applications</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loanStats.pending}</div>
                <p className="text-xs text-muted-foreground">
                  Awaiting approval
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Defaulted Loans</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loanStats.defaulted}</div>
                <p className="text-xs text-muted-foreground">
                  Require attention
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Loan Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={loanStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {loanStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Loan Amount Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={loanAmountData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="range" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter Controls */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">Search Loans</label>
                <Input
                  placeholder="Search by member name, email, loan number, or purpose..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="w-48">
                <label className="text-sm font-medium mb-2 block">Filter by Amount</label>
                <Select value={filterAmount} onValueChange={setFilterAmount}>
                  <SelectTrigger>
                    <SelectValue placeholder="All amounts" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All amounts</SelectItem>
                    <SelectItem value="small">Small (&lt; 100K)</SelectItem>
                    <SelectItem value="medium">Medium (100K - 500K)</SelectItem>
                    <SelectItem value="large">Large (&gt; 500K)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm("");
                    setFilterAmount("all");
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="pending" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="pending">Pending ({filterLoans(pendingLoans).length})</TabsTrigger>
            <TabsTrigger value="approved">Approved ({filterLoans(approvedLoans).length})</TabsTrigger>
            <TabsTrigger value="active">Active ({filterLoans(activeLoans).length})</TabsTrigger>
            <TabsTrigger value="paid">Paid/Cleared ({filterLoans(paidLoans).length})</TabsTrigger>
            <TabsTrigger value="defaulted">Defaulted ({filterLoans(defaultedLoans).length})</TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            <Card>
              <CardHeader>
                <CardTitle>Pending Applications</CardTitle>
                <CardDescription>
                  Review and process loan applications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Member</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Purpose</TableHead>
                      <TableHead>Term</TableHead>
                      <TableHead>Date Applied</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filterLoans(pendingLoans).map((loan) => (
                      <TableRow key={loan._id}>
                        <TableCell className="font-medium">
                          {loan.user.firstName} {loan.user.lastName}
                        </TableCell>
                        <TableCell>UGX{loan.amount.toLocaleString()}</TableCell>
                        <TableCell>{loan.purpose}</TableCell>
                        <TableCell>{loan.term} months</TableCell>
                        <TableCell>
                          {new Date(loan.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(loan.status)}>
                            {loan.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleApproveLoan(loan._id)}
                            >
                              Approve
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleRejectLoan(loan._id)}
                            >
                              Reject
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="approved">
            <Card>
              <CardHeader>
                <CardTitle>Approved Loans</CardTitle>
                <CardDescription>
                  Loans that have been approved but not yet activated
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Member</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Purpose</TableHead>
                      <TableHead>Term</TableHead>
                      <TableHead>Approved By</TableHead>
                      <TableHead>Date Approved</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filterLoans(approvedLoans).map((loan) => (
                      <TableRow key={loan._id}>
                        <TableCell className="font-medium">
                          {loan.user.firstName} {loan.user.lastName}
                        </TableCell>
                        <TableCell>UGX{loan.amount.toLocaleString()}</TableCell>
                        <TableCell>{loan.purpose}</TableCell>
                        <TableCell>{loan.term} months</TableCell>
                        <TableCell>
                          {loan.approvedBy ? `${loan.approvedBy.firstName} ${loan.approvedBy.lastName}` : 'N/A'}
                        </TableCell>
                        <TableCell>
                          {loan.approvedAt ? new Date(loan.approvedAt).toLocaleDateString() : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleActivateLoan(loan._id)}
                            >
                              Activate
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => viewLoanDetails(loan)}
                            >
                              View Details
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="active">
            <Card>
              <CardHeader>
                <CardTitle>Active Loans</CardTitle>
                <CardDescription>
                  Monitor active loans and repayment schedules
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Member</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Remaining Balance</TableHead>
                      <TableHead>Monthly Payment</TableHead>
                      <TableHead>Next Payment Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filterLoans(activeLoans).map((loan) => (
                      <TableRow key={loan._id}>
                        <TableCell className="font-medium">
                          {loan.user.firstName} {loan.user.lastName}
                        </TableCell>
                        <TableCell>UGX{loan.amount.toLocaleString()}</TableCell>
                        <TableCell>UGX{loan.remainingBalance.toLocaleString()}</TableCell>
                        <TableCell>UGX{loan.monthlyPayment.toLocaleString()}</TableCell>
                        <TableCell>
                          {loan.nextPaymentDate
                            ? new Date(loan.nextPaymentDate).toLocaleDateString()
                            : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(loan.status)}>
                            {loan.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => viewLoanDetails(loan)}
                          >
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="paid">
            <Card>
              <CardHeader>
                <CardTitle>Paid/Cleared Loans</CardTitle>
                <CardDescription>
                  Loans that have been fully repaid
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Member</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Purpose</TableHead>
                      <TableHead>Term</TableHead>
                      <TableHead>Date Completed</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filterLoans(paidLoans).map((loan) => (
                      <TableRow key={loan._id}>
                        <TableCell className="font-medium">
                          {loan.user.firstName} {loan.user.lastName}
                        </TableCell>
                        <TableCell>UGX{loan.amount.toLocaleString()}</TableCell>
                        <TableCell>{loan.purpose}</TableCell>
                        <TableCell>{loan.term} months</TableCell>
                        <TableCell>
                          {loan.lastPaymentDate
                            ? new Date(loan.lastPaymentDate).toLocaleDateString()
                            : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="default" className="bg-green-100 text-green-800">
                            {loan.status === 'paid' ? 'Cleared' : loan.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => viewLoanDetails(loan)}
                          >
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="defaulted">
            <Card>
              <CardHeader>
                <CardTitle>Defaulted Loans</CardTitle>
                <CardDescription>
                  Loans that are in default
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Member</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Remaining Balance</TableHead>
                      <TableHead>Next Payment Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filterLoans(defaultedLoans).map((loan) => (
                      <TableRow key={loan._id}>
                        <TableCell className="font-medium">
                          {loan.user.firstName} {loan.user.lastName}
                        </TableCell>
                        <TableCell>UGX{loan.amount.toLocaleString()}</TableCell>
                        <TableCell>UGX{loan.remainingBalance.toLocaleString()}</TableCell>
                        <TableCell>
                          {loan.nextPaymentDate
                            ? new Date(loan.nextPaymentDate).toLocaleDateString()
                            : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(loan.status)}>
                            {loan.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => viewLoanDetails(loan)}
                          >
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Loan Details Dialog */}
        <Dialog open={isLoanDetailsOpen} onOpenChange={setIsLoanDetailsOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Loan Details</DialogTitle>
              <DialogDescription>
                Detailed information about the selected loan
              </DialogDescription>
            </DialogHeader>
            {selectedLoan && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold">Loan Information</h4>
                    <div className="space-y-2 text-sm">
                      <div><span className="font-medium">Loan Number:</span> {selectedLoan.loanNumber}</div>
                      <div><span className="font-medium">Amount:</span> UGX{selectedLoan.amount.toLocaleString()}</div>
                      <div><span className="font-medium">Purpose:</span> {selectedLoan.purpose}</div>
                      <div><span className="font-medium">Term:</span> {selectedLoan.term} months</div>
                      <div><span className="font-medium">Interest Rate:</span> {selectedLoan.interestRate}%</div>
                      <div><span className="font-medium">Status:</span> 
                        <Badge variant={getStatusBadgeVariant(selectedLoan.status)} className="ml-2">
                          {selectedLoan.status === 'paid' ? 'Cleared' : selectedLoan.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold">Member Information</h4>
                    <div className="space-y-2 text-sm">
                      <div><span className="font-medium">Name:</span> {selectedLoan.user.firstName} {selectedLoan.user.lastName}</div>
                      <div><span className="font-medium">Member ID:</span> {selectedLoan.user.memberId}</div>
                      <div><span className="font-medium">Email:</span> {selectedLoan.user.email}</div>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold">Payment Information</h4>
                    <div className="space-y-2 text-sm">
                      <div><span className="font-medium">Monthly Payment:</span> UGX{selectedLoan.monthlyPayment.toLocaleString()}</div>
                      <div><span className="font-medium">Total Payment:</span> UGX{selectedLoan.totalPayment.toLocaleString()}</div>
                      <div><span className="font-medium">Remaining Balance:</span> UGX{selectedLoan.remainingBalance.toLocaleString()}</div>
                      <div><span className="font-medium">Next Payment:</span> {selectedLoan.nextPaymentDate ? new Date(selectedLoan.nextPaymentDate).toLocaleDateString() : 'N/A'}</div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold">Approval Information</h4>
                    <div className="space-y-2 text-sm">
                      <div><span className="font-medium">Applied:</span> {new Date(selectedLoan.createdAt).toLocaleDateString()}</div>
                      <div><span className="font-medium">Approved By:</span> {selectedLoan.approvedBy ? `${selectedLoan.approvedBy.firstName} ${selectedLoan.approvedBy.lastName}` : 'N/A'}</div>
                      <div><span className="font-medium">Approved On:</span> {selectedLoan.approvedAt ? new Date(selectedLoan.approvedAt).toLocaleDateString() : 'N/A'}</div>
                    </div>
                  </div>
                </div>

                {selectedLoan.paymentHistory && selectedLoan.paymentHistory.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-semibold mb-2">Payment History</h4>
                      <div className="max-h-40 overflow-y-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Date</TableHead>
                              <TableHead>Amount</TableHead>
                              <TableHead>Receipt</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {selectedLoan.paymentHistory.map((payment, index) => (
                              <TableRow key={index}>
                                <TableCell>{new Date(payment.date).toLocaleDateString()}</TableCell>
                                <TableCell>UGX{payment.amount.toLocaleString()}</TableCell>
                                <TableCell>{payment.receiptNumber || 'N/A'}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default AdminLoans;

