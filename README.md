# Cannabis Cultivation Management System

A comprehensive cannabis facility management platform integrating cultivation, processing, inventory, task management, and compliance with Growlink monitoring and METRC state reporting.

## 🌿 Features

### Core Modules
- **Cultivation Management** - Plant lifecycle tracking, batch management, environmental monitoring
- **Task Management** - SOP digitization, Google Calendar integration, team coordination
- **Processing Module** - Harvest management, drying, curing, quality control
- **Inventory Management** - Multi-category tracking, real-time updates, supplier management
- **Compliance Module** - METRC integration, quality assurance, audit trails
- **Comprehensive Tagging** - Universal tagging framework with custom classifications

### System Integrations
- **Growlink API** - Environmental monitoring and automation
- **METRC API** - State compliance tracking and reporting
- **Altequa HVAC** - Climate control systems
- **Dositron Irrigation** - Nutrient dosing and pH control
- **Google Workspace** - Calendar, email, and document integration

## 🚀 Quick Start

### Prerequisites
- Node.js (v16+)
- PostgreSQL (v12+)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd cannabis-cultivation-management
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Set up database**
   ```bash
   # Create database
   createdb cannabis_management
   
   # Run migrations
   npm run db:migrate
   
   # Seed database (optional)
   npm run db:seed
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

The API will be available at `http://localhost:5000`

## 📁 Project Structure

```
cannabis-cultivation-management/
├── server/                     # Backend API
│   ├── config/                # Database and app configuration
│   ├── database/              # Migrations and seeds
│   ├── middleware/            # Express middleware
│   ├── routes/                # API routes
│   ├── utils/                 # Utility functions
│   └── index.js              # Server entry point
├── client/                    # Frontend React app (coming soon)
├── logs/                      # Application logs
├── uploads/                   # File uploads
├── .env.example              # Environment variables template
├── package.json              # Dependencies and scripts
└── README.md                 # This file
```

## 🔧 API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/logout` - User logout

### Users
- `GET /api/v1/users` - Get all users
- `GET /api/v1/users/me` - Get current user profile
- `PUT /api/v1/users/me` - Update user profile

### Core Modules (Coming Soon)
- `/api/v1/plants` - Plant management
- `/api/v1/batches` - Batch operations
- `/api/v1/tasks` - Task management
- `/api/v1/inventory` - Inventory tracking
- `/api/v1/facilities` - Facility management
- `/api/v1/compliance` - Compliance operations
- `/api/v1/reports` - Reporting and analytics
- `/api/v1/integrations` - External system integrations

## 🛠️ Development

### Available Scripts
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm test` - Run tests
- `npm run lint` - Run ESLint
- `npm run db:migrate` - Run database migrations
- `npm run db:seed` - Seed database with sample data

### Database Management
```bash
# Create new migration
npx knex migrate:make migration_name --knexfile server/config/knexfile.js

# Run migrations
npm run db:migrate

# Rollback migrations
npm run db:rollback

# Create seed file
npx knex seed:make seed_name --knexfile server/config/knexfile.js
```

## 🔐 Security Features

- JWT-based authentication with refresh tokens
- Role-based access control (RBAC)
- Rate limiting and request validation
- Comprehensive audit trails
- Secure file upload handling
- Environment-based configuration

## 📊 Monitoring & Logging

- Winston-based structured logging
- Real-time monitoring with Socket.IO
- Performance metrics tracking
- Error tracking and alerting
- Audit trail maintenance

## 🌱 Development Phases

### Phase 1: Core Foundation ✅
- [x] Project structure and development environment
- [x] User authentication and role management system
- [ ] Database schema and core models
- [ ] Basic plant tracking and batch management
- [ ] Core task management system

### Phase 2: Advanced Features
- [ ] Environmental monitoring dashboard
- [ ] Processing module development
- [ ] Quality assurance systems
- [ ] Advanced tagging system
- [ ] Reporting framework

### Phase 3: Integrations & Mobile
- [ ] External system integrations
- [ ] Mobile application
- [ ] Advanced room management
- [ ] Google Workspace integration
- [ ] Comprehensive alerting

### Phase 4: Scale & Polish
- [ ] Multi-facility support
- [ ] Hardware integrations
- [ ] Advanced automation
- [ ] Performance optimization

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions, please contact the development team or create an issue in the repository.

---

**Built with ❤️ for the cannabis cultivation industry**