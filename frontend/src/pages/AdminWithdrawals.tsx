import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { adminApi } from "@/lib/api";
import { Check, X, Clock, Eye, DollarSign, TrendingUp } from "lucide-react";

interface WithdrawalRequest {
  _id: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
    memberId: string;
  };
  amount: number;
  paymentMethod: string;
  status: string;
  createdAt: string;
  description: string;
}

interface MemberDetails {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  memberId: string;
  savingsBalance: number;
  phoneNumber: string;
  status: string;
  createdAt: string;
}

interface Transaction {
  _id: string;
  type: string;
  amount: number;
  status: string;
  paymentMethod: string;
  description: string;
  createdAt: string;
  balanceAfter: number;
}

const AdminWithdrawals = () => {
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<WithdrawalRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [memberDetails, setMemberDetails] = useState<MemberDetails | null>(null);
  const [memberTransactions, setMemberTransactions] = useState<Transaction[]>([]);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const { toast } = useToast();

  const fetchWithdrawals = async () => {
    try {
      const response = await adminApi.getPendingWithdrawals();
      console.log('Withdrawals response:', response);
      if (response.data && response.data.success) {
        setWithdrawals(response.data.data || []);
      } else {
        setWithdrawals([]);
        console.error('Invalid response format:', response);
      }
    } catch (error) {
      console.error('Error fetching withdrawals:', error);
      setWithdrawals([]);
      toast({
        title: "Error",
        description: "Failed to load withdrawal requests",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  const handleApprove = async (withdrawalId: string) => {
    setProcessingId(withdrawalId);
    try {
      await adminApi.approveWithdrawal(withdrawalId, { status: 'approved' });
      toast({
        title: "Success",
        description: "Withdrawal request approved successfully",
      });
      fetchWithdrawals(); // Refresh the list
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to approve withdrawal request",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async () => {
    if (!selectedWithdrawal || !rejectionReason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a rejection reason",
        variant: "destructive",
      });
      return;
    }

    setProcessingId(selectedWithdrawal._id);
    try {
      await adminApi.approveWithdrawal(selectedWithdrawal._id, { 
        status: 'rejected',
        rejectionReason: rejectionReason.trim()
      });
      toast({
        title: "Success",
        description: "Withdrawal request rejected successfully",
      });
      setIsRejectDialogOpen(false);
      setRejectionReason("");
      setSelectedWithdrawal(null);
      fetchWithdrawals(); // Refresh the list
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reject withdrawal request",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const openRejectDialog = (withdrawal: WithdrawalRequest) => {
    setSelectedWithdrawal(withdrawal);
    setIsRejectDialogOpen(true);
  };

  const openDetailsDialog = async (withdrawal: WithdrawalRequest) => {
    setSelectedWithdrawal(withdrawal);
    setIsDetailsDialogOpen(true);
    setDetailsLoading(true);
    
    try {
      // Fetch member details and transactions
      const [memberResponse, transactionsResponse] = await Promise.all([
        adminApi.getUserById(withdrawal.user._id || withdrawal.user.memberId),
        adminApi.getMemberTransactions(withdrawal.user._id || withdrawal.user.memberId)
      ]);

      if (memberResponse.data.success) {
        setMemberDetails(memberResponse.data.data);
      }

      if (transactionsResponse.data.success) {
        setMemberTransactions(transactionsResponse.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching member details:', error);
      toast({
        title: "Error",
        description: "Failed to load member details",
        variant: "destructive",
      });
    } finally {
      setDetailsLoading(false);
    }
  };

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case 'deposit':
        return 'bg-green-100 text-green-800';
      case 'withdrawal':
        return 'bg-red-100 text-red-800';
      case 'interest_earned':
        return 'bg-blue-100 text-blue-800';
      case 'loan_payment':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
          <h1 className="text-3xl font-bold">Withdrawal Requests</h1>
          <p className="text-muted-foreground">
            Review and process member withdrawal requests
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Pending Withdrawal Requests</CardTitle>
            <CardDescription>
              {withdrawals?.length || 0} request{(withdrawals?.length || 0) !== 1 ? 's' : ''} awaiting approval
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!withdrawals || withdrawals.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No pending withdrawal requests</p>
              </div>
            ) : (
              <div className="space-y-4">
                {withdrawals.map((withdrawal) => (
                  <div key={withdrawal._id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="font-medium">
                            {withdrawal.user.firstName} {withdrawal.user.lastName}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {withdrawal.user.email} • {withdrawal.user.memberId}
                          </p>
                        </div>
                        <Badge variant="secondary">
                          {withdrawal.paymentMethod}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Requested on {new Date(withdrawal.createdAt).toLocaleDateString()} at {new Date(withdrawal.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="font-semibold text-lg">
                          UGX{withdrawal.amount.toLocaleString()}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {withdrawal.status}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openDetailsDialog(withdrawal)}
                          disabled={processingId === withdrawal._id}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View Details
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleApprove(withdrawal._id)}
                          disabled={processingId === withdrawal._id}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => openRejectDialog(withdrawal)}
                          disabled={processingId === withdrawal._id}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Member Details Dialog */}
        <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Member Details - {selectedWithdrawal?.user.firstName} {selectedWithdrawal?.user.lastName}
              </DialogTitle>
              <DialogDescription>
                Review member balance and recent transactions to guide your decision
              </DialogDescription>
            </DialogHeader>
            
            {detailsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <span className="ml-2">Loading member details...</span>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Member Information */}
                {memberDetails && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5" />
                        Member Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Member ID</p>
                          <p className="font-medium">{memberDetails.memberId}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Full Name</p>
                          <p className="font-medium">{memberDetails.firstName} {memberDetails.lastName}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Email</p>
                          <p className="font-medium">{memberDetails.email}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Phone</p>
                          <p className="font-medium">{memberDetails.phoneNumber || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Status</p>
                          <Badge variant={memberDetails.status === 'active' ? 'default' : 'secondary'}>
                            {memberDetails.status}
                          </Badge>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Member Since</p>
                          <p className="font-medium">{new Date(memberDetails.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Current Balance */}
                {memberDetails && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Current Balance
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center">
                        <p className="text-3xl font-bold text-green-600">
                          UGX{memberDetails.savingsBalance.toLocaleString()}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Available for withdrawal
                        </p>
                        {selectedWithdrawal && (
                          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                            <p className="text-sm font-medium text-blue-800">
                              Withdrawal Request: UGX{selectedWithdrawal.amount.toLocaleString()}
                            </p>
                            <p className="text-xs text-blue-600 mt-1">
                              {memberDetails.savingsBalance >= selectedWithdrawal.amount 
                                ? '✓ Sufficient balance available' 
                                : '✗ Insufficient balance'}
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Recent Transactions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Transactions</CardTitle>
                    <CardDescription>
                      Last {memberTransactions.length} transactions to help guide your decision
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {memberTransactions.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">No transactions found for this member</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
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
                            {memberTransactions.slice(0, 10).map((transaction) => (
                              <TableRow key={transaction._id}>
                                <TableCell>
                                  {new Date(transaction.createdAt).toLocaleDateString()}
                                </TableCell>
                                <TableCell>
                                  <Badge className={getTransactionTypeColor(transaction.type)}>
                                    {transaction.type}
                                  </Badge>
                                </TableCell>
                                <TableCell className="font-medium">
                                  UGX{transaction.amount.toLocaleString()}
                                </TableCell>
                                <TableCell>
                                  <Badge className={getStatusColor(transaction.status)}>
                                    {transaction.status}
                                  </Badge>
                                </TableCell>
                                <TableCell>{transaction.paymentMethod || '-'}</TableCell>
                                <TableCell className="max-w-xs truncate">
                                  {transaction.description || '-'}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Action Buttons */}
                {selectedWithdrawal && (
                  <div className="flex gap-2 justify-end pt-4 border-t">
                    <Button
                      onClick={() => handleApprove(selectedWithdrawal._id)}
                      disabled={processingId === selectedWithdrawal._id}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Approve Withdrawal
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        setIsDetailsDialogOpen(false);
                        openRejectDialog(selectedWithdrawal);
                      }}
                      disabled={processingId === selectedWithdrawal._id}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Reject Withdrawal
                    </Button>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Rejection Dialog */}
        <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject Withdrawal Request</DialogTitle>
              <DialogDescription>
                Please provide a reason for rejecting this withdrawal request. The member will be notified of the rejection.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="rejection-reason">Rejection Reason</Label>
                <Textarea
                  id="rejection-reason"
                  placeholder="Enter the reason for rejection..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsRejectDialogOpen(false);
                    setRejectionReason("");
                    setSelectedWithdrawal(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleReject}
                  disabled={processingId === selectedWithdrawal?._id || !rejectionReason.trim()}
                >
                  Reject Request
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default AdminWithdrawals; 