# 🚀 Deployment Guide

Complete guide to deploy ODC Cyber Learning Hub to production.

## Table of Contents
1. [Vercel Deployment](#vercel-deployment)
2. [GitHub Pages Deployment](#github-pages-deployment)
3. [Heroku Deployment](#heroku-deployment)
4. [Environment Variables](#environment-variables)
5. [Domain Setup](#domain-setup)
6. [SSL Certificate](#ssl-certificate)
7. [Performance Optimization](#performance-optimization)
8. [Monitoring](#monitoring)

## Vercel Deployment (Recommended)

### Step 1: Create Vercel Account
1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub
3. Authorize Vercel access to your GitHub account

### Step 2: Import Project
1. Click "New Project"
2. Select `odc-cyber-learning-hub` repository
3. Configure project:
   - Framework: Node.js
   - Root Directory: ./
   - Build Command: `npm run build`
   - Output Directory: (leave empty)

### Step 3: Set Environment Variables
In Vercel dashboard, go to Settings → Environment Variables and add:

```
MONGODB_URI = your_mongodb_connection_string
JWT_SECRET = your_secret_key
SMTP_USER = your_email@gmail.com
SMTP_PASSWORD = your_app_password
SMTP_HOST = smtp.gmail.com
CORS_ORIGIN = https://yourdomain.com
NODE_ENV = production
```

### Step 4: Deploy
1. Click "Deploy"
2. Wait for build to complete
3. Your app is live at: `https://odc-cyber-learning-hub.vercel.app`

### Step 5: Custom Domain (Optional)
1. Go to Settings → Domains
2. Add your custom domain
3. Update DNS records:
   - Type: CNAME
   - Name: www
   - Value: cname.vercel.com

## GitHub Pages Deployment (Frontend Only)

### Step 1: Create gh-pages Branch
```bash
git checkout -b gh-pages
```

### Step 2: Build Project
```bash
npm run build
```

### Step 3: Deploy
```bash
# Using gh-pages package
npm install --save-dev gh-pages

# Add to package.json scripts:
"deploy": "gh-pages -d dist"

# Deploy
npm run deploy
```

### Step 4: Enable in GitHub
1. Go to repository Settings
2. Pages section
3. Source: gh-pages branch
4. Your site is live at: `https://codefather-cmd.github.io/odc-cyber-learning-hub`

## Heroku Deployment

### Step 1: Install Heroku CLI
```bash
# macOS
brew tap heroku/brew && brew install heroku

# Windows
# Download from heroku.com/download

# Linux
curl https://cli-assets.heroku.com/install.sh | sh
```

### Step 2: Login to Heroku
```bash
heroku login
```

### Step 3: Create Heroku App
```bash
heroku create odc-learning-hub
```

### Step 4: Set Environment Variables
```bash
heroku config:set MONGODB_URI=your_connection_string
heroku config:set JWT_SECRET=your_secret_key
heroku config:set SMTP_USER=your_email
heroku config:set SMTP_PASSWORD=your_password
heroku config:set NODE_ENV=production
```

### Step 5: Deploy
```bash
git push heroku main
```

### Step 6: View Logs
```bash
heroku logs --tail
```

## Environment Variables

### Required Variables
```
PORT                   - Server port (default: 3000)
NODE_ENV              - development | production
MONGODB_URI           - MongoDB connection string
JWT_SECRET            - Secret for JWT tokens (min 32 chars)
CORS_ORIGIN           - Allowed origins (comma-separated)
```

### Optional Variables
```
SMTP_HOST             - Email service host
SMTP_PORT             - Email service port
SMTP_USER             - Email username
SMTP_PASSWORD         - Email password
SMTP_FROM             - From address for emails
AWS_ACCESS_KEY_ID     - AWS access key
AWS_SECRET_ACCESS_KEY - AWS secret key
AWS_S3_BUCKET         - S3 bucket name
STRIPE_PUBLIC_KEY     - Stripe public key
STRIPE_SECRET_KEY     - Stripe secret key
```

## Domain Setup

### Using Vercel Domains
1. Dashboard → Settings → Domains
2. Add domain (buy through Vercel or connect existing)
3. Follow DNS setup instructions

### Using Custom Registrar
1. Get your Vercel nameservers or CNAME
2. Update in domain registrar:
   - Nameservers: ns1.vercel.com, ns2.vercel.com
   - OR CNAME: cname.vercel.com
3. Wait 24-48 hours for DNS propagation
4. Verify in Vercel dashboard

### Check DNS
```bash
# Verify DNS propagation
nslookup yourdomain.com

# Check specific records
dig yourdomain.com
```

## SSL Certificate

### Automatic (Recommended)
- Vercel automatically provides SSL via Let's Encrypt
- Free for all Vercel projects
- Auto-renews before expiration

### Manual Setup
If using custom server:
```bash
# Using certbot (Let's Encrypt)
sudo apt-get install certbot
sudo certbot certonly --standalone -d yourdomain.com

# Certificates saved to /etc/letsencrypt/live/
```

## Performance Optimization

### Enable Gzip Compression
In `server.js`:
```javascript
const compression = require('compression');
app.use(compression());
```

### Enable Caching Headers
```javascript
app.use((req, res, next) => {
    res.set('Cache-Control', 'public, max-age=3600');
    next();
});
```

### Minify Assets
```bash
# CSS minification
npm install -g csso-cli
csso input.css -o output.min.css

# JavaScript minification
npm install -g terser
terser input.js -o output.min.js
```

### Image Optimization
```bash
# Install image optimizer
npm install -g imagemin-cli imagemin-mozjpeg imagemin-pngquant

# Optimize images
imagemin img/*.jpg --out-dir=img --plugin=mozjpeg
imagemin img/*.png --out-dir=img --plugin=pngquant
```

### Content Delivery Network (CDN)
- Vercel has built-in global CDN
- Enable Cloudflare for additional optimization:
  1. Sign up at cloudflare.com
  2. Add your domain
  3. Update nameservers
  4. Enable caching rules

## Monitoring

### Vercel Analytics
1. Dashboard → Analytics
2. Monitor:
   - Response times
   - Status codes
   - Traffic patterns
   - Error rates

### Error Tracking (Sentry)
```bash
npm install @sentry/node @sentry/tracing
```

In `server.js`:
```javascript
const Sentry = require("@sentry/node");

Sentry.init({ dsn: process.env.SENTRY_DSN });
app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.errorHandler());
```

### Uptime Monitoring
- Use Uptime Robot (free)
- Pingdom
- Datadog
- New Relic

### Server Logs
```bash
# View Vercel logs
vercel logs

# View Heroku logs
heroku logs --tail

# View GitHub Actions logs
# In repository → Actions tab
```

## Backup Strategy

### Database Backup
```bash
# MongoDB Atlas automatic backups
# Dashboard → Backup → Restore

# Manual backup
mongobackup --uri $MONGODB_URI --archive=backup.archive
```

### Code Backup
- GitHub is your code backup
- Enable branch protection
- Regular local backups

## Security Checklist

- [ ] SSL/TLS enabled
- [ ] Environment variables secured
- [ ] Database credentials encrypted
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] Helmet headers set
- [ ] Input validation enabled
- [ ] Output encoding enabled
- [ ] Dependency vulnerabilities checked
- [ ] Secrets not in code
- [ ] Admin endpoints protected
- [ ] Database backups enabled

## Troubleshooting

### Build Failures
```bash
# Check logs
npm run build

# Clear cache
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### Connection Issues
```bash
# Test MongoDB connection
mongosh $MONGODB_URI

# Test API endpoint
curl https://yourdomain.com/api/health
```

### High CPU Usage
1. Check for infinite loops
2. Optimize database queries
3. Enable compression
4. Use CDN for static assets

### Memory Leaks
1. Use clinic.js
2. Check for event listener leaks
3. Profile with DevTools

## Scaling

### Horizontal Scaling
- Vercel handles automatically
- Each deployment on separate container
- Load balanced globally

### Vertical Scaling
- Upgrade Vercel Pro plan
- Increase server resources
- Optimize code

## Rollback

### Vercel Rollback
1. Dashboard → Deployments
2. Select previous deployment
3. Click "Promote to Production"

### Git Rollback
```bash
git revert <commit-hash>
git push origin main
```

## Cost Optimization

- Use Vercel free tier initially
- Upgrade Pro ($20/month) when needed
- Use MongoDB Atlas free tier
- Optimize data transfers
- Cache aggressively
- Use CDN

---

**Need help?** Check the [README](./README.md) or create an issue on GitHub.
