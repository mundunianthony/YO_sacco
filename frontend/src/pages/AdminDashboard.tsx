
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, DollarSign, CreditCard, TrendingUp } from "lucide-react";

const AdminDashboard = () => {
  const stats = [
    {
      title: "Total Members",
      value: "1,234",
      description: "+12% from last month",
      icon: Users,
      color: "text-blue-600",
    },
    {
      title: "Total Savings",
      value: "$2,456,789",
      description: "+8% from last month",
      icon: DollarSign,
      color: "text-green-600",
    },
    {
      title: "Active Loans",
      value: "156",
      description: "Total: $890,123",
      icon: CreditCard,
      color: "text-orange-600",
    },
    {
      title: "Growth Rate",
      value: "15.2%",
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
                {[
                  { name: "John Doe", amount: "$5,000", type: "Personal", date: "2024-06-12" },
                  { name: "Jane Smith", amount: "$10,000", type: "Business", date: "2024-06-11" },
                  { name: "Bob Johnson", amount: "$3,000", type: "Emergency", date: "2024-06-10" },
                ].map((loan, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <p className="font-medium">{loan.name}</p>
                      <p className="text-sm text-muted-foreground">{loan.type} - {loan.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{loan.amount}</p>
                      <p className="text-sm text-orange-600">Pending</p>
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
                {[
                  { name: "Alice Brown", action: "Deposit", amount: "$500", date: "2024-06-12" },
                  { name: "Charlie Wilson", action: "Withdrawal", amount: "$200", date: "2024-06-11" },
                  { name: "Diana Davis", action: "Loan Payment", amount: "$300", date: "2024-06-10" },
                ].map((activity, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <p className="font-medium">{activity.name}</p>
                      <p className="text-sm text-muted-foreground">{activity.action} - {activity.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{activity.amount}</p>
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
