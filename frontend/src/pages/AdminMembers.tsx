import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { adminApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Eye, Download, FileText, BarChart3, TrendingUp, Users, DollarSign, ChevronDown } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

interface Member {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  savingsBalance: number;
  status: string;
  memberId: string;
  createdAt: string;
  loanBalance?: number;
}

interface Transaction {
  _id: string;
  type: string;
  amount: number;
  status: string;
  paymentMethod: string;
  description: string;
  createdAt: string;
  user: {
    firstName: string;
    lastName: string;
    memberId: string;
  };
}

interface MemberStats {
  totalMembers: number;
  activeMembers: number;
  totalSavings: number;
  monthlyGrowth: number;
  total: number;
  active: number;
  withLoans: number;
}

const AdminMembers = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [memberTransactions, setMemberTransactions] = useState<Transaction[]>([]);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [memberStats, setMemberStats] = useState<MemberStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isTransactionsOpen, setIsTransactionsOpen] = useState(false);
  const [isReportsOpen, setIsReportsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [reportType, setReportType] = useState("member");
  const [reportMonth, setReportMonth] = useState(new Date().getMonth() + 1);
  const [reportYear, setReportYear] = useState(new Date().getFullYear());
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const { toast } = useToast();

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  useEffect(() => {
    fetchMembers();
    fetchAllTransactions();
    fetchMemberStats();
  }, []);

  const fetchMembers = async () => {
    try {
      const response = await adminApi.getUsers();
      setMembers(response.data.data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load members",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAllTransactions = async () => {
    try {
      const response = await adminApi.getTransactions({ limit: 1000 });
      setAllTransactions(response.data.data || response.data || []);
    } catch (error) {
      console.error("Failed to load transactions:", error);
    }
  };

  const fetchMemberStats = async () => {
    try {
      const response = await adminApi.getUserStats();
      setMemberStats(response.data.data);
    } catch (error) {
      console.error("Failed to load member stats:", error);
    }
  };

  const fetchMemberTransactions = async (memberId: string) => {
    setTransactionsLoading(true);
    try {
      const response = await adminApi.getMemberTransactions(memberId);
      setMemberTransactions(response.data.data || []);
      console.log('Fetched transactions:', response.data.data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load member transactions",
        variant: "destructive",
      });
      setMemberTransactions([]);
    } finally {
      setTransactionsLoading(false);
    }
  };

  const handleToggleStatus = async (memberId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      await adminApi.updateUserStatus(memberId, { status: newStatus });
      toast({
        title: "Success",
        description: `Member ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`,
      });
      fetchMembers();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update member status",
        variant: "destructive",
      });
    }
  };

  const handleViewTransactions = async (member: Member) => {
    setSelectedMember(member);
    await fetchMemberTransactions(member._id);
    setIsTransactionsOpen(true);
  };

  const generateMemberReport = async (member: Member) => {
    try {
      // First fetch the member's transactions to ensure we have data
      await fetchMemberTransactions(member._id);
      
      const response = await adminApi.generateMemberReport(member._id);
      
      // Generate TXT report from the JSON data with the fetched transactions
      generateTXTMemberReport(member, response.data.data);
    } catch (error) {
      console.error("Failed to generate member report:", error);
      // Fallback: Generate report locally with fetched transactions
      generateLocalMemberReport(member);
    }
  };

  const generateTXTMemberReport = (member: Member, reportData: any) => {
    const reportContent = `Member Report - ${member.firstName} ${member.lastName}
Generated on: ${new Date().toLocaleString()}

Member Information
==================
Member ID: ${member.memberId}
Full Name: ${member.firstName} ${member.lastName}
Email: ${member.email}
Phone: ${member.phoneNumber}
Status: ${member.status}
Join Date: ${new Date(member.createdAt).toLocaleDateString()}

Financial Summary
=================
Current Savings: UGX${member.savingsBalance.toLocaleString()}
Loan Balance: UGX${(member.loanBalance || 0).toLocaleString()}

Recent Transactions
===================
Date                    Type        Amount              Status      Description
${memberTransactions.slice(0, 10).map(t => 
  `${new Date(t.createdAt).toLocaleDateString().padEnd(20)} ${t.type.toUpperCase().padEnd(12)} UGX${t.amount.toLocaleString().padEnd(18)} ${t.status.padEnd(12)} ${t.description || '-'}`
).join('\n')}

---
This report was generated automatically by the YO SACCO Management System
For any queries, please contact the administration team.`;

    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `member-report-${member.memberId}-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    toast({
      title: "Success",
      description: "Member report downloaded successfully",
    });
  };

  const generateLocalMemberReport = (member: Member) => {
    const reportContent = `
MEMBER REPORT
=============

Member Information:
- Member ID: ${member.memberId}
- Name: ${member.firstName} ${member.lastName}
- Email: ${member.email}
- Phone: ${member.phoneNumber}
- Status: ${member.status}
- Join Date: ${new Date(member.createdAt).toLocaleDateString()}

Financial Summary:
- Savings Balance: UGX${member.savingsBalance.toLocaleString()}
- Loan Balance: UGX${(member.loanBalance || 0).toLocaleString()}

Recent Transactions:
${memberTransactions.slice(0, 10).map(t => 
  `- ${new Date(t.createdAt).toLocaleDateString()}: ${t.type.toUpperCase()} - UGX${t.amount.toLocaleString()} (${t.status})`
).join('\n')}

Generated on: ${new Date().toLocaleString()}
    `;

    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `member-report-${member.memberId}-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    toast({
      title: "Success",
      description: "Member report downloaded successfully",
    });
  };

  const generateCSVMemberReport = async (member: Member) => {
    try {
      // First fetch the member's transactions to ensure we have data
      await fetchMemberTransactions(member._id);
      
      const csvContent = `Member Report - ${member.firstName} ${member.lastName}
Generated on: ${new Date().toLocaleString()}

Member Information
Member ID,${member.memberId}
Full Name,${member.firstName} ${member.lastName}
Email,${member.email}
Phone,${member.phoneNumber}
Status,${member.status}
Join Date,${new Date(member.createdAt).toLocaleDateString()}

Financial Summary
Current Savings,UGX${member.savingsBalance.toLocaleString()}
Loan Balance,UGX${(member.loanBalance || 0).toLocaleString()}

Recent Transactions
Date,Type,Amount,Status,Description
${memberTransactions.slice(0, 10).map(t => 
  `${new Date(t.createdAt).toLocaleDateString()},${t.type.toUpperCase()},UGX${t.amount.toLocaleString()},${t.status},${t.description}`
).join('\n')}`;

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `member-report-${member.memberId}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "CSV report downloaded successfully",
      });
    } catch (error) {
      console.error("Failed to generate CSV report:", error);
      toast({
        title: "Error",
        description: "Failed to generate CSV report",
        variant: "destructive",
      });
    }
  };

  const generateMonthlyReport = async () => {
    try {
      const response = await adminApi.generateMonthlyReport(reportYear, reportMonth);
      
      // Generate TXT report from the JSON data
      generateTXTMonthlyReport(response.data.data);
    } catch (error) {
      console.error("Failed to generate monthly report:", error);
      // Fallback: Generate report locally
      generateLocalMonthlyReport();
    }
  };

  const generateTXTMonthlyReport = (reportData: any) => {
    const startDate = new Date(reportYear, reportMonth - 1, 1);
    const endDate = new Date(reportYear, reportMonth, 0);
    
    const reportContent = `
YO SACCO - MONTHLY TRANSACTION REPORT
=====================================

Period: ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}
Generated on: ${new Date().toLocaleString()}

TRANSACTION SUMMARY
==================
Total Transactions: ${reportData?.summary?.transactions?.total || 0}
Total Deposits: UGX${(reportData?.summary?.transactions?.totalDepositAmount || 0).toLocaleString()}
Total Withdrawals: UGX${(reportData?.summary?.transactions?.totalWithdrawalAmount || 0).toLocaleString()}
Net Flow: UGX${((reportData?.summary?.transactions?.totalDepositAmount || 0) - (reportData?.summary?.transactions?.totalWithdrawalAmount || 0)).toLocaleString()}

DETAILED STATISTICS
===================
Transaction Breakdown:
- Deposits: ${reportData?.summary?.transactions?.deposits || 0} transactions
- Withdrawals: ${reportData?.summary?.transactions?.withdrawals || 0} transactions
- Average Deposit: UGX${reportData?.summary?.transactions?.deposits > 0 ? Math.round((reportData?.summary?.transactions?.totalDepositAmount || 0) / reportData?.summary?.transactions?.deposits).toLocaleString() : '0'}
- Average Withdrawal: UGX${reportData?.summary?.transactions?.withdrawals > 0 ? Math.round((reportData?.summary?.transactions?.totalWithdrawalAmount || 0) / reportData?.summary?.transactions?.withdrawals).toLocaleString() : '0'}

Loan Activity:
- Total Loans: ${reportData?.summary?.loans?.total || 0}
- Approved Loans: ${reportData?.summary?.loans?.approved || 0}
- Active Loans: ${reportData?.summary?.loans?.active || 0}
- Total Loan Amount: UGX${(reportData?.summary?.loans?.totalAmount || 0).toLocaleString()}

RECENT TRANSACTIONS (Last 20)
============================
${(reportData?.transactions || []).slice(0, 20).map((t: any, index: number) => 
  `${index + 1}. ${new Date(t.createdAt).toLocaleDateString()}
   Member: ${t.user?.firstName} ${t.user?.lastName} (${t.user?.memberId})
   Type: ${t.type.toUpperCase()}
   Amount: UGX${t.amount.toLocaleString()}
   Status: ${t.status}
   `
).join('\n')}

REPORT SUMMARY
==============
- Reporting period: ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}
- Total financial activity: ${reportData?.summary?.transactions?.total || 0} transactions
- Net financial flow: UGX${((reportData?.summary?.transactions?.totalDepositAmount || 0) - (reportData?.summary?.transactions?.totalWithdrawalAmount || 0)).toLocaleString()}
- Loan portfolio activity: ${reportData?.summary?.loans?.total || 0} loans processed

