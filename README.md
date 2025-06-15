# SACCO Management System

A modern web application for managing Savings and Credit Cooperative Organization (SACCO) operations. Built with React, Node.js, and MongoDB.

## Features

### Member Features
- Member registration and authentication
- Dashboard with account overview
- Savings account management
  - View balance and transaction history
  - Make deposits and withdrawals
- Loan management
  - Apply for loans
  - View loan status and history
  - Make loan payments
- Profile management
- Real-time notifications

### Admin Features
- Member management
  - View all members
  - Approve/reject member applications
  - Manage member status
- Loan management
  - Review loan applications
  - Approve/reject loans
  - Monitor loan payments
- Transaction monitoring
- System notifications
- Dashboard with key metrics

## Tech Stack

### Frontend
- React 18
- TypeScript
- Vite
- Axios for API calls
- React Query for data fetching
- Shadcn UI components
- Tailwind CSS for styling

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose
- JWT authentication
- CORS enabled
- Helmet for security
- Rate limiting
- XSS protection

## Prerequisites

- Node.js (v14 or higher)
- MongoDB
- npm or yarn

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd sacco-management
```

2. Install backend dependencies:
```bash
cd backend
npm install
```

3. Install frontend dependencies:
```bash
cd frontend
npm install
```

4. Create a `.env` file in the backend directory:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/sacco_db
JWT_SECRET=your_secret_key
JWT_EXPIRE=30d
```

## Initial Setup

### Default Admin Credentials
After first installation, you can log in with these default admin credentials:
```
Email: admin@sacco.com
Password: Admin@123
```

**Important**: Change these credentials immediately after first login for security purposes.

### Test User Credentials
For testing member features, you can use these credentials:
```
Email: james@gmail.com
Password: @Test1234
```

### Creating First Admin
If you need to create a new admin account, you can use the following MongoDB command:
```javascript
db.users.insertOne({
  email: "admin@sacco.com",
  password: "$2a$10$YOUR_HASHED_PASSWORD", // Use bcrypt to hash the password
  role: "admin",
  status: "active",
  firstName: "Admin",
  lastName: "User",
  createdAt: new Date(),
  updatedAt: new Date()
})
```

## Running the Application

1. Start the backend server:
```bash
cd backend
npm run dev
```

2. Start the frontend development server:
```bash
cd frontend
npm run dev
```

The application will be available at:
- Frontend: http://localhost:8080
- Backend API: http://localhost:5000

## API Documentation

### Authentication
- POST /api/auth/register - Register new member
- POST /api/auth/login - Member login
- GET /api/auth/logout - Member logout

### Member Routes
- GET /api/members/profile - Get member profile
- PUT /api/members/profile - Update profile
- GET /api/members/savings - Get savings account
- POST /api/members/savings/deposit - Make deposit
- POST /api/members/savings/withdraw - Make withdrawal
- GET /api/members/loans - Get loans
- POST /api/members/loans - Apply for loan

### Admin Routes
- GET /api/admin/users - Get all users
- PUT /api/admin/users/:id/status - Update user status
- GET /api/admin/loans - Get all loans
- PUT /api/admin/loans/:id/status - Update loan status
- GET /api/admin/dashboard - Get admin dashboard

## Development

### Code Structure
```
sacco-management/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── lib/
│   │   └── App.tsx
│   └── package.json
└── backend/
    ├── routes/
    ├── controllers/
    ├── models/
    ├── middleware/
    └── server.js
```

### Available Scripts

Frontend:
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

Backend:
- `npm run dev` - Start development server
- `npm start` - Start production server

## Security Features

- JWT authentication
- Password hashing
- CORS protection
- Rate limiting
- XSS protection
- Helmet security headers
- Input validation
- Error handling

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, email [support@example.com](mailto:support@example.com) or open an issue in the repository. 