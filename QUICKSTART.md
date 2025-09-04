# 🌿 Cannabis Management System - Quick Start

## One-Command Setup & Launch

### Option 1: Automatic Setup (Recommended)
```bash
node start.js
```

### Option 2: Manual Setup
```bash
# 1. Install dependencies
npm install
cd client && npm install && cd ..

# 2. Setup database (PostgreSQL required)
createdb cannabis_management

# 3. Configure environment
cp .env.example .env
# Edit .env with your database credentials

# 4. Run migrations
npm run db:migrate

# 5. Start both servers
npm run dev
```

## Access Your Dashboard

Once running, open your browser to:
- **Frontend Dashboard**: http://localhost:3000
- **Backend API**: http://localhost:3001

## Default Login Credentials
- **Email**: admin@example.com
- **Password**: password

## What You'll See

### 🏠 Dashboard
- System overview with statistics
- Recent activity feed
- Quick action buttons
- Real-time status indicators

### 🧬 Strain Management
- Add/edit cannabis strains
- Track genetics and characteristics
- Monitor THC/CBD levels
- Performance analytics

### 📦 Batch Management
- Create cultivation batches
- Track growth stages
- Monitor plant counts
- Harvest scheduling

### 🌱 Plant Tracking
- Individual plant monitoring
- Health status tracking
- Room assignments
- Movement history

### 🏠 Room Management
- Facility room setup
- Capacity management
- Environmental settings
- Utilization tracking

### ✅ Task Management
- Create and assign tasks
- Use task templates
- Track completion
- Workflow management

### 📦 Inventory Management
- Stock level monitoring
- Category organization
- Expiration tracking
- Low stock alerts

### 👥 User Management
- Role-based access control
- Permission management
- User activity tracking
- Team coordination

## Troubleshooting

### Database Issues
```bash
# Check if PostgreSQL is running
pg_isready

# Create database if it doesn't exist
createdb cannabis_management

# Reset database
npm run db:rollback
npm run db:migrate
```

### Port Conflicts
If ports 3000 or 3001 are in use:
- Backend: Change PORT in .env file
- Frontend: Change port when prompted or set PORT=3002 in client/.env

### Dependencies Issues
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules client/node_modules
npm install
cd client && npm install
```

## Next Steps
1. 🔐 Change default admin password
2. 🏢 Add your facility information
3. 🧬 Import your strain library
4. 🏠 Configure your rooms
5. 👥 Add team members
6. 📋 Create task templates
7. 📦 Set up inventory categories

## Support
- Check SETUP.md for detailed instructions
- Review project_history.md for development details
- Check TODO.md for upcoming features

---

**🎉 Congratulations! Your Cannabis Management System is ready to use!**