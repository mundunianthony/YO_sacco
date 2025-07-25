import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DollarSign, CreditCard, PiggyBank, TrendingUp, Calendar, BarChart3 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { memberApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

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

interface InterestProjection {
  currentBalance: number;
  interestRate: number;
  projections: {
    monthly: number;
    quarterly: number;
    yearly: number;
  };
}

interface InterestSummary {
  totalInterest: number;
  transactionCount: number;
  averageBalance: number;
  transactions: Array<{
    _id: string;
    amount: number;
    createdAt: string;
    description: string;
  }>;
}

const MemberDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [interestProjection, setInterestProjection] = useState<InterestProjection | null>(null);
  const [interestSummary, setInterestSummary] = useState<InterestSummary | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [dashboardResponse, projectionResponse, summaryResponse] = await Promise.all([
          memberApi.getDashboard(),
          memberApi.getInterestProjection(),
          memberApi.getInterestSummary()
        ]);
        
        setDashboardData(dashboardResponse.data.data);
        setInterestProjection(projectionResponse.data.data);
        setInterestSummary(summaryResponse.data.data);
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

  useEffect(() => {
    document.title = "YO sacco - member";
  }, []);

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

        {/* Interest Section */}
        {interestProjection && (
          <Card className="border-purple-200 bg-purple-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-800">
                <TrendingUp className="h-5 w-5" />
                Interest Earnings & Projections
              </CardTitle>
              <CardDescription className="text-purple-600">
                Your savings are earning {interestProjection.interestRate}% annual interest
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Current Interest Summary */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-purple-800">Interest Summary</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-purple-600">Total Earned (This Year):</span>
                      <span className="font-medium">UGX{interestSummary?.totalInterest.toLocaleString() ?? '0'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-purple-600">Average Balance:</span>
                      <span className="font-medium">UGX{interestSummary?.averageBalance.toLocaleString() ?? '0'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-purple-600">Interest Transactions:</span>
                      <span className="font-medium">{interestSummary?.transactionCount ?? 0}</span>
                    </div>
                  </div>
                </div>

                {/* Interest Projections */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-purple-800">Future Projections</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-purple-600">Next Month:</span>
                      <span className="font-medium">UGX{interestProjection.projections.monthly.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-purple-600">Next Quarter:</span>
                      <span className="font-medium">UGX{interestProjection.projections.quarterly.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-purple-600">Next Year:</span>
                      <span className="font-medium">UGX{interestProjection.projections.yearly.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Interest Rate Info */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-purple-800">Interest Rate</h3>
                  <div className="space-y-2">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-purple-800">{interestProjection.interestRate}%</div>
                      <div className="text-sm text-purple-600">Annual Rate</div>
                    </div>
                    <div className="text-xs text-purple-600 text-center">
                      Interest is calculated daily and applied monthly
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Interest Transactions */}
              {interestSummary?.transactions && interestSummary.transactions.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-semibold text-purple-800 mb-3">Recent Interest Payments</h3>
                  <div className="space-y-2">
                    {interestSummary.transactions.slice(0, 3).map((transaction) => (
                      <div key={transaction._id} className="flex items-center justify-between p-2 bg-white rounded-md">
                        <div>
                          <p className="text-sm font-medium">{transaction.description}</p>
                          <p className="text-xs text-purple-600">
                            {new Date(transaction.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          +UGX{transaction.amount.toLocaleString()}
                        </Badge>
                      </div>
                    ))}
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-3 text-purple-600 border-purple-300"
                    onClick={() => navigate('/member/interest')}
                  >
                    View All Interest History
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

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
