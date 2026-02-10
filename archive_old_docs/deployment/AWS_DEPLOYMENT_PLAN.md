# 🚀 MainTMS AWS Deployment Plan

**Date**: February 7, 2026  
**Goal**: Deploy production-ready MainTMS to AWS  
**Estimated Time**: 4-6 hours  
**Estimated Cost**: $50-80/month

---

## 🏗️ DEPLOYMENT ARCHITECTURE

### **Recommended AWS Setup**:

```
┌─────────────────────────────────────────────────────┐
│                   Route 53 (DNS)                    │
│              maintms.yourdomain.com                 │
└────────────────────┬────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────┐
│           Application Load Balancer (ALB)           │
│                    Port 443 (HTTPS)                 │
│              + SSL Certificate (ACM)                │
└──────────┬─────────────────────────┬────────────────┘
           │                         │
    ┌──────▼──────┐          ┌──────▼──────┐
    │  Frontend   │          │   Backend   │
    │  ECS Task   │          │  ECS Task   │
    │ (Next.js)   │          │  (FastAPI)  │
    │  Port 3000  │          │  Port 8000  │
    └─────────────┘          └──────┬──────┘
                                    │
                            ┌───────▼────────┐
                            │   RDS PostgreSQL│
                            │   Port 5432     │
                            └────────────────┘
```

---

## 💰 COST ESTIMATE

### **Monthly Costs**:

| Service | Configuration | Cost/Month |
|---------|--------------|------------|
| **RDS PostgreSQL** | db.t3.micro (20GB) | ~$15-20 |
| **ECS Fargate** | 2 tasks (0.5 vCPU, 1GB) | ~$15-20 |
| **Application Load Balancer** | Standard | ~$16 |
| **Route 53** | Hosted zone | ~$0.50 |
| **Data Transfer** | ~50GB | ~$5 |
| **SSL Certificate (ACM)** | Free | $0 |
| **Secrets Manager** | 2 secrets | ~$1 |
| **CloudWatch Logs** | Basic monitoring | ~$2 |
| **Total** | | **$54-64/month** |

### **One-Time Costs**:
- Domain name: $12-15/year (if needed)
- Initial setup: $0 (free tier eligible for some services)

---

## 📋 PREREQUISITES

### **What You Need**:
1. ✅ AWS Account (create at aws.amazon.com)
2. ✅ AWS CLI installed
3. ✅ Domain name (or use AWS-provided domain initially)
4. ✅ Credit card for AWS billing
5. ✅ Docker images ready (we have these)

### **Optional**:
- GitHub repository for CI/CD
- Custom domain with DNS access

---

## 🎯 DEPLOYMENT OPTIONS

### **Option A: ECS Fargate (Recommended)**
**Pros**:
- Fully managed, no servers to maintain
- Auto-scaling
- Easy updates
- Good for Docker containers

**Cons**:
- Slightly higher cost than EC2
- Less control over infrastructure

**Best for**: Production deployment, hands-off management

---

### **Option B: Lightsail Containers**
**Pros**:
- Simplest AWS deployment
- Predictable pricing ($10-40/month)
- Easy to understand
- Good for startups

**Cons**:
- Less scalable
- Fewer features
- Limited to 3 containers

**Best for**: Quick deployment, learning AWS

---

### **Option C: EC2 + Docker Compose**
**Pros**:
- Full control
- Cheapest option
- Familiar (like your local setup)

**Cons**:
- You manage updates
- Manual scaling
- More maintenance

**Best for**: Budget-conscious, technical teams

---

## 🚀 RECOMMENDED: OPTION A (ECS Fargate)

Let me walk you through the complete setup:

---

## 📝 STEP-BY-STEP DEPLOYMENT GUIDE

### **Phase 1: AWS Account Setup (10 minutes)**

#### Step 1.1: Create AWS Account
1. Go to https://aws.amazon.com
2. Click "Create an AWS Account"
3. Enter email, password, account name
4. Add payment method
5. Verify identity (phone)
6. Choose Support Plan (Basic - Free)

#### Step 1.2: Install AWS CLI
```powershell
# Download AWS CLI for Windows
# https://aws.amazon.com/cli/

# Or use winget
winget install Amazon.AWSCLI

# Verify installation
aws --version
```

#### Step 1.3: Configure AWS CLI
```powershell
# Create access keys in AWS Console:
# IAM → Users → Your user → Security credentials → Create access key

# Configure AWS CLI
aws configure
# Enter:
#   AWS Access Key ID: [your key]
#   AWS Secret Access Key: [your secret]
#   Default region: us-east-2 (Ohio - cheaper than us-east-1)
#   Default output: json
```

---

### **Phase 2: Database Setup (20 minutes)**

