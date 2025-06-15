import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { registerSchema } from '../../utils/validationSchemas';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { register as registerUser } from '../../features/auth/authSlice';
import InputField from '../../components/Shared/InputField';
import Button from '../../components/Shared/Button';
import { ROUTES } from '../../utils/constants';
import { Banknote } from 'lucide-react';

interface RegisterFormInputs {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  address: string;
}

const RegisterPage = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { loading } = useAppSelector((state) => state.auth);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormInputs>({
    resolver: yupResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormInputs) => {
    const { confirmPassword, ...registerData } = data;
    const resultAction = await dispatch(registerUser(registerData));
    
    if (registerUser.fulfilled.match(resultAction)) {
      navigate(ROUTES.LOGIN);
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
          Create a new account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Or{' '}
          <Link
            to={ROUTES.LOGIN}
            className="font-medium text-primary-600 hover:text-primary-500"
          >
            sign in to your existing account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <InputField
              label="Full Name"
              name="name"
              type="text"
              register={register}
              error={errors.name?.message}
              required
            />

            <InputField
              label="Email Address"
              name="email"
              type="email"
              register={register}
              error={errors.email?.message}
              required
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField
                label="Password"
                name="password"
                type="password"
                register={register}
                error={errors.password?.message}
                required
              />

              <InputField
                label="Confirm Password"
                name="confirmPassword"
                type="password"
                register={register}
                error={errors.confirmPassword?.message}
                required
              />
            </div>

            <InputField
              label="Phone Number"
              name="phone"
              type="tel"
              register={register}
              error={errors.phone?.message}
              required
            />

            <InputField
              label="Address"
              name="address"
              type="text"
              register={register}
              error={errors.address?.message}
              required
            />

            <div>
              <Button
                type="submit"
                variant="primary"
                isLoading={loading}
                fullWidth
              >
                Register
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;