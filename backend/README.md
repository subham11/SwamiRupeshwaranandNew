# Swami Rupeshwaranand Backend API

AWS Lambda-based NestJS backend with dual database support: MongoDB for local development and DynamoDB for production.

## 🏗️ Architecture

- **Runtime**: Node.js 20.x on AWS Lambda (ARM64)
- **Framework**: NestJS
- **Database**: 
  - **Local**: MongoDB (easier development, no AWS setup required)
  - **Production**: DynamoDB (serverless, cost-optimized)
- **Authentication**: AWS Cognito
- **API Gateway**: AWS API Gateway HTTP API
- **Local Development**: Serverless Offline + MongoDB

## 🔄 Database Abstraction

The backend uses a database abstraction layer that automatically switches:
- **Development** (`NODE_ENV=development`): Uses MongoDB
- **Production** (`NODE_ENV=production`): Uses DynamoDB

This allows for:
- ✅ Easy local development without AWS credentials
- ✅ No cost for local testing
- ✅ Same codebase for both environments
- ✅ Cost-optimized production with DynamoDB

## 💰 Cost Optimization Features

This backend is optimized to stay within AWS Free Tier limits:

| Service | Free Tier Limit | Optimization |
|---------|----------------|--------------|
| Lambda | 1M requests/month, 400K GB-sec | 128MB ARM64, 10s timeout |
| API Gateway | 1M calls/month (12 months) | HTTP API (cheaper than REST) |
| DynamoDB | 25GB storage, 25 RCU/WCU | On-demand billing, TTL enabled |
| Cognito | 50,000 MAU | Standard user pool |

### Key Optimizations:
- ✅ ARM64 architecture (20% cheaper than x86)
- ✅ Minimum memory (128MB)
- ✅ Reserved concurrency limit (10) to prevent cost spikes
- ✅ Single Lambda for all routes (reduces cold starts)
- ✅ DynamoDB On-Demand (pay per request)
- ✅ TTL for automatic data cleanup
- ✅ Optional warmup (only for production)

## 📦 Project Structure

```
backend/
├── src/
│   ├── common/              # Shared modules
│   │   ├── cognito/         # Cognito service
│   │   ├── database/        # Database abstraction (MongoDB + DynamoDB)
│   │   ├── decorators/      # Custom decorators
│   │   └── guards/          # Auth guards
│   ├── modules/             # Feature modules
│   │   ├── auth/            # Authentication
│   │   ├── content/         # Content management
│   │   ├── events/          # Events management
│   │   ├── health/          # Health checks
│   │   ├── teachings/       # Teachings management
│   │   └── users/           # User management
│   ├── app.module.ts        # Root module
│   ├── lambda.ts            # Lambda handler
│   └── main.ts              # Local development entry
├── scripts/                 # Utility scripts
├── docker-compose.yml       # MongoDB + optional DynamoDB
├── serverless.yml           # Serverless Framework config
└── package.json
```

## 🚀 Getting Started

### Prerequisites

- Node.js 20.x
- Docker (for local DynamoDB)
- AWS CLI configured (for deployment)
- Serverless Framework CLI

### Installation

```bash
cd backend
npm install
```

### Local Development

1. **Start MongoDB**:
```bash
docker-compose up -d
```

2. **Create environment file** (already created with MongoDB URI):
```bash
# .env.local is already configured with:
# MONGODB_URI=mongodb://localhost:27017/
# USE_MONGODB=true
```

3. **Start the server**:

   **Option A - Serverless Offline** (simulates Lambda):
   ```bash
   npm run start:offline
   ```

   **Option B - NestJS Dev Server** (faster reload):
   ```bash
   npm run start:dev
   ```

4. **Access the API**:
   - API: http://localhost:3001/api/v1
   - Swagger Docs: http://localhost:3001/docs
   - MongoDB Admin: http://localhost:8081

### Using DynamoDB Locally (Optional)

If you want to test with DynamoDB locally instead of MongoDB:

```bash
# Start DynamoDB Local
docker-compose --profile dynamodb up -d

# Create table
./scripts/create-local-table.sh

# Update .env.local
# Set USE_MONGODB=false or remove MONGODB_URI
```

## 📚 API Documentation

Swagger documentation is available at `/docs` endpoint.

### Available Endpoints

| Module | Endpoint | Description |
|--------|----------|-------------|
| Health | `GET /api/v1/health` | Health check |
| Auth | `POST /api/v1/auth/login` | User login |
| Auth | `POST /api/v1/auth/refresh` | Refresh token |
| Users | `GET /api/v1/users` | List users (protected) |
| Users | `GET /api/v1/users/me` | Get current user (protected) |
| Content | `GET /api/v1/content` | List content |
| Content | `GET /api/v1/content/slug/:slug` | Get by slug |
| Events | `GET /api/v1/events` | List events |
| Events | `GET /api/v1/events?upcoming=true` | Upcoming events |
| Teachings | `GET /api/v1/teachings` | List teachings |
| Teachings | `GET /api/v1/teachings/:slug` | Get by slug |

## 🔐 Authentication

The API uses AWS Cognito for authentication. Protected endpoints require a Bearer token:

```bash
curl -H "Authorization: Bearer <token>" http://localhost:3001/api/v1/users/me
```

## 🚢 Deployment

### Deploy to AWS

1. **Configure AWS credentials**:
```bash
aws configure
```

2. **Set environment variables** (or use AWS SSM/Secrets Manager):
```bash
export COGNITO_USER_POOL_ID=your-pool-id
export COGNITO_CLIENT_ID=your-client-id
```

3. **Deploy**:
```bash
# Development
npm run deploy:dev

# Production
npm run deploy
```

4. **View deployment info**:
```bash
sls info --stage prod
```

### Remove deployment

```bash
npm run remove
```

## 🗄️ DynamoDB Single Table Design

The API uses a single table design with composite keys:

| Entity | PK | SK | GSI1PK | GSI1SK |
|--------|----|----|--------|--------|
| User | USER#id | USER#id | USER | EMAIL#email |
| Content | CONTENT#id | CONTENT#locale | CONTENT#type | locale#slug |
| Event | EVENT#id | EVENT#locale | EVENT | DATE#startDate |
| Teaching | TEACHING#id | TEACHING#locale | TEACHING#category | locale#slug |

## 🧪 Testing

```bash
# Unit tests
npm test

# Watch mode
npm run test:watch

# Coverage
npm run test:cov

# E2E tests
npm run test:e2e
```

## 📊 Monitoring

For production monitoring, consider:
- CloudWatch Logs (included)
- CloudWatch Metrics
- X-Ray tracing (add @aws-sdk/client-xray)

## 🔧 Troubleshooting

### MongoDB Local Issues
```bash
# Reset MongoDB
docker-compose down -v
docker-compose up -d
```

### DynamoDB Local Issues
```bash
# Reset DynamoDB Local
docker-compose --profile dynamodb down -v
docker-compose --profile dynamodbocal Issues
```bash
# Reset DynamoDB Local
docker-compose down -v
docker-compose up -d
./scripts/create-local-table.sh
```

### Lambda Timeout
- Default is 10s, increase in serverless.yml if needed
- Check CloudWatch logs for details

## 📝 License

MIT