---
This report was generated automatically by the YO SACCO Management System
For any queries, please contact the administration team.
    `;

    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `monthly-report-${reportYear}-${reportMonth.toString().padStart(2, '0')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    toast({
      title: "Success",
      description: "Monthly report downloaded successfully",
    });
  };

  const generateLocalMonthlyReport = () => {
    const startDate = new Date(reportYear, reportMonth - 1, 1);
    const endDate = new Date(reportYear, reportMonth, 0);
    
    const monthlyTransactions = allTransactions.filter(t => {
      const transactionDate = new Date(t.createdAt);
      return transactionDate >= startDate && transactionDate <= endDate;
    });

    const totalDeposits = monthlyTransactions
      .filter(t => t.type === 'deposit')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalWithdrawals = monthlyTransactions
      .filter(t => t.type === 'withdrawal')
      .reduce((sum, t) => sum + t.amount, 0);

    const reportContent = `
MONTHLY TRANSACTION REPORT
==========================

Period: ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}

Summary:
- Total Transactions: ${monthlyTransactions.length}
- Total Deposits: UGX${totalDeposits.toLocaleString()}
- Total Withdrawals: UGX${totalWithdrawals.toLocaleString()}
- Net Flow: UGX${(totalDeposits - totalWithdrawals).toLocaleString()}

Transaction Details:
${monthlyTransactions.map(t => 
  `- ${new Date(t.createdAt).toLocaleDateString()}: ${t.user?.firstName} ${t.user?.lastName} - ${t.type.toUpperCase()} - UGX${t.amount.toLocaleString()}`
).join('\n')}

Generated on: ${new Date().toLocaleString()}
    `;

    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `monthly-report-${reportYear}-${reportMonth.toString().padStart(2, '0')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    toast({
      title: "Success",
      description: "Monthly report downloaded successfully",
    });
  };

  const generateCSVMonthlyReport = () => {
    const startDate = new Date(reportYear, reportMonth - 1, 1);
    const endDate = new Date(reportYear, reportMonth, 0);
    
    const monthlyTransactions = allTransactions.filter(t => {
      const transactionDate = new Date(t.createdAt);
      return transactionDate >= startDate && transactionDate <= endDate;
    });

    const totalDeposits = monthlyTransactions
      .filter(t => t.type === 'deposit')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalWithdrawals = monthlyTransactions
      .filter(t => t.type === 'withdrawal')
      .reduce((sum, t) => sum + t.amount, 0);

    const csvContent = `Monthly Transaction Report
Period: ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}
Generated on: ${new Date().toLocaleString()}

