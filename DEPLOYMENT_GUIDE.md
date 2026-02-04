# 🚀 MAIN TMS - Production Deployment Guide

**Deploy MAIN TMS to production servers**

---

## 📋 Pre-Deployment Checklist

- [ ] Domain name purchased and DNS configured
- [ ] SSL certificate ready (or Let's Encrypt)
- [ ] Server provisioned (4GB+ RAM recommended)
- [ ] PostgreSQL database ready
- [ ] Environment variables configured
- [ ] Backup strategy planned

---

## 🌐 Deployment Options

### Option 1: AWS (Recommended for Scale)
### Option 2: DigitalOcean (Easiest)
### Option 3: Azure
### Option 4: Google Cloud
### Option 5: Your Own Server

---

## 🔷 AWS Deployment

### Step 1: Provision Resources

**EC2 Instance:**
- AMI: Ubuntu 22.04 LTS
- Instance Type: t3.medium (2 vCPU, 4GB RAM)
- Storage: 30GB EBS
- Security Group: Allow 22, 80, 443

**RDS Database:**
- Engine: PostgreSQL 15
- Instance: db.t3.micro
- Storage: 20GB
- Multi-AZ: No (for dev), Yes (for production)

### Step 2: Configure Server
```bash
# SSH into EC2
ssh -i your-key.pem ubuntu@your-ec2-ip

# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker ubuntu

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Logout and login again
exit
```

### Step 3: Deploy Application
```bash
# Clone/upload your code
git clone <your-repo> main-tms
cd main-tms

# Configure environment
cp .env.example .env
nano .env  # Edit with production values

# Start services
docker-compose -f docker-compose.prod.yml up -d

# Check status
docker-compose ps
docker-compose logs -f
```

### Step 4: Configure Nginx & SSL
```bash
# Install Nginx
sudo apt install nginx

# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com

# Configure Nginx (see nginx config below)
sudo nano /etc/nginx/sites-available/main-tms
```

---

## 💧 DigitalOcean Deployment (Easiest)

### Step 1: Create Droplet
- Choose Ubuntu 22.04
- Select size: Basic (4GB RAM/$24/month)
- Add SSH key
- Enable backups (recommended)

### Step 2: Configure Droplet
```bash
ssh root@your-droplet-ip

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Upload your code
git clone <your-repo> main-tms
cd main-tms

# Configure
cp .env.example .env
nano .env

# Deploy
docker-compose up -d
```

### Step 3: Point Domain
- In DigitalOcean, go to Networking
- Add A record: @ → your-droplet-ip
- Add A record: www → your-droplet-ip

### Step 4: SSL with Let's Encrypt
```bash
# Install Certbot
apt install certbot python3-certbot-nginx

# Get certificate
certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

---

## 🔧 Nginx Configuration

Create `/etc/nginx/sites-available/main-tms`:

```nginx
# HTTP - redirect to HTTPS
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS
server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Frontend
    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:8000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket
    location /ws {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/main-tms /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 📊 Database Setup (Production)

### Option 1: Managed Database (Recommended)
- **AWS RDS**: PostgreSQL managed service
- **DigitalOcean Managed Databases**: Easy setup
- **Azure Database**: PostgreSQL service
- **Google Cloud SQL**: PostgreSQL

### Option 2: Self-Hosted
```bash
# Install PostgreSQL
sudo apt install postgresql postgresql-contrib

# Create database
sudo -u postgres createdb main_tms
sudo -u postgres createuser main_tms
sudo -u postgres psql
postgres=# ALTER USER main_tms WITH PASSWORD 'secure_password';
postgres=# GRANT ALL PRIVILEGES ON DATABASE main_tms TO main_tms;
postgres=# \q
```

---

## 🔐 Security Best Practices

### 1. Firewall Configuration
```bash
# UFW (Ubuntu)
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### 2. Secure Environment Variables
- Never commit `.env` to git
- Use secrets manager (AWS Secrets Manager, etc.)
- Rotate credentials regularly

### 3. Database Security
- Use strong passwords
- Enable SSL connections
- Restrict access by IP
- Regular backups

### 4. Application Security
- Keep dependencies updated
- Enable rate limiting
- Set up monitoring
- Configure CORS properly

---

## 📦 Backup Strategy

### Automated Database Backups
```bash
# Create backup script
cat > /root/backup-db.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/root/backups"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

docker exec main-tms-db pg_dump -U main_tms main_tms > $BACKUP_DIR/main_tms_$DATE.sql
gzip $BACKUP_DIR/main_tms_$DATE.sql

# Keep only last 30 days
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete
EOF

chmod +x /root/backup-db.sh

# Schedule with cron
crontab -e
# Add: 0 2 * * * /root/backup-db.sh
```

### Upload to S3 (AWS)
```bash
# Install AWS CLI
apt install awscli

# Configure
aws configure

# Add to backup script
aws s3 cp $BACKUP_DIR/main_tms_$DATE.sql.gz s3://your-bucket/backups/
```

---

## 📈 Monitoring

### 1. Application Monitoring
```bash
# Check container health
docker-compose ps

# View logs
docker-compose logs -f

# Resource usage
docker stats
```

### 2. Uptime Monitoring
Services:
- **UptimeRobot** (free, simple)
- **Pingdom** (advanced features)
- **StatusCake** (free tier available)

### 3. Error Tracking
- **Sentry** (recommended)
- **Rollbar**
- **Bugsnag**

### 4. Performance Monitoring
- **New Relic**
- **DataDog**
- **AWS CloudWatch**

---

## 🔄 Updates & Maintenance

### Deploying Updates
```bash
cd main-tms

# Pull latest code
git pull

# Rebuild and restart
docker-compose down
docker-compose up -d --build

# Run migrations
docker exec main-tms-backend alembic upgrade head
```

### Zero-Downtime Deployment
Use:
- **Blue-Green Deployment**
- **Rolling Updates**
- **Load Balancer** with multiple instances

---

## 📊 Scaling

### Horizontal Scaling
```yaml
# docker-compose.prod.yml
services:
  backend:
    deploy:
      replicas: 3
    # ... rest of config
```

### Load Balancer
- **AWS ELB/ALB**
- **DigitalOcean Load Balancer**
- **Nginx** (manual setup)
- **HAProxy**

### Database Scaling
- Read replicas
- Connection pooling (PgBouncer)
- Caching (Redis)

---

## ✅ Post-Deployment Checklist

- [ ] Application accessible via HTTPS
- [ ] Database migrations completed
- [ ] Admin user created
- [ ] Backups configured and tested
- [ ] Monitoring enabled
- [ ] DNS properly configured
- [ ] SSL certificate valid
- [ ] Firewall configured
- [ ] Error tracking enabled
- [ ] Performance acceptable
- [ ] Mobile PWA installable
- [ ] Team trained on system

---

## 🆘 Troubleshooting

### Application won't start
```bash
docker-compose logs
docker-compose ps
docker system prune -a  # Clean up
```

### Database connection fails
- Check DATABASE_URL in .env
- Verify PostgreSQL is running
- Check firewall rules
- Test connection: `psql $DATABASE_URL`

### SSL issues
```bash
# Renew certificate
certbot renew

# Test Nginx config
nginx -t

# Check certificate expiry
certbot certificates
```

---

## 📞 Support

For deployment issues:
1. Check logs: `docker-compose logs -f`
2. Review this guide
3. Check `IMPLEMENTATION_ROADMAP.md`
4. Check Docker status: `docker-compose ps`

---

**Ready for Production! 🚀**
