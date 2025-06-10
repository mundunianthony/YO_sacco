import * as yup from 'yup';

// Login schema
export const loginSchema = yup.object().shape({
  email: yup
    .string()
    .email('Please enter a valid email')
    .required('Email is required'),
  password: yup
    .string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required'),
});

// Registration schema
export const registerSchema = yup.object().shape({
  name: yup.string().required('Full name is required'),
  email: yup
    .string()
    .email('Please enter a valid email')
    .required('Email is required'),
  password: yup
    .string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password')], 'Passwords must match')
    .required('Confirm password is required'),
  phone: yup.string().required('Phone number is required'),
  address: yup.string().required('Address is required'),
});

// Reset password schema
export const resetPasswordSchema = yup.object().shape({
  email: yup
    .string()
    .email('Please enter a valid email')
    .required('Email is required'),
});

// Deposit schema
export const depositSchema = yup.object().shape({
  amount: yup
    .number()
    .positive('Amount must be greater than 0')
    .required('Amount is required'),
  mode: yup.string().required('Payment mode is required'),
  reference: yup.string().required('Transaction reference is required'),
  date: yup.date().required('Date is required'),
});

// Withdrawal schema
export const withdrawalSchema = yup.object().shape({
  amount: yup
    .number()
    .positive('Amount must be greater than 0')
    .required('Amount is required'),
  bankName: yup.string().required('Bank name is required'),
  accountNumber: yup.string().required('Account number is required'),
  reason: yup.string().required('Reason is required'),
});

// Loan application schema
export const loanApplicationSchema = yup.object().shape({
  amount: yup
    .number()
    .positive('Amount must be greater than 0')
    .required('Amount is required'),
  type: yup.string().required('Loan type is required'),
  tenure: yup
    .number()
    .positive('Tenure must be greater than 0')
    .required('Tenure is required'),
  purpose: yup.string().required('Purpose is required'),
  guarantorId: yup.string().required('Guarantor is required'),
});

// Profile update schema
export const profileUpdateSchema = yup.object().shape({
  name: yup.string().required('Full name is required'),
  phone: yup.string().required('Phone number is required'),
  address: yup.string().required('Address is required'),
  nextOfKin: yup.string().required('Next of kin is required'),
});

// Change password schema
export const changePasswordSchema = yup.object().shape({
  oldPassword: yup.string().required('Current password is required'),
  newPassword: yup
    .string()
    .min(6, 'Password must be at least 6 characters')
    .required('New password is required'),
  confirmNewPassword: yup
    .string()
    .oneOf([yup.ref('newPassword')], 'Passwords must match')
    .required('Confirm password is required'),
});

// Message schema
export const messageSchema = yup.object().shape({
  text: yup.string().required('Message is required'),
});

// Loan approval schema
export const loanApprovalSchema = yup.object().shape({
  approvedAmount: yup
    .number()
    .positive('Amount must be greater than 0')
    .required('Approved amount is required'),
  interestRate: yup
    .number()
    .positive('Interest rate must be greater than 0')
    .required('Interest rate is required'),
  scheduleStart: yup.date().required('Schedule start date is required'),
});

// Loan rejection schema
export const loanRejectionSchema = yup.object().shape({
  reason: yup.string().required('Rejection reason is required'),
});