import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { fetchLoanRequests, approveLoan, rejectLoan } from '../../features/loans/loansSlice';
import Card from '../../components/Shared/Card';
import Button from '../../components/Shared/Button';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { LOAN_STATUS, LOAN_TYPES } from '../../utils/constants';

const LoanRequestsPage = () => {
  const dispatch = useAppDispatch();
  const { allLoans: loans, loading, totalCount } = useAppSelector((state) => state.loans);
  const [statusFilter, setStatusFilter] = useState(LOAN_STATUS.PENDING);
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const limit = 10;

  useEffect(() => {
    dispatch(fetchLoanRequests({
      filters: {
        status: statusFilter,
        type: typeFilter,
      },
      page,
      limit,
    }));
  }, [dispatch, statusFilter, typeFilter, page]);

  const handleApproveLoan = async (loanId: string) => {
    // In a real implementation, you'd open a modal to collect these details
    const approvalData = {
      loanId,
      approvedAmount: 1000, // This would come from the modal
      interestRate: 10, // This would come from the modal
      scheduleStart: new Date().toISOString(), // This would come from the modal
    };
    await dispatch(approveLoan(approvalData));
  };

  const handleRejectLoan = async (loanId: string) => {
    // In a real implementation, you'd open a modal to collect the reason
    const rejectionData = {
      loanId,
      reason: 'Insufficient credit score', // This would come from the modal
    };
    await dispatch(rejectLoan(rejectionData));
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-heading font-bold text-gray-900 mb-8">
        Loan Requests
      </h1>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <select
          className="px-4 py-2 border border-gray-300 rounded-md"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value={LOAN_STATUS.PENDING}>Pending</option>
          <option value={LOAN_STATUS.APPROVED}>Approved</option>
          <option value={LOAN_STATUS.REJECTED}>Rejected</option>
          <option value={LOAN_STATUS.PAID}>Paid</option>
        </select>

        <select
          className="px-4 py-2 border border-gray-300 rounded-md"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="">All Loan Types</option>
          {LOAN_TYPES.map((type) => (
            <option key={type.id} value={type.id}>
              {type.label}
            </option>
          ))}
        </select>
      </div>

      {/* Loans Table */}
      <Card isLoading={loading}>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Member Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tenure (Months)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Application Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loans.map((loan) => (
                <tr key={loan.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {loan.memberName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(loan.amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {LOAN_TYPES.find(t => t.id === loan.type)?.label || loan.type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {loan.tenure}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(loan.applicationDate)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                      ${loan.status === LOAN_STATUS.APPROVED ? 'bg-green-100 text-green-800' :
                        loan.status === LOAN_STATUS.REJECTED ? 'bg-red-100 text-red-800' :
                          loan.status === LOAN_STATUS.PENDING ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'}`}>
                      {loan.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    {loan.status === LOAN_STATUS.PENDING && (
                      <>
                        <Button
                          variant="success"
                          size="sm"
                          onClick={() => handleApproveLoan(loan.id)}
                        >
                          Approve
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleRejectLoan(loan.id)}
                        >
                          Reject
                        </Button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Pagination */}
      <div className="mt-4 flex justify-between items-center">
        <p className="text-sm text-gray-700">
          Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, totalCount)} of {totalCount} loans
        </p>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => p + 1)}
            disabled={page * limit >= totalCount}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LoanRequestsPage;