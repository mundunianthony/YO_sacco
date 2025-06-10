import { Link } from 'react-router-dom';
import Button from '../components/Shared/Button';
import { ROUTES } from '../utils/constants';
import { Banknote } from 'lucide-react';

const NotFoundPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col items-center">
        <div className="rounded-full bg-primary-100 p-3 mb-6">
          <Banknote className="h-10 w-10 text-primary-600" />
        </div>
        
        <h1 className="text-6xl font-heading font-bold text-primary-800">404</h1>
        <h2 className="mt-4 text-3xl font-heading font-medium text-gray-900">Page Not Found</h2>
        <p className="mt-2 text-lg text-gray-600 text-center">
          The page you're looking for doesn't exist or has been moved.
        </p>
        
        <div className="mt-10">
          <Button 
            variant="primary"
            size="lg"
            onClick={() => {}}
          >
            <Link to={ROUTES.LOGIN}>Return to Login</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;