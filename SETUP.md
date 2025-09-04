# Cannabis Management System - Setup Guide

## Quick Start

### Prerequisites
- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

### 1. Database Setup
```bash
# Create PostgreSQL database
createdb cannabis_management

# Or using psql
psql -c "CREATE DATABASE cannabis_management;"
```

### 2. Backend Setup
```bash
# Install backend dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env file with your database credentials:
# DB_HOST=localhost
# DB_PORT=5432
# DB_NAME=cannabis_management
# DB_USER=your_username
# DB_PASSWORD=your_password
# JWT_SECRET=your_jwt_secret_here
# JWT_REFRESH_SECRET=your_refresh_secret_here

# Run database migrations
npm run migrate

# Start the backend server
npm run dev
```

### 3. Frontend Setup
```bash
# Navigate to client directory
cd client

# Install frontend dependencies
npm install

# Start the React development server
npm start
```

### 4. Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Login Credentials**: admin@example.com / password (from seed data)

## Development Commands

### Backend Commands
```bash
npm run dev          # Start development server with nodemon
npm run migrate      # Run database migrations
npm run migrate:down # Rollback last migration
npm run seed         # Run database seeds
npm start           # Start production server
```

### Frontend Commands
```bash
cd client
npm start           # Start development server
npm run build       # Build for production
npm test           # Run tests
npm run eject      # Eject from Create React App (not recommended)
```

## Project Structure
```
cannabis-management/
├── server/                 # Backend Node.js/Express
│   ├── config/            # Database and app configuration
│   ├── middleware/        # Authentication and error handling
│   ├── models/           # Database models
│   ├── routes/           # API routes
│   ├── migrations/       # Database migrations
│   └── index.js          # Server entry point
├── client/               # Frontend React app
│   ├── public/           # Static files
│   ├── src/
│   │   ├── components/   # Reusable components
│   │   ├── pages/        # Page components
│   │   ├── services/     # API services
│   │   ├── contexts/     # React contexts
│   │   └── App.js        # Main app component
│   └── package.json
└── package.json          # Backend dependencies
```

## Features Available
- ✅ User Authentication & Authorization
- ✅ Dashboard with Statistics
- ✅ Strain Management
- ✅ Batch Management
- ✅ Plant Tracking
- ✅ Room Management
- ✅ Task Management
- ✅ Inventory Management
- ✅ User Management
- ✅ Reports Dashboard
- ✅ Settings

## API Endpoints
- **Authentication**: `/api/auth/*`
- **Users**: `/api/users/*`
- **Strains**: `/api/strains/*`
- **Batches**: `/api/batches/*`
- **Plants**: `/api/plants/*`
- **Rooms**: `/api/rooms/*`
- **Tasks**: `/api/tasks/*`
- **Inventory**: `/api/inventory/*`

## Troubleshooting

### Database Connection Issues
1. Ensure PostgreSQL is running
2. Check database credentials in `.env`
3. Verify database exists: `psql -l`

### Frontend Not Loading
1. Ensure backend is running on port 3001
2. Check REACT_APP_API_URL in `client/.env`
3. Clear browser cache and restart

### Authentication Issues
1. Check JWT secrets in `.env`
2. Clear localStorage in browser
3. Restart both servers

## Next Steps
1. Customize the application for your facility
2. Add your strains, rooms, and users
3. Configure METRC integration (coming soon)
4. Set up environmental monitoring (coming soon)