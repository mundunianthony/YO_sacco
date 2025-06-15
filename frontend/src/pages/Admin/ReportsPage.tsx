import { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import Card from '../../components/Shared/Card';
import Button from '../../components/Shared/Button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

const ReportsPage = () => {
  const dispatch = useAppDispatch();
  const { analytics, loading } = useAppSelector((state) => state.admin);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [activeTab, setActiveTab] = useState('savings');

  const handleGenerateReport = () => {
    // This would typically dispatch an action to generate the report
    console.log('Generating report for:', { startDate, endDate, type: activeTab });
  };

  const tabs = [
    { id: 'savings', label: 'Savings Report' },
    { id: 'loans', label: 'Loan Performance' },
    { id: 'members', label: 'Member Growth' },
    { id: 'delinquency', label: 'Delinquency Report' },
  ];

  return (
    <div className="p-6">
      <h1 className="text-3xl font-heading font-bold text-gray-900 mb-8">
        Reports
      </h1>

      {/* Report Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <input
          type="date"
          className="px-4 py-2 border border-gray-300 rounded-md"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />

        <input
          type="date"
          className="px-4 py-2 border border-gray-300 rounded-md"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
        />

        <Button
          variant="primary"
          onClick={handleGenerateReport}
          disabled={!startDate || !endDate}
        >
          Generate Report
        </Button>
      </div>

      {/* Report Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                  ${activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                `}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Report Content */}
      <div className="space-y-6">
        {activeTab === 'savings' && (
          <>
            <Card
              title="Monthly Savings Overview"
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

            <Card
              title="Top Savers"
              isLoading={loading}
            >
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Member Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Savings
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Last Deposit
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {/* This would be populated with actual data */}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        )}

        {activeTab === 'loans' && (
          <Card
            title="Loan Performance"
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
                  <Line type="monotone" dataKey="count" stroke="#8884d8" name="Active Loans" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        )}

        {activeTab === 'members' && (
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
        )}

        {activeTab === 'delinquency' && (
          <Card
            title="Delinquent Loans"
            isLoading={loading}
          >
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Member Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Loan Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Days Overdue
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Payment
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {/* This would be populated with actual data */}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ReportsPage;