import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../../api/axios';
import { toast } from 'react-toastify';

// Define types
export interface Loan {
  id: string;
  memberId: string;
  memberName?: string;
  amount: number;
  approvedAmount?: number;
  type: string;
  tenure: number;
  purpose: string;
  guarantorId: string;
  guarantorName?: string;
  interestRate?: number;
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  applicationDate: string;
  approvalDate?: string;
  rejectionReason?: string;
  documents?: string[];
}

interface LoanFilters {
  status?: string;
  type?: string;
  startDate?: string;
  endDate?: string;
}

interface LoanApplicationData {
  memberId: string;
  amount: number;
  type: string;
  tenure: number;
  purpose: string;
  guarantorId: string;
  documents?: File[];
}

interface LoanApprovalData {
  loanId: string;
  approvedAmount: number;
  interestRate: number;
  scheduleStart: string;
}

interface LoanRejectionData {
  loanId: string;
  reason: string;
}

interface LoansState {
  memberLoans: Loan[];
  allLoans: Loan[];
  selectedLoan: Loan | null;
  loading: boolean;
  error: string | null;
  totalCount: number;
}

// Thunks
export const fetchMemberLoans = createAsyncThunk(
  'loans/fetchMemberLoans',
  async (memberId: string, { rejectWithValue }) => {
    try {
      const response = await api.get(`/loans/member/${memberId}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch loans');
    }
  }
);

export const fetchLoanRequests = createAsyncThunk(
  'loans/fetchLoanRequests',
  async (
    { filters, page = 1, limit = 10 }: 
    { filters?: LoanFilters; page?: number; limit?: number },
    { rejectWithValue }
  ) => {
    try {
      const queryParams = new URLSearchParams();
      
      if (filters?.status) queryParams.append('status', filters.status);
      if (filters?.type) queryParams.append('type', filters.type);
      if (filters?.startDate) queryParams.append('start', filters.startDate);
      if (filters?.endDate) queryParams.append('end', filters.endDate);
      queryParams.append('page', page.toString());
      queryParams.append('limit', limit.toString());
      
      const response = await api.get(`/admin/loans/requests?${queryParams.toString()}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch loan requests');
    }
  }
);

export const applyForLoan = createAsyncThunk(
  'loans/applyForLoan',
  async (loanData: LoanApplicationData, { rejectWithValue }) => {
    try {
      // Handle file uploads
      let formData;
      if (loanData.documents && loanData.documents.length > 0) {
        formData = new FormData();
        Object.keys(loanData).forEach(key => {
          if (key !== 'documents') {
            formData.append(key, loanData[key as keyof LoanApplicationData] as string);
          }
        });
        
        loanData.documents.forEach((doc, index) => {
          formData.append(`documents`, doc);
        });
      }
      
      const response = await api.post('/loans/apply', formData || loanData, {
        headers: formData ? { 'Content-Type': 'multipart/form-data' } : undefined
      });
      
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to apply for loan');
    }
  }
);

export const cancelLoanApplication = createAsyncThunk(
  'loans/cancelLoanApplication',
  async ({ memberId, loanId }: { memberId: string; loanId: string }, { rejectWithValue }) => {
    try {
      const response = await api.delete(`/loans/member/${memberId}/${loanId}`);
      return { loanId, ...response.data };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to cancel loan application');
    }
  }
);

export const approveLoan = createAsyncThunk(
  'loans/approveLoan',
  async (approvalData: LoanApprovalData, { rejectWithValue }) => {
    try {
      const response = await api.put(`/admin/loans/${approvalData.loanId}/approve`, {
        approvedAmount: approvalData.approvedAmount,
        interestRate: approvalData.interestRate,
        scheduleStart: approvalData.scheduleStart,
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to approve loan');
    }
  }
);

export const rejectLoan = createAsyncThunk(
  'loans/rejectLoan',
  async (rejectionData: LoanRejectionData, { rejectWithValue }) => {
    try {
      const response = await api.put(`/admin/loans/${rejectionData.loanId}/reject`, {
        reason: rejectionData.reason,
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to reject loan');
    }
  }
);

// Initial state
const initialState: LoansState = {
  memberLoans: [],
  allLoans: [],
  selectedLoan: null,
  loading: false,
  error: null,
  totalCount: 0,
};

// Slice
const loansSlice = createSlice({
  name: 'loans',
  initialState,
  reducers: {
    clearLoanError: (state) => {
      state.error = null;
    },
    setSelectedLoan: (state, action: PayloadAction<Loan>) => {
      state.selectedLoan = action.payload;
    },
    clearSelectedLoan: (state) => {
      state.selectedLoan = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch Member Loans
    builder
      .addCase(fetchMemberLoans.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMemberLoans.fulfilled, (state, action: PayloadAction<Loan[]>) => {
        state.memberLoans = action.payload;
        state.loading = false;
      })
      .addCase(fetchMemberLoans.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        toast.error(action.payload as string);
      });

    // Fetch Loan Requests (Admin)
    builder
      .addCase(fetchLoanRequests.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLoanRequests.fulfilled, (state, action: PayloadAction<{ loans: Loan[]; total: number }>) => {
        state.allLoans = action.payload.loans;
        state.totalCount = action.payload.total;
        state.loading = false;
      })
      .addCase(fetchLoanRequests.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        toast.error(action.payload as string);
      });

    // Apply for Loan
    builder
      .addCase(applyForLoan.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(applyForLoan.fulfilled, (state, action: PayloadAction<Loan>) => {
        state.memberLoans.unshift(action.payload);
        state.loading = false;
        toast.success('Loan application submitted successfully');
      })
      .addCase(applyForLoan.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        toast.error(action.payload as string);
      });

    // Cancel Loan Application
    builder
      .addCase(cancelLoanApplication.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(cancelLoanApplication.fulfilled, (state, action: PayloadAction<{ loanId: string }>) => {
        state.memberLoans = state.memberLoans.filter(
          loan => loan.id !== action.payload.loanId
        );
        state.loading = false;
        toast.success('Loan application cancelled');
      })
      .addCase(cancelLoanApplication.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        toast.error(action.payload as string);
      });

    // Approve Loan (Admin)
    builder
      .addCase(approveLoan.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(approveLoan.fulfilled, (state, action: PayloadAction<Loan>) => {
        const updatedLoan = action.payload;
        
        // Update in allLoans array
        state.allLoans = state.allLoans.map(loan => 
          loan.id === updatedLoan.id ? updatedLoan : loan
        );
        
        state.loading = false;
        toast.success('Loan approved successfully');
      })
      .addCase(approveLoan.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        toast.error(action.payload as string);
      });

    // Reject Loan (Admin)
    builder
      .addCase(rejectLoan.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(rejectLoan.fulfilled, (state, action: PayloadAction<Loan>) => {
        const updatedLoan = action.payload;
        
        // Update in allLoans array
        state.allLoans = state.allLoans.map(loan => 
          loan.id === updatedLoan.id ? updatedLoan : loan
        );
        
        state.loading = false;
        toast.success('Loan rejected');
      })
      .addCase(rejectLoan.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        toast.error(action.payload as string);
      });
  },
});

export const { clearLoanError, setSelectedLoan, clearSelectedLoan } = loansSlice.actions;
export default loansSlice.reducer;