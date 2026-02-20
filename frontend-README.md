# GymSaaS Pro

A comprehensive multi-tenant Gym Management SaaS platform that automates membership tracking, subscription expiry detection, and notification reminders.

## Quick File Separation

- Backend file map: [BACKEND_FILES.md](./BACKEND_FILES.md)
- Frontend file map: [FRONTEND_FILES.md](./FRONTEND_FILES.md)

## Features

### Core Functionality
- **Multi-tenant Architecture**: Strict tenant isolation with `tenant_id` on every record
- **Role-Based Access Control**: Owner, Staff, and Member roles with granular permissions
- **Subscription Management**: Track memberships with automatic expiry calculation
- **Notification System**: Automated 5-day prior expiry reminders via Email, SMS, and Push
- **Idempotent Notifications**: Prevents duplicate reminders with tag-based tracking
- **Timezone-aware**: Proper expiry calculation based on gym timezone

### Dashboard & Analytics
- Active members count
- Expiring subscriptions (next 7 days)
- Expired members tracking
- Monthly revenue reports
- Renewal rate statistics
- Visual charts and graphs

### User Roles & Permissions

**Owner:**
- Manage members (add, edit, deactivate)
- Manage plans (create, update)
- View all reports and analytics
- Configure settings
- View audit logs

**Staff:**
- Add/Edit members
- Create subscriptions
- View dashboard

**Member:**
- View own subscription
- Receive reminders
- Renew plans

## Tech Stack

### Frontend
- React 19 + TypeScript
- Vite 7
- Tailwind CSS 3
- shadcn/ui components
- React Router DOM
- Recharts for analytics
- Lucide React icons

### Backend
- Express.js
- PostgreSQL (with pg)
- JWT Authentication
- bcryptjs for password hashing
- node-cron for scheduled tasks

## Database Schema

### Tables
- `gyms` - Gym/tenant information
- `users` - Members, staff, and owners
- `plans` - Membership plans
- `subscriptions` - Member subscriptions with expiry tracking
- `notifications` - Notification logs
- `audit_logs` - Action audit trail

## Getting Started

### Prerequisites
- Node.js 20+
- PostgreSQL 14+

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd gymsaas-pro
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your database credentials
```

4. Initialize the database:
The database tables will be automatically created when you start the server.

5. Start the development server:
```bash
# Terminal 1: Start backend
npm run server:dev

# Terminal 2: Start frontend
npm run dev
```

6. Open your browser and navigate to `http://localhost:5173`

### Demo Credentials
- Email: `owner@demo.com`
- Password: `password123`

Or register a new gym at `/register`

## API Endpoints

### Authentication
- `POST /api/gyms/register` - Register new gym
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Members
- `GET /api/members` - List all members
- `POST /api/members` - Create member
- `PUT /api/members/:id` - Update member

### Plans
- `GET /api/plans` - List all plans
- `POST /api/plans` - Create plan

### Subscriptions
- `GET /api/subscriptions` - List all subscriptions
- `POST /api/subscriptions` - Create subscription
- `GET /api/subscriptions/expiring?days=5` - Get expiring subscriptions

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics

### Notifications
- `GET /api/notifications` - List notification history

### System
- `POST /api/cron/check-expiring` - Manually trigger expiry check
- `GET /api/audit-logs` - View audit logs

## Notification System

### Expiry Logic
Every day at 00:30 (tenant timezone):
1. Check for active subscriptions expiring in exactly 5 days
2. Verify "expiry_5d" tag not in `last_notification_tags`
3. Send notifications to member and owner
4. Append tag to prevent duplicates

### Notification Priority
**Members:**
1. Push (FCM)
2. Email (SendGrid/SES)
3. SMS (Twilio/MSG91)

**Owners:**
1. Email
2. In-App Notification

### Templates
- Member Email: "Your Gym Plan Expires in 5 Days"
- Owner Email: "Member {name} plan expires on {date}"
- SMS: "Your gym plan expires on {date}. Renew now to avoid interruption."

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `JWT_SECRET` | Secret key for JWT tokens | Required |
| `PORT` | Backend server port | 3001 |
| `VITE_API_URL` | Frontend API URL | http://localhost:3001 |

## Production Deployment

### Build
```bash
npm run build
```

### Start Production Server
```bash
npm run server
```

The built frontend will be served from the `dist/` directory.

## Security Features

- Password hashing with bcrypt
- JWT authentication
- Role-based access control
- Tenant isolation on all queries
- Parameterized SQL queries
- HTTPS enforcement (production)
- Audit logging for sensitive actions

## Scalability Features

- Queue system ready for notifications
- Retry mechanism for failed notifications (3 attempts)
- Background workers via cron jobs
- Database indexing for performance
- Connection pooling with PostgreSQL

## License

MIT License - See LICENSE file for details

## Support

For support, email support@gymsaas.pro or open an issue on GitHub.
