import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../../api/axios';
import { toast } from 'react-toastify';
import { MEMBER_STATUS } from '../../utils/constants';

// Define types
interface Member {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  status: string;
  balance: number;
  membershipNumber: string;
  dateJoined: string;
}

interface AnalyticsSummary {
  totalMembers: number;
  totalSavings: number;
  activeLoans: number;
  pendingLoans: number;
  monthlyDeposits: number;
  monthlyWithdrawals: number;
  monthlyData: {
    month: string;
    deposits: number;
    withdrawals: number;
  }[];
  loanDistribution: {
    status: string;
    count: number;
  }[];
  memberGrowth: {
    month: string;
    count: number;
  }[];
}

interface AdminState {
  members: Member[];
  selectedMember: Member | null;
  analytics: AnalyticsSummary | null;
  totalMembers: number;
  loading: boolean;
  error: string | null;
}

// Thunks
export const fetchAllMembers = createAsyncThunk(
  'admin/fetchAllMembers',
  async (params: { search?: string; status?: string; page?: number; limit?: number } = {}, 
    { rejectWithValue }) => {
    try {
      const { search, status, page = 1, limit = 10 } = params;
      const queryParams = new URLSearchParams();
      
      if (search) queryParams.append('search', search);
      if (status) queryParams.append('status', status);
      queryParams.append('page', page.toString());
      queryParams.append('limit', limit.toString());
      
      const response = await api.get(`/admin/members?${queryParams.toString()}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch members');
    }
  }
);

export const fetchMemberDetails = createAsyncThunk(
  'admin/fetchMemberDetails',
  async (memberId: string, { rejectWithValue }) => {
    try {
      const response = await api.get(`/admin/members/${memberId}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch member details');
    }
  }
);

export const updateMemberStatus = createAsyncThunk(
  'admin/updateMemberStatus',
  async ({ memberId, status }: { memberId: string; status: string }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/admin/members/${memberId}/status`, { status });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update member status');
    }
  }
);

export const resetMemberPassword = createAsyncThunk(
  'admin/resetMemberPassword',
  async (memberId: string, { rejectWithValue }) => {
    try {
      const response = await api.post(`/admin/members/${memberId}/reset-password`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to reset password');
    }
  }
);

export const fetchAdminAnalytics = createAsyncThunk(
  'admin/fetchAnalytics',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/admin/analytics');
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch analytics');
    }
  }
);

// Initial state
const initialState: AdminState = {
  members: [],
  selectedMember: null,
  analytics: null,
  totalMembers: 0,
  loading: false,
  error: null,
};

// Slice
const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {
    clearAdminError: (state) => {
      state.error = null;
    },
    clearSelectedMember: (state) => {
      state.selectedMember = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch All Members
    builder
      .addCase(fetchAllMembers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllMembers.fulfilled, (state, action: PayloadAction<{ members: Member[]; total: number }>) => {
        state.members = action.payload.members;
        state.totalMembers = action.payload.total;
        state.loading = false;
      })
      .addCase(fetchAllMembers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        toast.error(action.payload as string);
      });

    // Fetch Member Details
    builder
      .addCase(fetchMemberDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMemberDetails.fulfilled, (state, action: PayloadAction<Member>) => {
        state.selectedMember = action.payload;
        state.loading = false;
      })
      .addCase(fetchMemberDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        toast.error(action.payload as string);
      });

    // Update Member Status
    builder
      .addCase(updateMemberStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateMemberStatus.fulfilled, (state, action: PayloadAction<Member>) => {
        const updatedMember = action.payload;
        
        // Update selected member if it's the same one
        if (state.selectedMember && state.selectedMember.id === updatedMember.id) {
          state.selectedMember = updatedMember;
        }
        
        // Update the member in the list
        state.members = state.members.map(member => 
          member.id === updatedMember.id ? updatedMember : member
        );
        
        state.loading = false;
        toast.success(`Member status updated to ${updatedMember.status}`);
      })
      .addCase(updateMemberStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        toast.error(action.payload as string);
      });

    // Reset Member Password
    builder
      .addCase(resetMemberPassword.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(resetMemberPassword.fulfilled, (state) => {
        state.loading = false;
        toast.success('Password reset instructions sent to member');
      })
      .addCase(resetMemberPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        toast.error(action.payload as string);
      });

    // Fetch Admin Analytics
    builder
      .addCase(fetchAdminAnalytics.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdminAnalytics.fulfilled, (state, action: PayloadAction<AnalyticsSummary>) => {
        state.analytics = action.payload;
        state.loading = false;
      })
      .addCase(fetchAdminAnalytics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        toast.error(action.payload as string);
      });
  },
});

export const { clearAdminError, clearSelectedMember } = adminSlice.actions;
export default adminSlice.reducer;