Summary
Total Transactions,${monthlyTransactions.length}
Total Deposits,UGX${totalDeposits.toLocaleString()}
Total Withdrawals,UGX${totalWithdrawals.toLocaleString()}
Net Flow,UGX${(totalDeposits - totalWithdrawals).toLocaleString()}

Transaction Details
Date,Member Name,Member ID,Type,Amount,Status
${monthlyTransactions.map(t => 
  `${new Date(t.createdAt).toLocaleDateString()},${t.user?.firstName} ${t.user?.lastName},${t.user?.memberId},${t.type.toUpperCase()},UGX${t.amount.toLocaleString()},${t.status}`
).join('\n')}`;

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `monthly-report-${reportYear}-${reportMonth.toString().padStart(2, '0')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    toast({
      title: "Success",
      description: "CSV report downloaded successfully",
    });
  };

  const filteredMembers = members.filter(member => {
    const matchesSearch = searchTerm === "" || 
      member.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.memberId.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || member.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Prepare chart data
  const memberStatusData = [
    { name: 'Active', value: members.filter(m => m.status === 'active').length },
    { name: 'Inactive', value: members.filter(m => m.status === 'inactive').length },
    { name: 'Suspended', value: members.filter(m => m.status === 'suspended').length },
  ];

  const savingsDistribution = members.map(m => ({
    name: `${m.firstName} ${m.lastName}`,
    savings: m.savingsBalance,
    memberId: m.memberId
  })).sort((a, b) => b.savings - a.savings).slice(0, 10);

  const monthlyTransactionData = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    const monthTransactions = allTransactions.filter(t => {
      const transactionDate = new Date(t.createdAt);
      return transactionDate.getMonth() + 1 === month && transactionDate.getFullYear() === new Date().getFullYear();
    });
    
    return {
      month: new Date(0, i).toLocaleString('default', { month: 'short' }),
      deposits: monthTransactions.filter(t => t.type === 'deposit').reduce((sum, t) => sum + t.amount, 0),
      withdrawals: monthTransactions.filter(t => t.type === 'withdrawal').reduce((sum, t) => sum + t.amount, 0),
    };
  });

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
            <h1 className="text-3xl font-bold">Member Management</h1>
            <p className="text-muted-foreground">
              Manage all sacco members and their accounts
            </p>
          </div>
          <Dialog open={isReportsOpen} onOpenChange={setIsReportsOpen}>
            <DialogTrigger asChild>
              <Button>
                <Download className="h-4 w-4 mr-2" />
                Generate Reports
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Generate Reports</DialogTitle>
                <DialogDescription>
                  Generate and download member or monthly transaction reports
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Report Type</label>
                  <Select value={reportType} onValueChange={setReportType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly Transactions</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {reportType === "monthly" && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Month</label>
                        <Select value={reportMonth.toString()} onValueChange={(value) => setReportMonth(parseInt(value))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 12 }, (_, i) => (
                              <SelectItem key={i + 1} value={(i + 1).toString()}>
                                {new Date(0, i).toLocaleString('default', { month: 'long' })}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Year</label>
                        <Select value={reportYear.toString()} onValueChange={(value) => setReportYear(parseInt(value))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 5 }, (_, i) => {
                              const year = new Date().getFullYear() - i;
                              return (
                                <SelectItem key={year} value={year.toString()}>
                                  {year}
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Button onClick={generateMonthlyReport} className="w-full">
                      <Download className="h-4 w-4 mr-2" />
                      Generate TXT Report
                    </Button>
                    <Button onClick={generateCSVMonthlyReport} variant="outline" className="w-full">
                      <Download className="h-4 w-4 mr-2" />
                      Download CSV Report
                    </Button>
                  </>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Statistics Cards */}
        {memberStats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Members</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{memberStats.total}</div>
                <p className="text-xs text-muted-foreground">
                  {memberStats.active} active members
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Savings</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">UGX{memberStats.totalSavings.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  Across all members
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Members</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{memberStats.active}</div>
                <p className="text-xs text-muted-foreground">
                  {((memberStats.active / memberStats.total) * 100).toFixed(1)}% of total
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Members with Loans</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{memberStats.withLoans || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Active borrowers
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Member Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={memberStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {memberStatusData.map((entry, index) => (
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
              <CardTitle>Monthly Transaction Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyTransactionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`UGX${value.toLocaleString()}`, '']} />
                  <Legend />
                  <Line type="monotone" dataKey="deposits" stroke="#8884d8" name="Deposits" />
                  <Line type="monotone" dataKey="withdrawals" stroke="#82ca9d" name="Withdrawals" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Top Savers</CardTitle>
            <CardDescription>Members with highest savings balances</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={savingsDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="memberId" />
                <YAxis />
                <Tooltip formatter={(value) => [`UGX${value.toLocaleString()}`, 'Savings']} />
                <Bar dataKey="savings" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Search and Filter */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">Search Members</label>
                <Input
                  placeholder="Search by name, email, or member ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="w-48">
                <label className="text-sm font-medium mb-2 block">Filter by Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                }}
              >
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>All Members</CardTitle>
            <CardDescription>
              View and manage member accounts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Total Savings</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Join Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMembers.map((member) => (
                  <TableRow key={member._id}>
                    <TableCell className="font-medium">{member.memberId}</TableCell>
                    <TableCell>{member.firstName} {member.lastName}</TableCell>
                    <TableCell>{member.email}</TableCell>
                    <TableCell>{member.phoneNumber}</TableCell>
                    <TableCell>UGX{member.savingsBalance.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant={member.status === "active" ? "default" : "secondary"}>
                        {member.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(member.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleStatus(member._id, member.status)}
                        >
                          {member.status === "active" ? "Deactivate" : "Activate"}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewTransactions(member)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Transactions
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                              <FileText className="h-4 w-4 mr-1" />
                              Report
                              <ChevronDown className="h-4 w-4 ml-1" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => generateMemberReport(member)}>
                              <FileText className="h-4 w-4 mr-2" />
                              Generate TXT Report
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => generateCSVMemberReport(member)}>
                              <Download className="h-4 w-4 mr-2" />
                              Download CSV Report
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Member Transactions Dialog */}
        <Dialog open={isTransactionsOpen} onOpenChange={setIsTransactionsOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Recent Transactions - {selectedMember?.firstName} {selectedMember?.lastName}
              </DialogTitle>
              <DialogDescription>
                View all recent transactions for this member
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {transactionsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <span className="ml-2">Loading transactions...</span>
                </div>
              ) : memberTransactions.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No transactions found for this member</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Description</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {memberTransactions.map((transaction) => (
                      <TableRow key={transaction._id}>
                        <TableCell>
                          {new Date(transaction.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{transaction.type}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          UGX{transaction.amount.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              transaction.status === 'completed' ? 'default' :
                              transaction.status === 'pending' ? 'secondary' : 'destructive'
                            }
                          >
                            {transaction.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{transaction.paymentMethod || '-'}</TableCell>
                        <TableCell>{transaction.description || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default AdminMembers;

