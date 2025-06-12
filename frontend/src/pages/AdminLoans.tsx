
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const AdminLoans = () => {
  // Mock data for loan applications
  const pendingLoans = [
    {
      id: 1,
      memberName: "John Doe",
      loanType: "Personal",
      amountRequested: 5000,
      repaymentPeriod: 6,
      dateApplied: "2024-06-10",
      status: "pending"
    },
    {
      id: 2,
      memberName: "Jane Smith",
      loanType: "Business",
      amountRequested: 10000,
      repaymentPeriod: 12,
      dateApplied: "2024-06-11",
      status: "pending"
    },
  ];

  const activeLoans = [
    {
      id: 3,
      memberName: "Bob Johnson",
      loanType: "Emergency",
      amount: 3000,
      remainingBalance: 1500,
      nextPaymentDate: "2024-07-15",
      status: "active"
    },
  ];

  const handleApproveLoan = (loanId: number) => {
    console.log(`Approve loan ${loanId}`);
    // Logic to approve loan
  };

  const handleRejectLoan = (loanId: number) => {
    console.log(`Reject loan ${loanId}`);
    // Logic to reject loan
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Loan Management</h1>
          <p className="text-muted-foreground">
            Manage loan applications and active loans
          </p>
        </div>

        <Tabs defaultValue="pending" className="w-full">
          <TabsList>
            <TabsTrigger value="pending">Pending Applications</TabsTrigger>
            <TabsTrigger value="active">Active Loans</TabsTrigger>
          </TabsList>
          
          <TabsContent value="pending">
            <Card>
              <CardHeader>
                <CardTitle>Pending Loan Applications</CardTitle>
                <CardDescription>
                  Review and approve or reject loan applications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Member Name</TableHead>
                      <TableHead>Loan Type</TableHead>
                      <TableHead>Amount Requested</TableHead>
                      <TableHead>Repayment Period</TableHead>
                      <TableHead>Date Applied</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingLoans.map((loan) => (
                      <TableRow key={loan.id}>
                        <TableCell className="font-medium">{loan.memberName}</TableCell>
                        <TableCell>{loan.loanType}</TableCell>
                        <TableCell>${loan.amountRequested.toLocaleString()}</TableCell>
                        <TableCell>{loan.repaymentPeriod} months</TableCell>
                        <TableCell>{loan.dateApplied}</TableCell>
                        <TableCell className="space-x-2">
                          <Button
                            size="sm"
                            onClick={() => handleApproveLoan(loan.id)}
                          >
                            Approve
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleRejectLoan(loan.id)}
                          >
                            Reject
                          </Button>
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
                      <TableHead>Member Name</TableHead>
                      <TableHead>Loan Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Remaining Balance</TableHead>
                      <TableHead>Next Payment Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeLoans.map((loan) => (
                      <TableRow key={loan.id}>
                        <TableCell className="font-medium">{loan.memberName}</TableCell>
                        <TableCell>{loan.loanType}</TableCell>
                        <TableCell>${loan.amount.toLocaleString()}</TableCell>
                        <TableCell>${loan.remainingBalance.toLocaleString()}</TableCell>
                        <TableCell>{loan.nextPaymentDate}</TableCell>
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