#### Step 2.1: Create RDS PostgreSQL Instance
```powershell
# Via AWS Console:
# 1. Go to RDS → Create database
# 2. Choose PostgreSQL 15
# 3. Templates: Free tier (or Production for auto-backups)
# 4. Settings:
#    - DB instance identifier: maintms-db
#    - Master username: maintms_admin
#    - Master password: [Strong password - save this!]
# 5. Instance configuration:
#    - db.t3.micro (free tier) or db.t3.small
# 6. Storage: 20GB SSD
# 7. Connectivity:
#    - VPC: Default VPC
#    - Public access: Yes (for initial setup)
#    - Security group: Create new "maintms-db-sg"
# 8. Additional config:
#    - Initial database name: maintms
#    - Backup retention: 7 days
#    - Enable auto minor version upgrade
# 9. Create database
```

#### Step 2.2: Configure Security Group
```powershell
# Allow your IP to connect (for migration):
# EC2 → Security Groups → maintms-db-sg → Edit inbound rules
# Add rule:
#   Type: PostgreSQL
#   Port: 5432
#   Source: My IP
#   Description: Temporary admin access

# Add rule for ECS tasks (we'll update this later):
#   Type: PostgreSQL
#   Port: 5432
#   Source: [ECS security group]
```

#### Step 2.3: Test Connection
```powershell
# Get RDS endpoint from AWS Console (RDS → Databases → maintms-db → Endpoint)
# Example: maintms-db.abc123.us-east-2.rds.amazonaws.com

# Test connection (install PostgreSQL client if needed)
psql -h maintms-db.abc123.us-east-2.rds.amazonaws.com -U maintms_admin -d maintms
# Enter password when prompted
# If connected: SUCCESS!
```

---

### **Phase 3: Container Registry (15 minutes)**

#### Step 3.1: Create ECR Repositories
```powershell
# Create repository for backend
aws ecr create-repository --repository-name maintms-backend --region us-east-2

# Create repository for frontend
aws ecr create-repository --repository-name maintms-frontend --region us-east-2

# Note the repository URIs (you'll need these)
```

#### Step 3.2: Build and Push Docker Images
```powershell
cd "C:\Users\my self\.gemini\antigravity\scratch\MainTMS"

# Login to ECR
aws ecr get-login-password --region us-east-2 | docker login --username AWS --password-stdin [YOUR_AWS_ACCOUNT_ID].dkr.ecr.us-east-2.amazonaws.com

# Build backend image
cd backend
docker build -t maintms-backend .
docker tag maintms-backend:latest [YOUR_AWS_ACCOUNT_ID].dkr.ecr.us-east-2.amazonaws.com/maintms-backend:latest
docker push [YOUR_AWS_ACCOUNT_ID].dkr.ecr.us-east-2.amazonaws.com/maintms-backend:latest

# Build frontend image
cd ../frontend
docker build -t maintms-frontend .
docker tag maintms-frontend:latest [YOUR_AWS_ACCOUNT_ID].dkr.ecr.us-east-2.amazonaws.com/maintms-frontend:latest
docker push [YOUR_AWS_ACCOUNT_ID].dkr.ecr.us-east-2.amazonaws.com/maintms-frontend:latest
```

---

### **Phase 4: ECS Setup (30 minutes)**

#### Step 4.1: Create ECS Cluster
```powershell
# Via AWS Console:
# ECS → Clusters → Create cluster
# Cluster name: maintms-cluster
# Infrastructure: AWS Fargate
# Monitoring: Turn on Container Insights
# Create
```

#### Step 4.2: Create Task Definitions

