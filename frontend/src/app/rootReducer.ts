import { combineReducers } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import memberReducer from '../features/member/memberSlice';
import adminReducer from '../features/admin/adminSlice';
import transactionsReducer from '../features/transactions/transactionsSlice';
import loansReducer from '../features/loans/loansSlice';
import messagesReducer from '../features/messages/messagesSlice';

const rootReducer = combineReducers({
  auth: authReducer,
  member: memberReducer,
  admin: adminReducer,
  transactions: transactionsReducer,
  loans: loansReducer,
  messages: messagesReducer,
});

export default rootReducer;