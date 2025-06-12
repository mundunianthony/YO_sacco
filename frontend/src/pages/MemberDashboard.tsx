
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DollarSign, CreditCard, PiggyBank, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";

const MemberDashboard = () => {
  const navigate = useNavigate();

  const stats = [
    {
      title: "Total Savings",
      value: "$12,456",
      description: "+$500 this month",
      icon: PiggyBank,
      color: "text-green-600",
    },
    {
      title: "Active Loans",
      value: "2",
      description: "Total: $8,500",
      icon: CreditCard,
      color: "text-blue-600",
    },
    {
      title: "Interest Earned",
      value: "$234",
      description: "This year",
      icon: TrendingUp,
      color: "text-purple-600",
    },
    {
      title: "Next Payment",
      value: "$425",
      description: "Due June 20",
      icon: DollarSign,
      color: "text-orange-600",
    },
  ];

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
                {[
                  { type: "Deposit", amount: "+$500", date: "2024-06-12", balance: "$12,456" },
                  { type: "Loan Payment", amount: "-$425", date: "2024-06-05", balance: "$11,956" },
                  { type: "Deposit", amount: "+$300", date: "2024-05-28", balance: "$12,381" },
                ].map((transaction, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <p className="font-medium">{transaction.type}</p>
                      <p className="text-sm text-muted-foreground">{transaction.date}</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${transaction.amount.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                        {transaction.amount}
                      </p>
                      <p className="text-sm text-muted-foreground">Bal: {transaction.balance}</p>
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
