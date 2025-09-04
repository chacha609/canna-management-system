# 🌿 Cannabis Management System - Windows Setup Guide

## Prerequisites for Windows

### 1. Install Node.js
- Download from: https://nodejs.org/
- Choose LTS version (recommended)
- Run installer and follow prompts
- Verify installation:
  ```powershell
  node --version
  npm --version
  ```

### 2. Install PostgreSQL
- Download from: https://www.postgresql.org/download/windows/
- Run installer and remember your password
- Add PostgreSQL to PATH during installation
- Verify installation:
  ```powershell
  psql --version
  ```

## Quick Start for Windows

### Option 1: Double-click to run
1. **Navigate to project folder in File Explorer**
2. **Double-click `start.bat`**
3. **Wait for installation and startup**
4. **Open browser to**: http://localhost:3000

### Option 2: PowerShell commands
```powershell
# Navigate to project directory
cd "D:\canna software"

# Run the batch file
.\start.bat
```

### Option 3: Manual PowerShell setup
```powershell
# 1. Install dependencies
npm install
cd client
npm install
cd ..

# 2. Setup database
# Open PostgreSQL command line (psql) and run:
# CREATE DATABASE cannabis_management;

# 3. Configure environment
copy .env.example .env
# Edit .env file with your database settings

# 4. Run migrations
npm run db:migrate

# 5. Start servers
npm run dev
```

## Database Setup on Windows

### Using pgAdmin (GUI method)
1. **Open pgAdmin** (installed with PostgreSQL)
2. **Connect to your PostgreSQL server**
3. **Right-click "Databases" → Create → Database**
4. **Name**: `cannabis_management`
5. **Click Save**

### Using Command Line
```powershell
# Open Command Prompt as Administrator
# Navigate to PostgreSQL bin directory (usually):
cd "C:\Program Files\PostgreSQL\15\bin"

# Create database
.\createdb.exe cannabis_management

# Or connect to psql and create manually
.\psql.exe -U postgres
# Then in psql:
CREATE DATABASE cannabis_management;
\q
```

## Environment Configuration (.env file)

Create `.env` file in project root with:
```
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=cannabis_management
DB_USER=postgres
DB_PASSWORD=your_postgres_password

# Server Configuration
PORT=3001
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here
JWT_REFRESH_SECRET=your_super_secret_refresh_key_here
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# CORS Configuration
CORS_ORIGIN=http://localhost:3000
```

## Troubleshooting Windows Issues

### PostgreSQL Connection Issues
```powershell
# Check if PostgreSQL service is running
Get-Service postgresql*

# Start PostgreSQL service if stopped
Start-Service postgresql-x64-15  # (version may vary)

# Test connection
psql -U postgres -d cannabis_management
```

### Node.js/npm Issues
```powershell
# Clear npm cache
npm cache clean --force

# Update npm
npm install -g npm@latest

# Check for Windows build tools (if needed)
npm install -g windows-build-tools
```

### Port Issues
```powershell
# Check what's using port 3000 or 3001
netstat -ano | findstr :3000
netstat -ano | findstr :3001

# Kill process if needed (replace PID with actual process ID)
taskkill /PID 1234 /F
```

### Firewall Issues
- **Windows Defender Firewall** may block Node.js
- **Allow Node.js** through firewall when prompted
- Or manually add exception in Windows Security settings

## Access Your Dashboard

Once running:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Login**: admin@example.com / password

## Windows-Specific Commands

### Start Application
```powershell
# Option 1: Batch file
.\start.bat

# Option 2: npm script
npm run dev

# Option 3: Manual start
# Terminal 1:
npm run server:dev

# Terminal 2:
npm run client:dev
```

### Database Management
```powershell
# Run migrations
npm run db:migrate

# Rollback migrations
npm run db:rollback

# Run seeds
npm run db:seed
```

### Development
```powershell
# Install new packages
npm install package-name
cd client && npm install package-name

# Build for production
npm run build

# Run tests
npm test
```

## Next Steps
1. 🔐 Change default admin password
2. 🏢 Configure your facility
3. 🧬 Add your strains
4. 🏠 Set up rooms
5. 👥 Add team members

## Support
- Check main README.md for general information
- Review SETUP.md for detailed configuration
- See QUICKSTART.md for quick reference

---

**🎉 Your Cannabis Management System is ready on Windows!**