import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { adminApi } from "@/lib/api";

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
  remainingBalance: number;
  nextPaymentDate: string;
  createdAt: string;
}

const AdminLoans = () => {
  const [pendingLoans, setPendingLoans] = useState<Loan[]>([]);
  const [activeLoans, setActiveLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchLoans();
  }, []);

  const fetchLoans = async () => {
    try {
      const response = await adminApi.getLoans();
      const loans = response.data.data;
      
      setPendingLoans(loans.filter((loan: Loan) => loan.status === 'pending'));
      setActiveLoans(loans.filter((loan: Loan) => loan.status === 'active'));
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

  const handleApproveLoan = async (loanId: string) => {
    try {
      await adminApi.updateLoanStatus(loanId, { status: 'approved' });
      toast({
        title: "Success",
        description: "Loan approved successfully",
      });
      fetchLoans();
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
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reject loan",
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
          <h1 className="text-3xl font-bold">Loan Management</h1>
          <p className="text-muted-foreground">
            Review and manage loan applications
          </p>
        </div>

        <Tabs defaultValue="pending" className="space-y-4">
          <TabsList>
            <TabsTrigger value="pending">Pending Applications</TabsTrigger>
            <TabsTrigger value="active">Active Loans</TabsTrigger>
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
                    {pendingLoans.map((loan) => (
                      <TableRow key={loan._id}>
                        <TableCell className="font-medium">
                          {loan.user.firstName} {loan.user.lastName}
                        </TableCell>
                        <TableCell>${loan.amount.toLocaleString()}</TableCell>
                        <TableCell>{loan.purpose}</TableCell>
                        <TableCell>{loan.term} months</TableCell>
                        <TableCell>
                          {new Date(loan.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{loan.status}</Badge>
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
                      <TableHead>Next Payment Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeLoans.map((loan) => (
                      <TableRow key={loan._id}>
                        <TableCell className="font-medium">
                          {loan.user.firstName} {loan.user.lastName}
                        </TableCell>
                        <TableCell>${loan.amount.toLocaleString()}</TableCell>
                        <TableCell>${loan.remainingBalance.toLocaleString()}</TableCell>
                        <TableCell>
                          {loan.nextPaymentDate
                            ? new Date(loan.nextPaymentDate).toLocaleDateString()
                            : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="default">{loan.status}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default AdminLoans;