**Backend Task Definition**:
```json
{
  "family": "maintms-backend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "containerDefinitions": [
    {
      "name": "backend",
      "image": "[YOUR_ECR_URI]/maintms-backend:latest",
      "portMappings": [
        {
          "containerPort": 8000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "DATABASE_URL",
          "value": "postgresql://maintms_admin:[PASSWORD]@[RDS_ENDPOINT]:5432/maintms"
        },
        {
          "name": "JWT_SECRET",
          "value": "[GENERATE_RANDOM_SECRET]"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/maintms-backend",
          "awslogs-region": "us-east-2",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

**Frontend Task Definition**:
```json
{
  "family": "maintms-frontend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "containerDefinitions": [
    {
      "name": "frontend",
      "image": "[YOUR_ECR_URI]/maintms-frontend:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NEXT_PUBLIC_API_URL",
          "value": "https://api.maintms.yourdomain.com"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/maintms-frontend",
          "awslogs-region": "us-east-2",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

#### Step 4.3: Create ECS Services
```powershell
# Create services via AWS Console:
# ECS → Clusters → maintms-cluster → Services → Create

# Backend Service:
#   Launch type: Fargate
#   Task definition: maintms-backend:latest
#   Service name: maintms-backend-service
#   Desired tasks: 1
#   Load balancer: Create new ALB
#   Target group: maintms-backend-tg (port 8000)

# Frontend Service:
#   Launch type: Fargate
#   Task definition: maintms-frontend:latest
#   Service name: maintms-frontend-service
#   Desired tasks: 1
#   Load balancer: Use existing ALB
#   Target group: maintms-frontend-tg (port 3000)
```

---

### **Phase 5: Load Balancer & DNS (30 minutes)**

#### Step 5.1: Configure Application Load Balancer
```powershell
# ALB should be auto-created with ECS service
# Or create manually:
# EC2 → Load Balancers → Create load balancer
# Application Load Balancer
# Name: maintms-alb
# Scheme: Internet-facing
# Listeners: HTTP (80), HTTPS (443)
# AZs: Select at least 2
```

#### Step 5.2: Request SSL Certificate
```powershell
# Certificate Manager → Request certificate
# Domain: maintms.yourdomain.com
# Validation: DNS (easier) or Email
# Add CNAME records to your domain DNS
# Wait for validation (~5-30 minutes)
```

#### Step 5.3: Configure Listeners
```powershell
# ALB → Listeners → Add listener
# HTTPS:443 → Forward to maintms-frontend-tg
# Add rule: If path /api/* → Forward to maintms-backend-tg

# HTTP:80 → Redirect to HTTPS:443
```

#### Step 5.4: Set up Route 53 (if using AWS DNS)
```powershell
# Route 53 → Hosted zones → Create hosted zone
# Domain: yourdomain.com
# Type: Public

# Create A record:
# Name: maintms.yourdomain.com
# Type: A - IPv4 address
# Alias: Yes
# Alias target: [Your ALB]
```

---

### **Phase 6: Database Migration (20 minutes)**

#### Step 6.1: Export Local Database
```powershell
cd "C:\Users\my self\.gemini\antigravity\scratch\MainTMS"

# Export data from local PostgreSQL
docker-compose exec db pg_dump -U main_tms main_tms > maintms_backup.sql
```

#### Step 6.2: Import to RDS
```powershell
# Import to AWS RDS
psql -h [RDS_ENDPOINT] -U maintms_admin -d maintms < maintms_backup.sql
```

#### Step 6.3: Verify Data
```powershell
# Connect to RDS
psql -h [RDS_ENDPOINT] -U maintms_admin -d maintms

# Check tables
\dt

# Check data
SELECT COUNT(*) FROM customers;
SELECT COUNT(*) FROM loads;
# Should show 155 customers, 603 loads
```

---

### **Phase 7: Testing & Verification (30 minutes)**

#### Step 7.1: Test Backend API
```powershell
# Get ALB DNS name from AWS Console
# Test backend health
curl https://[ALB_DNS]/docs

# Should return FastAPI docs page
```

#### Step 7.2: Test Frontend
```powershell
# Open in browser
https://[ALB_DNS]

# Should load MainTMS login page
# Login with admin@coxtnl.com / admin123
```

#### Step 7.3: Test Full Workflow
- [ ] Login works
- [ ] Can view customers
- [ ] Can view loads
- [ ] Can create new load
- [ ] Can add IFTA entry
- [ ] Can manage vendors
- [ ] All features working

---

### **Phase 8: Production Hardening (20 minutes)**

#### Step 8.1: Update Security Groups
```powershell
# Remove your IP from RDS security group
# Only allow ECS tasks to connect to RDS
```

#### Step 8.2: Set up Backups
```powershell
# RDS automated backups (already enabled)
# Consider AWS Backup for complete solution
```

#### Step 8.3: Set up Monitoring
```powershell
# CloudWatch Alarms:
# - High CPU on ECS tasks
# - High memory on ECS tasks
# - RDS storage full
# - ALB 5xx errors
```

#### Step 8.4: Enable Auto-scaling (Optional)
```powershell
# ECS Service → Auto-scaling
# Target tracking: CPU 70%
# Min tasks: 1
# Max tasks: 3
```

---

## 🎯 QUICK START: I'LL HELP YOU

I can guide you through each step with specific commands for your setup.

**What do you have ready?**
1. Do you have an AWS account?
2. Do you have a domain name?
3. Do you have AWS CLI installed?

**OR should I:**
1. Start with Step 1 (AWS account setup)
2. Use a simpler option (Lightsail)
3. Create a terraform/automation script

---

## 📊 TIMELINE

| Phase | Time | Cumulative |
|-------|------|------------|
| AWS Account Setup | 10 min | 10 min |
| Database Setup | 20 min | 30 min |
| Container Registry | 15 min | 45 min |
| ECS Setup | 30 min | 1h 15m |
| Load Balancer & DNS | 30 min | 1h 45m |
| Database Migration | 20 min | 2h 5m |
| Testing | 30 min | 2h 35m |
| Hardening | 20 min | **~3 hours total** |

**With breaks and troubleshooting**: 4-6 hours

---

## 💡 MY RECOMMENDATION

**Start with Lightsail** (simpler, faster):
- 1 hour setup time
- $20-30/month
- Easier to understand
- Can migrate to ECS later

**OR use ECS** (production-grade):
- 3-4 hours setup
- $50-60/month
- More scalable
- Better for long-term

**Which would you prefer?**

---

**Ready to deploy?** Let me know:
1. Your AWS account status
2. Whether you have a domain
3. Your preferred deployment option
4. And I'll guide you step-by-step!
