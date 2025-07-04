import { Link } from 'react-router-dom';

export function MainNav() {
  return (
    <nav className="flex items-center space-x-4 lg:space-x-6">
      <Link
        to="/admin-dashboard"
        className="text-sm font-medium transition-colors hover:text-primary"
      >
        Dashboard
      </Link>
      <Link
        to="/admin/members"
        className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
      >
        Members
      </Link>
      <Link
        to="/admin/loans"
        className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
      >
        Loans
      </Link>
    </nav>
  );
}
