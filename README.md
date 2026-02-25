# Swami Rupeshwaranand Website

A full-stack spiritual website with multilingual support, OTP-based authentication, and AWS cloud deployment.

## 🏗️ Project Structure

```
SwamiRupeshwaranandNew/
├── backend/          # NestJS API server
├── frontend/         # Next.js web application
└── README.md         # This file
```

---

## 🔧 Backend Architecture

### Technology Stack
- **Framework:** NestJS 10.3.0
- **Runtime:** Node.js 18.x
- **Language:** TypeScript
- **Database:** 
  - MongoDB (local development)
  - DynamoDB (AWS production)
- **Authentication:** JWT with OTP via email
- **Email Service:** AWS SES
- **Deployment:** AWS Lambda + API Gateway (Serverless Framework)

### Module Structure
```
backend/src/
├── app.module.ts                 # Root module
├── main.ts                       # Local server entry
├── lambda.ts                     # AWS Lambda handler
├── common/
│   ├── cognito/                  # AWS Cognito integration
│   ├── database/                 # Database abstraction layer
│   │   ├── database.interface.ts
│   │   ├── dynamodb.database.service.ts
│   │   └── mongodb.database.service.ts
│   ├── decorators/               # Custom decorators
│   ├── dynamodb/                 # DynamoDB service
│   ├── email/                    # Email service (SES)
│   └── guards/                   # Auth guards
└── modules/
    ├── auth/                     # Authentication (OTP + Password)
    ├── content/                  # CMS content
    ├── events/                   # Events management
    ├── health/                   # Health check endpoint
    ├── teachings/                # Teachings content
    └── users/                    # User management
```

### Key Features
- **OTP Authentication:** Email-based OTP for login
- **Password Support:** Users can set password after OTP verification
- **Forgot Password:** Reset password via email OTP
- **Dual Database:** Automatic switching between MongoDB (local) and DynamoDB (AWS)
- **Swagger Docs:** Auto-generated API documentation

### API Endpoints
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/health` | GET | Health check |
| `/api/v1/otp-auth/request-otp` | POST | Request OTP |
| `/api/v1/otp-auth/verify-otp` | POST | Verify OTP |
| `/api/v1/otp-auth/set-password` | POST | Set password |
| `/api/v1/otp-auth/login-password` | POST | Login with password |
| `/api/v1/otp-auth/forgot-password` | POST | Request password reset |
| `/api/v1/otp-auth/reset-password` | POST | Reset password |
| `/docs` | GET | Swagger documentation |

---

## 🎨 Frontend Architecture

### Technology Stack
- **Framework:** Next.js 16.1.0 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS 4.x
- **State Management:** Redux Toolkit
- **Data Fetching:** TanStack Query (React Query)
- **Internationalization:** Custom i18n (English/Hindi)
- **Deployment:** AWS Amplify (Static Export)

### Directory Structure
```
frontend/src/
├── app/
│   ├── [locale]/                 # Locale-based routing
│   │   ├── (home)/               # Home page components
│   │   ├── ashram/               # Ashram page
│   │   ├── contact/              # Contact page
│   │   ├── dashboard/            # User dashboard (protected)
│   │   ├── donation/             # Donation page
│   │   ├── events/               # Events page
│   │   ├── gurukul/              # Gurukul initiative
│   │   ├── login/                # Login page
│   │   ├── services/             # Services page
│   │   ├── swamiji/              # About Swamiji
│   │   └── teachings/            # Teachings pages
│   ├── globals.css               # Global styles
│   ├── providers.tsx             # Redux/Query providers
│   ├── robots.ts                 # SEO robots
│   └── sitemap.ts                # SEO sitemap
├── components/
│   ├── auth/                     # Authentication components
│   │   ├── LoginForm.tsx
│   │   ├── OtpVerificationForm.tsx
│   │   ├── SetPasswordForm.tsx
│   │   └── ForgotPasswordForm.tsx
│   ├── layout/                   # Layout components
│   └── ui/                       # Reusable UI components
├── lib/
│   ├── api.ts                    # API client
│   ├── authSlice.ts              # Auth Redux slice
│   ├── store.ts                  # Redux store
│   └── useAuth.ts                # Auth hook
├── i18n/                         # Internationalization
├── locales/                      # Translation files
│   ├── en/common.json
│   └── hi/common.json
└── content/                      # Static content
```

### Key Features
- **Multilingual:** English and Hindi support
- **Theme Switcher:** Multiple sacred color themes
- **Responsive Design:** Mobile-first approach
- **SEO Optimized:** Meta tags, sitemap, robots.txt
- **OTP Authentication:** Complete auth flow
- **User Dashboard:** Protected route for logged-in users

---

## 🚀 Local Development

### Prerequisites
- Node.js 18.x or higher
- npm or yarn
- MongoDB (for local backend) or Docker
- AWS CLI (for deployment)

### Backend Setup

```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Configure .env with your values:
# - MONGODB_URI (for local)
# - JWT_SECRET
# - AWS credentials (for SES email)

