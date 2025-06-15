import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, DollarSign, CreditCard, TrendingUp } from "lucide-react";
import { adminApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface DashboardData {
  users: {
    total: number;
    active: number;
  };
  loans: {
    total: number;
    pending: number;
    active: number;
    totalAmount: number;
  };
  savings: {
    total: number;
    monthlyGrowth: number;
  };
  recentLoans: Array<{
    _id: string;
    user: {
      firstName: string;
      lastName: string;
    };
    amount: number;
    purpose: string;
    status: string;
    createdAt: string;
  }>;
  recentTransactions: Array<{
    _id: string;
    user: {
      firstName: string;
      lastName: string;
    };
    type: string;
    amount: number;
    createdAt: string;
  }>;
}

const AdminDashboard = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await adminApi.getDashboard();
      console.log('Dashboard Response:', response.data);
      if (response.data.success && response.data.data) {
        setDashboardData(response.data.data);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Dashboard Error:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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

  if (!dashboardData) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <p className="text-muted-foreground">No data available</p>
        </div>
      </Layout>
    );
  }

  const stats = [
    {
      title: "Total Members",
      value: dashboardData.users?.total?.toLocaleString() ?? '0',
      description: `${dashboardData.users?.active ?? 0} active members`,
      icon: Users,
      color: "text-blue-600",
    },
    {
      title: "Total Savings",
      value: `$${dashboardData.savings?.total?.toLocaleString() ?? '0'}`,
      description: `${(dashboardData.savings?.monthlyGrowth ?? 0) > 0 ? '+' : ''}${dashboardData.savings?.monthlyGrowth ?? 0}% from last month`,
      icon: DollarSign,
      color: "text-green-600",
    },
    {
      title: "Active Loans",
      value: dashboardData.loans?.active?.toLocaleString() ?? '0',
      description: `Total: $${dashboardData.loans?.totalAmount?.toLocaleString() ?? '0'}`,
      icon: CreditCard,
      color: "text-orange-600",
    },
    {
      title: "Growth Rate",
      value: `${(dashboardData.savings?.monthlyGrowth ?? 0) > 0 ? '+' : ''}${dashboardData.savings?.monthlyGrowth ?? 0}%`,
      description: "Monthly growth",
      icon: TrendingUp,
      color: "text-purple-600",
    },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome to your administrative panel
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
              <CardTitle>Recent Loan Applications</CardTitle>
              <CardDescription>
                Pending applications requiring approval
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboardData.recentLoans?.map((loan) => (
                  <div key={loan._id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <p className="font-medium">
                        {loan.user.firstName} {loan.user.lastName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {loan.purpose} - {new Date(loan.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">${loan.amount.toLocaleString()}</p>
                      <p className="text-sm text-orange-600">{loan.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Member Activity</CardTitle>
              <CardDescription>
                Recent member transactions and activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboardData.recentTransactions?.map((transaction) => (
                  <div key={transaction._id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <p className="font-medium">
                        {transaction.user.firstName} {transaction.user.lastName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {transaction.type} - {new Date(transaction.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">${transaction.amount.toLocaleString()}</p>
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

export default AdminDashboard;
