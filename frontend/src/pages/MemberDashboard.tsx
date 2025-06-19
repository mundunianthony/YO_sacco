import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DollarSign, CreditCard, PiggyBank, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { memberApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface DashboardData {
  savingsBalance: number;
  loanBalance: number;
  totalLoanAmount: number;
  interestEarned: number;
  nextPayment: number;
  nextPaymentDate: string;
  recentTransactions: Array<{
    _id: string;
    type: string;
    amount: number;
    createdAt: string;
    description: string;
  }>;
  activeLoans: number;
}

const MemberDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await memberApi.getDashboard();
        setDashboardData(response.data.data);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load dashboard data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [toast]);

  const stats = [
    {
      title: "Total Savings",
      value: `UGX${dashboardData?.savingsBalance.toLocaleString() ?? '0'}`,
      description: "Available balance",
      icon: PiggyBank,
      color: "text-green-600",
    },
    {
      title: "Active Loans",
      value: dashboardData?.activeLoans.toString() ?? '0',
      description: `Total: UGX${dashboardData?.totalLoanAmount.toLocaleString() ?? '0'}`,
      icon: CreditCard,
      color: "text-blue-600",
    },
    {
      title: "Interest Earned",
      value: `UGX${dashboardData?.interestEarned.toLocaleString() ?? '0'}`,
      description: "This year",
      icon: TrendingUp,
      color: "text-purple-600",
    },
    {
      title: "Next Payment",
      value: `UGX${dashboardData?.nextPayment.toLocaleString() ?? '0'}`,
      description: dashboardData?.nextPaymentDate 
        ? `Due ${new Date(dashboardData.nextPaymentDate).toLocaleDateString()}`
        : "No upcoming payments",
      icon: DollarSign,
      color: "text-orange-600",
    },
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
          <h1 className="text-3xl font-bold">Member Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your savings and loans
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Common actions you can perform
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                className="w-full justify-start" 
                variant="outline"
                onClick={() => navigate('/member/savings')}
              >
                <DollarSign className="h-4 w-4 mr-2" />
                Make a Deposit
              </Button>
              <Button 
                className="w-full justify-start" 
                variant="outline"
                onClick={() => navigate('/member/savings')}
              >
                <DollarSign className="h-4 w-4 mr-2" />
                Request Withdrawal
              </Button>
              <Button 
                className="w-full justify-start" 
                variant="outline"
                onClick={() => navigate('/member/loans')}
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Apply for Loan
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>
                Your latest savings and loan activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboardData?.recentTransactions.map((transaction) => (
                  <div key={transaction._id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <p className="font-medium">{transaction.type}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(transaction.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${
                        transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.amount > 0 ? '+' : ''}UGX{Math.abs(transaction.amount).toLocaleString()}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {transaction.description}
                      </p>
                    </div>
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

export default MemberDashboard;
