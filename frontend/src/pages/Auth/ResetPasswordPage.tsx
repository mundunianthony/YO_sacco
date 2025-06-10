import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { resetPasswordSchema } from '../../utils/validationSchemas';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { resetPassword } from '../../features/auth/authSlice';
import InputField from '../../components/Shared/InputField';
import Button from '../../components/Shared/Button';
import { ROUTES } from '../../utils/constants';
import { Banknote, CheckCircle } from 'lucide-react';
import { useState } from 'react';

interface ResetPasswordFormInputs {
  email: string;
}

const ResetPasswordPage = () => {
  const dispatch = useAppDispatch();
  const { loading } = useAppSelector((state) => state.auth);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormInputs>({
    resolver: yupResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordFormInputs) => {
    const resultAction = await dispatch(resetPassword(data));
    
    if (resetPassword.fulfilled.match(resultAction)) {
      setSuccess(true);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="rounded-full bg-primary-100 p-3">
            <Banknote className="h-10 w-10 text-primary-600" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-heading font-bold text-gray-900">
          Reset your password
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Or{' '}
          <Link
            to={ROUTES.LOGIN}
            className="font-medium text-primary-600 hover:text-primary-500"
          >
            go back to sign in
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {success ? (
            <div className="rounded-md bg-success-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <CheckCircle className="h-5 w-5 text-success-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-success-800">
                    Password reset instructions sent
                  </h3>
                  <div className="mt-2 text-sm text-success-700">
                    <p>
                      We've sent password reset instructions to your email. Please check your inbox.
                    </p>
                  </div>
                  <div className="mt-4">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setSuccess(false)}
                    >
                      Try another email
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
              <div>
                <p className="text-sm text-gray-600 mb-4">
                  Enter your email address and we'll send you a link to reset your password.
                </p>
              </div>
              
              <InputField
                label="Email Address"
                name="email"
                type="email"
                register={register}
                error={errors.email?.message}
                required
              />

              <div>
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={loading}
                  fullWidth
                >
                  Send Reset Link
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;