# Start MongoDB (using Docker)
docker-compose up -d

# Run in development mode
npm run start:dev
```

Backend runs at: `http://localhost:2026`
Swagger docs at: `http://localhost:2026/docs`

### Frontend Setup

```bash
# Navigate to frontend
cd frontend

# Install dependencies
yarn install
# or
npm install

# Copy environment file
cp .env.example .env.local

# Configure .env.local:
# NEXT_PUBLIC_API_URL=http://localhost:2026/api/v1

# Run in development mode
npm run dev
```

Frontend runs at: `http://localhost:3040`

### Running Both Together

```bash
# Terminal 1 - Backend
cd backend && npm run start:dev

# Terminal 2 - Frontend
cd frontend && npm run dev
```

---

## ✅ Running Tests

### Backend Tests (38 tests)
```bash
cd backend
npm run test
```

### Frontend Tests (43 tests)
```bash
cd frontend
npm run test
```

### Total: 81 tests passing

---

## 🌐 Production Deployments

### Backend (AWS Lambda)
- **AWS Account:** `525945693241` (SwamiJi profile)
- **Region:** `ap-south-1` (Mumbai)
- **URL:** `https://n4vi400a5e.execute-api.ap-south-1.amazonaws.com/prod/api/v1`
- **Swagger:** `https://n4vi400a5e.execute-api.ap-south-1.amazonaws.com/prod/docs`

```bash
# Deploy backend
cd backend
npm run build
npx serverless deploy --stage prod --aws-profile SwamiJi
```

### Frontend (AWS Amplify)
- **URL:** _(Set after Amplify app is created in SwamiJi account)_
- **App Root:** `frontend`
- **Branch:** `main`

Amplify auto-deploys from the `main` branch using `amplify.yml` configuration.

### Key Resources
| Resource | Identifier |
|----------|------------|
| Cognito User Pool | `ap-south-1_bpTAiYPEl` |
| Cognito Client ID | `3mor1uulompisag9rhjlpi1d6s` |
| S3 Content Bucket | `swami-rupeshwaranand-api-prod-content` |
| DynamoDB Main Table | `swami-rupeshwaranand-api-prod-main` |
| DynamoDB OTP Table | `swami-rupeshwaranand-api-prod-otp` |
| SES From Email | `ashramseva2727@gmail.com` |

---

## 🔒 Security

### Environment Variables (Not Committed)
All sensitive data is stored in environment files which are **NOT** committed to the repository:

| File | Location | Purpose |
|------|----------|---------|
| `.env` | backend/ | Backend secrets |
| `.env.local` | frontend/ | Frontend config |

### Required Backend Secrets
```env
# Database
MONGODB_URI=mongodb://localhost:27017/swami-db
USE_DYNAMODB=false  # Set to 'true' for AWS

# Authentication
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRY=7d

# AWS (for SES email)
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
SES_FROM_EMAIL=noreply@yourdomain.com

# DynamoDB (production)
DYNAMODB_TABLE_PREFIX=swami-prod
```

### Required Frontend Config
```env
NEXT_PUBLIC_API_URL=http://localhost:2026/api/v1
NEXT_PUBLIC_SITE_URL=http://localhost:3040
```

### What's in .gitignore
- `node_modules/`
- `.env`, `.env.local`, `.env.*`
- `dist/`, `.next/`, `build/`
- `.serverless/`
- IDE files (`.idea/`, `.vscode/`)
- OS files (`.DS_Store`)
- Coverage reports
- Deployment artifacts

---

## 📱 Accessing the Frontend

### Local Development
1. Start the backend: `cd backend && npm run start:dev`
2. Start the frontend: `cd frontend && npm run dev`
3. Open browser: `http://localhost:3040`

### Production
- **English:** `https://main.d1ojg9qcpef6jk.amplifyapp.com/en`
- **Hindi:** `https://main.d1ojg9qcpef6jk.amplifyapp.com/hi`

### Available Routes
| Route | Description |
|-------|-------------|
| `/en` or `/hi` | Home page |
| `/en/swamiji` | About Swamiji |
| `/en/ashram` | Ashram information |
| `/en/services` | Poojan services |
| `/en/events` | Upcoming events |
| `/en/teachings` | Spiritual teachings |
| `/en/gurukul` | Gurukul initiative |
| `/en/donation` | Donation page |
| `/en/contact` | Contact page |
| `/en/login` | Login page |
| `/en/dashboard` | User dashboard (protected) |

---

## 🧪 Authentication Flow

1. **Request OTP:** User enters email → OTP sent via AWS SES
2. **Verify OTP:** User enters 6-digit OTP → JWT token issued
3. **Set Password:** First-time users can set a password
4. **Login Options:** 
   - Login with OTP (always available)
   - Login with password (if set)
5. **Forgot Password:** Reset via email OTP

---

## 📄 License

Private repository - All rights reserved.

---

## 👨‍💻 Development Team

Built with ❤️ for Swami Rupeshwaranand Ji
