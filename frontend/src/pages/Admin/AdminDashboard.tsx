import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { fetchAdminAnalytics } from '../../features/admin/adminSlice';
import Card from '../../components/Shared/Card';
import { formatCurrency } from '../../utils/formatters';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

const AdminDashboard = () => {
  const dispatch = useAppDispatch();
  const { analytics, loading } = useAppSelector((state) => state.admin);

  useEffect(() => {
    dispatch(fetchAdminAnalytics());
  }, [dispatch]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  return (
    <div className="p-6">
      <h1 className="text-3xl font-heading font-bold text-gray-900 mb-8">
        Admin Dashboard
      </h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Card
          title="Total Members"
          isLoading={loading}
        >
          <p className="text-2xl font-bold text-primary-600">
            {analytics?.totalMembers || 0}
          </p>
        </Card>

        <Card
          title="Total Savings"
          isLoading={loading}
        >
          <p className="text-2xl font-bold text-success-600">
            {formatCurrency(analytics?.totalSavings || 0)}
          </p>
        </Card>

        <Card
          title="Active Loans"
          isLoading={loading}
        >
          <p className="text-2xl font-bold text-warning-600">
            {analytics?.activeLoans || 0}
          </p>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Monthly Deposits vs Withdrawals */}
        <Card
          title="Monthly Transactions"
          isLoading={loading}
        >
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={analytics?.monthlyData || []}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="deposits" fill="#0088FE" name="Deposits" />
                <Bar dataKey="withdrawals" fill="#00C49F" name="Withdrawals" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Loan Distribution */}
        <Card
          title="Loan Distribution"
          isLoading={loading}
        >
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analytics?.loanDistribution || []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {(analytics?.loanDistribution || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Member Growth */}
        <Card
          title="Member Growth"
          isLoading={loading}
        >
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={analytics?.memberGrowth || []}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="count" stroke="#8884d8" name="New Members" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;