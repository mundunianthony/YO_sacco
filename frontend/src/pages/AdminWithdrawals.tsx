import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { adminApi } from "@/lib/api";
import { Check, X, Clock } from "lucide-react";

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

const AdminWithdrawals = () => {
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<WithdrawalRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
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