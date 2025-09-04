# FSM Pro - Field Service Management Platform

A comprehensive Field Service Management platform built with modern technologies including React, Node.js, TypeScript, and Supabase.

## 🏗️ Architecture

- **Backend API**: Node.js + Express + TypeScript
- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Database**: PostgreSQL
- **Cache**: Redis
- **Containerization**: Docker + Docker Compose

## 🚀 Quick Start

### Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for local development)

### 1. Environment Setup

1. Copy the environment template:
```bash
cp .env.example .env
```

2. Update the `.env` file with your database credentials:
```env
DATABASE_URL=postgresql://fsm_user:fsm_password@postgres:5432/fsm_db
DB_HOST=postgres
DB_PORT=5432
DB_NAME=fsm_db
DB_USER=fsm_user
DB_PASSWORD=fsm_password
JWT_SECRET=your_jwt_secret_key_here
```

### 2. Database Setup

The PostgreSQL database will be automatically created and initialized when you start the Docker containers. The database schema and sample data are included in `database/init.sql`.

### 3. Start the Application

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### 4. Access the Application

- **Admin Dashboard**: http://localhost:3000
- **API**: http://localhost:3001
- **API Health Check**: http://localhost:3001/api/health

## 📁 Project Structure

```
fsm-pro/
├── api/                     # Node.js API
│   ├── src/
│   │   ├── controllers/     # Route controllers
│   │   ├── middleware/      # Express middleware
│   │   ├── routes/          # API routes
│   │   ├── config/          # Configuration files
│   │   └── types/           # TypeScript types
│   ├── Dockerfile
│   └── package.json
├── admin-frontend/          # React Admin Dashboard
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/           # Page components
│   │   ├── stores/          # Zustand stores
│   │   ├── services/        # API services
│   │   └── types/           # TypeScript types
│   ├── Dockerfile
│   └── package.json
├── nginx/                   # Reverse proxy
│   ├── nginx.conf
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

## 🔐 Authentication

The platform uses PostgreSQL with bcrypt password hashing and JWT tokens:

1. Users authenticate via PostgreSQL database
2. Passwords are hashed using bcrypt
3. API generates JWT tokens for session management
4. Frontend stores tokens and manages auth state with Zustand

### Demo Credentials

- **Email**: admin@fsm.com
- **Password**: admin123

## 🛠️ Development

### Local Development (without Docker)

1. **Start API**:
```bash
cd api
npm install
npm run dev
```

2. **Start Frontend**:
```bash
cd admin-frontend
npm install
npm start
```

3. **Start Redis** (required for API):
```bash
docker run -d -p 6379:6379 redis:7-alpine
```

### Available Scripts

**API**:
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server

**Frontend**:
- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run tests

## 📊 Features Implemented (Phase 1)

### ✅ Completed
- [x] Docker containerization setup
- [x] Node.js API with TypeScript
- [x] Supabase integration
- [x] JWT authentication system
- [x] React admin dashboard
- [x] Login page with form validation
- [x] Dashboard with KPI cards
- [x] Responsive sidebar navigation
- [x] Protected routes
- [x] State management with Zustand
- [x] API service layer
- [x] Toast notifications

### 🚧 In Progress
- [ ] Basic CRUD operations for all entities
- [ ] Work Orders management
- [ ] Technicians management
- [ ] Customers management

### 📋 Next Phase
- [ ] Real-time updates with WebSocket
- [ ] File upload for job photos
- [ ] Advanced filtering and search
- [ ] Charts and analytics
- [ ] Mobile app foundation

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `DB_HOST` | Database host | Yes |
| `DB_PORT` | Database port | Yes |
| `DB_NAME` | Database name | Yes |
| `DB_USER` | Database user | Yes |
| `DB_PASSWORD` | Database password | Yes |
| `JWT_SECRET` | Secret for JWT token signing | Yes |
| `PORT` | API server port | No (default: 3001) |
| `REDIS_URL` | Redis connection URL | No (default: redis://redis:6379) |

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Error**:
   - Verify your database credentials in `.env`
   - Check if PostgreSQL container is running: `docker-compose logs postgres`

2. **Docker Build Fails**:
   - Ensure Docker is running
   - Try `docker-compose down` and `docker-compose up --build`

3. **Authentication Issues**:
   - Check JWT_SECRET is set
   - Verify database connection is working
   - Check if users table has sample data

### Logs

```bash
# View all logs
docker-compose logs

# View specific service logs
docker-compose logs postgres
docker-compose logs api
docker-compose logs admin
docker-compose logs nginx
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For questions and support, please create an issue in the repository.
