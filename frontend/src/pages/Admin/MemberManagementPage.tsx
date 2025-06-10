import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { fetchAllMembers, updateMemberStatus, resetMemberPassword } from '../../features/admin/adminSlice';
import Card from '../../components/Shared/Card';
import Button from '../../components/Shared/Button';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { MEMBER_STATUS } from '../../utils/constants';

const MemberManagementPage = () => {
  const dispatch = useAppDispatch();
  const { members, loading, totalMembers } = useAppSelector((state) => state.admin);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const limit = 10;

  useEffect(() => {
    dispatch(fetchAllMembers({ search: searchTerm, status: statusFilter, page, limit }));
  }, [dispatch, searchTerm, statusFilter, page]);

  const handleStatusChange = async (memberId: string, newStatus: string) => {
    await dispatch(updateMemberStatus({ memberId, status: newStatus }));
  };

  const handleResetPassword = async (memberId: string) => {
    await dispatch(resetMemberPassword(memberId));
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-heading font-bold text-gray-900 mb-8">
        Member Management
      </h1>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <input
          type="text"
          placeholder="Search members..."
          className="px-4 py-2 border border-gray-300 rounded-md"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <select
          className="px-4 py-2 border border-gray-300 rounded-md"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value={MEMBER_STATUS.ACTIVE}>Active</option>
          <option value={MEMBER_STATUS.SUSPENDED}>Suspended</option>
          <option value={MEMBER_STATUS.DORMANT}>Dormant</option>
        </select>
      </div>

      {/* Members Table */}
      <Card isLoading={loading}>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Member ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Balance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date Joined
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {members.map((member) => (
                <tr key={member.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {member.membershipNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {member.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {member.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                      ${member.status === MEMBER_STATUS.ACTIVE ? 'bg-green-100 text-green-800' :
                        member.status === MEMBER_STATUS.SUSPENDED ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'}`}>
                      {member.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatCurrency(member.balance)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(member.dateJoined)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <Button
                      variant={member.status === MEMBER_STATUS.ACTIVE ? 'danger' : 'success'}
                      size="sm"
                      onClick={() => handleStatusChange(
                        member.id,
                        member.status === MEMBER_STATUS.ACTIVE ? MEMBER_STATUS.SUSPENDED : MEMBER_STATUS.ACTIVE
                      )}
                    >
                      {member.status === MEMBER_STATUS.ACTIVE ? 'Suspend' : 'Activate'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleResetPassword(member.id)}
                    >
                      Reset Password
                    </Button>
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
          Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, totalMembers)} of {totalMembers} members
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
            disabled={page * limit >= totalMembers}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MemberManagementPage;