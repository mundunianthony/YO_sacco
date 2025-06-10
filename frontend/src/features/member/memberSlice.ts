import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../../api/axios';
import { toast } from 'react-toastify';

// Define types
interface MemberProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  nextOfKin?: string;
  profileImage?: string;
  membershipNumber?: string;
  dateJoined?: string;
}

interface MemberBalance {
  balance: number;
}

interface MemberState {
  profile: MemberProfile | null;
  balance: number;
  loading: boolean;
  error: string | null;
}

// Thunks
export const fetchMemberProfile = createAsyncThunk(
  'member/fetchProfile',
  async (memberId: string, { rejectWithValue }) => {
    try {
      const response = await api.get(`/members/${memberId}/profile`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch profile');
    }
  }
);

export const updateMemberProfile = createAsyncThunk(
  'member/updateProfile',
  async ({ memberId, profileData }: { memberId: string; profileData: Partial<MemberProfile> }, 
    { rejectWithValue }) => {
    try {
      const response = await api.put(`/members/${memberId}/profile`, profileData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update profile');
    }
  }
);

export const fetchMemberBalance = createAsyncThunk(
  'member/fetchBalance',
  async (memberId: string, { rejectWithValue }) => {
    try {
      const response = await api.get(`/members/${memberId}/balance`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch balance');
    }
  }
);

// Initial state
const initialState: MemberState = {
  profile: null,
  balance: 0,
  loading: false,
  error: null,
};

// Slice
const memberSlice = createSlice({
  name: 'member',
  initialState,
  reducers: {
    clearMemberError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch Profile
    builder
      .addCase(fetchMemberProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMemberProfile.fulfilled, (state, action: PayloadAction<MemberProfile>) => {
        state.profile = action.payload;
        state.loading = false;
      })
      .addCase(fetchMemberProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        toast.error(action.payload as string);
      });

    // Update Profile
    builder
      .addCase(updateMemberProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateMemberProfile.fulfilled, (state, action: PayloadAction<MemberProfile>) => {
        state.profile = action.payload;
        state.loading = false;
        toast.success('Profile updated successfully');
      })
      .addCase(updateMemberProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        toast.error(action.payload as string);
      });

    // Fetch Balance
    builder
      .addCase(fetchMemberBalance.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMemberBalance.fulfilled, (state, action: PayloadAction<MemberBalance>) => {
        state.balance = action.payload.balance;
        state.loading = false;
      })
      .addCase(fetchMemberBalance.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        toast.error(action.payload as string);
      });
  },
});

export const { clearMemberError } = memberSlice.actions;
export default memberSlice.reducer;