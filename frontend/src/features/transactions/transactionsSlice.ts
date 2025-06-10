import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../../api/axios';
import { toast } from 'react-toastify';

// Define types
export interface Transaction {
  id: string;
  memberId: string;
  memberName?: string;
  type: 'deposit' | 'withdrawal' | 'loan_disbursement' | 'loan_repayment';
  amount: number;
  balanceAfter: number;
  reference: string;
  status: 'completed' | 'pending' | 'failed';
  date: string;
  mode?: string;
}

interface TransactionFilters {
  startDate?: string;
  endDate?: string;
  type?: string;
  memberId?: string;
}

interface TransactionsState {
  transactions: Transaction[];
  memberTransactions: Transaction[];
  transaction: Transaction | null;
  loading: boolean;
  error: string | null;
  totalCount: number;
}

interface MakeDepositParams {
  memberId: string;
  amount: number;
  mode: string;
  reference: string;
  date: string;
}

interface MakeWithdrawalParams {
  memberId: string;
  amount: number;
  bankName: string;
  accountNumber: string;
  reason: string;
}

// Thunks
export const fetchMemberTransactions = createAsyncThunk(
  'transactions/fetchMemberTransactions',
  async (
    { memberId, filters, page = 1, limit = 10 }: 
    { memberId: string; filters?: TransactionFilters; page?: number; limit?: number },
    { rejectWithValue }
  ) => {
    try {
      const queryParams = new URLSearchParams();
      
      if (filters?.startDate) queryParams.append('start', filters.startDate);
      if (filters?.endDate) queryParams.append('end', filters.endDate);
      if (filters?.type) queryParams.append('type', filters.type);
      queryParams.append('page', page.toString());
      queryParams.append('limit', limit.toString());
      
      const response = await api.get(`/transactions/member/${memberId}?${queryParams.toString()}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch transactions');
    }
  }
);

export const fetchAllTransactions = createAsyncThunk(
  'transactions/fetchAllTransactions',
  async (
    { filters, page = 1, limit = 10 }: 
    { filters?: TransactionFilters; page?: number; limit?: number },
    { rejectWithValue }
  ) => {
    try {
      const queryParams = new URLSearchParams();
      
      if (filters?.startDate) queryParams.append('start', filters.startDate);
      if (filters?.endDate) queryParams.append('end', filters.endDate);
      if (filters?.type) queryParams.append('type', filters.type);
      if (filters?.memberId) queryParams.append('memberId', filters.memberId);
      queryParams.append('page', page.toString());
      queryParams.append('limit', limit.toString());
      
      const response = await api.get(`/admin/transactions?${queryParams.toString()}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch transactions');
    }
  }
);

export const makeDeposit = createAsyncThunk(
  'transactions/makeDeposit',
  async (depositData: MakeDepositParams, { rejectWithValue }) => {
    try {
      const response = await api.post('/transactions/deposit', depositData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to make deposit');
    }
  }
);

export const makeWithdrawal = createAsyncThunk(
  'transactions/makeWithdrawal',
  async (withdrawalData: MakeWithdrawalParams, { rejectWithValue }) => {
    try {
      const response = await api.post('/transactions/withdrawal', withdrawalData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to make withdrawal');
    }
  }
);

// Initial state
const initialState: TransactionsState = {
  transactions: [],
  memberTransactions: [],
  transaction: null,
  loading: false,
  error: null,
  totalCount: 0,
};

// Slice
const transactionsSlice = createSlice({
  name: 'transactions',
  initialState,
  reducers: {
    clearTransactionError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch Member Transactions
    builder
      .addCase(fetchMemberTransactions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMemberTransactions.fulfilled, (state, action: PayloadAction<{ transactions: Transaction[]; total: number }>) => {
        state.memberTransactions = action.payload.transactions;
        state.totalCount = action.payload.total;
        state.loading = false;
      })
      .addCase(fetchMemberTransactions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        toast.error(action.payload as string);
      });

    // Fetch All Transactions (Admin)
    builder
      .addCase(fetchAllTransactions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllTransactions.fulfilled, (state, action: PayloadAction<{ transactions: Transaction[]; total: number }>) => {
        state.transactions = action.payload.transactions;
        state.totalCount = action.payload.total;
        state.loading = false;
      })
      .addCase(fetchAllTransactions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        toast.error(action.payload as string);
      });

    // Make Deposit
    builder
      .addCase(makeDeposit.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(makeDeposit.fulfilled, (state, action: PayloadAction<Transaction>) => {
        state.transaction = action.payload;
        state.loading = false;
        toast.success('Deposit successful');
      })
      .addCase(makeDeposit.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        toast.error(action.payload as string);
      });

    // Make Withdrawal
    builder
      .addCase(makeWithdrawal.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(makeWithdrawal.fulfilled, (state, action: PayloadAction<Transaction>) => {
        state.transaction = action.payload;
        state.loading = false;
        toast.success('Withdrawal request submitted');
      })
      .addCase(makeWithdrawal.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        toast.error(action.payload as string);
      });
  },
});

export const { clearTransactionError } = transactionsSlice.actions;
export default transactionsSlice.reducer;