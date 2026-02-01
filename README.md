# Sync Up

A production ready, multi-tenant collaborative project management backend system with role based access control, real time features.

## ✨ Features

- **🏢 Multi-tenant Architecture** - Complete workspace isolation. Each team has their own separate workspace.
- **🔐 Role-Based Access Control** - Three roles ( Owner, Admin, Member ) with granular permissions.
- **📊 Project Management** - Create and manage projects with public / private visibility.
- **📝 Task Management** - Assign task to project members and track status through workflow.
- **👥 Collaboration** - Invite members, manage roles, track who did what.
- **🔒 Security First** - JWT authentication, password hashing, rate limiting, input validation.
- **⚡ Optimized Queries** - Database transactions, proper indexing, lean queries.
- **📧 Email Integration** - Password reset, email verification with resend.
- **🛡️ Enterprise Grade** - Transaction support, cascade prevention, proper error handling.

## Quick Start

### Prerequisites

- Node.js 18 or higher
- Mongodb Atlas
- Pnpm latest

### Installation

``` bash
# Clone the repository 
git clone https://github.com/majidali129/sync-up.git
cd sync-up

# Install dependencies
pnpm install

# Setup environment variables
cp .env.example .env
```

**Edit `.env` with your database url:**

```env
PORT=8000
NODE_ENV=development
DATABASE_URI=
ACCESS_TOKEN_SECRET=
REFRESH_TOKEN_SECRET=
ACCESS_TOKEN_EXPIRY=
REFRESH_TOKEN_EXPIRY=
SECRET_KEY=
DB_NAME=
APP_NAME=
ALLOWED_ORIGINS=
RESEND_API_KEY=
EMAIL_FROM=
FRONTEND_URL=


DEFAULT_RESPONSE_LIMIT=
DEFAULT_RESPONSE_OFFSET=


CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

### Running Locally

```bash
# Dev server ( with auto reload )
pnpm run dev

# Build Typescript
pnpm run build

# Production server
pnpm start
```

Server runs at: `http://localhost:8000`

### First API Call

**1. Create an account:**

```bash
curl -X POST http://localhost:8000/auth/sign-up \
    -H "Content-Type: application/json" \
    -d `{
        "username": "test_user",
        "email": "test_email@gmail.com",
        "fullName": "Test User",
        "password": "SecurePass123"
    }`
```

**2. Sign in:**

```bash
curl -X POST http://localhost:8000/auth/sign-in \
    -H "Content-Type: application/json" \
    -d `{
        "email": "test_email@gmail.com",
        "password": "SecurePass123"
    }`
```

**3. Create a workspace:**

```bash
curl -X POST http://localhost:8000/api/workspaces \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Team Workspace",
    "description": "Where we manage projects",
    "icon": "🚀"
  }'
```

## 🎭 Role-Based System

### Owner

- Full control of workspace
- create/delete workspace
- Invite/remove members
- Manage any project
- Assign any task to anyone
- View all data

### Admin

- Create projects
- Manage own projects
- Add/remove members from own projects
- Create tasks
- Assign tasks ( except to owners )
- Cannot manage workspace

### Member

- See public projects
- Create personal tasks
- Update own / assigned tasks
- Cannot create projects
- Cannot assign tasks

## 🏗️ Tech Stack

| Layer | Technology |
| ------- | ------------ |
| **Runtime** | Node.js |
| **Language** | Typescript |
| **Framework** | Express.js |
| **Database** | MongoDB |
| **Auth** | JWT ( jose ) |
| **Password** | Bcrypt |
| **Validation** | Zod |
| **Email** | Resend |
| **Security** | Helmet |
| **Rate Limit** | Express-rate-limit |

## 📊 System Architecture

```text
                Client ( Frontend )
                        ↓ HTTP + JWT
                API Server ( Express )
                        ↓
        Authentication Middleware ( JWT verification )
                        ↓
        Workspace Membership Middleware ( Role check )
                        ↓
            Authorization Check ( Permissions )
                        ↓
            Business Logic ( Services )
                        ↓
                MongoDB Database
```

## 💾 Database Models

- **User** - User accounts with authentication
- **Workspace** - Team workspace container
- **WorkspaceMember** - User-workspace relationship with roles
- **Project** - Projects within workspace
- **Task** - Tasks within projects
- **WorkspaceInvites** - Invite management with tokens

## 🧪 Testing

```bash
# Run tests (when available)
pnpm test

# Run with coverage
pnpm test:coverage
```

## 👤 Author **Majid Ali**

- Github: [@majidali129](https://github.com/majidali129)
- Email: <majidaliofficial129@gmail.com>
- Portfolio: majidali.dev

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/majidali129/sync-up/issues)
- **Email**: <majidaliofficial129@gmail.com>
- **Documentation**: [Full Docs](docs/)
**Made with 💛 by Majid Ali**
