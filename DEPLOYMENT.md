# Toonflow Deployment Guide

## 🚀 Quick Overview

| Item | Value |
|------|-------|
| **GitHub Repo** | https://github.com/hiktan44/Toonflow |
| **Coolify App URL** | https://e2z8qqbf9varx40d02mcc87y.seymata.com |
| **Coolify Dashboard** | https://seymata.com |
| **Default Port** | 10588 |
| **Default Login** | admin / admin123 |
| **Web UI Path** | `/web/index.html` |

---

## 📋 Environment Variables

| Variable | Description | Value |
|----------|-------------|-------|
| `NODE_ENV` | Runtime environment | `dev` |
| `PORT` | Server port | `10588` |
| `FAL_KEY` | FAL AI API key | Configured ✅ |
| `OSSURL` | Static resource URL (optional) | Empty for local |

---

## 🐳 Local Docker Setup (macOS)

### Prerequisites
- Docker Desktop installed on macOS
- Git

### Steps

```bash
# 1. Clone the repository
git clone https://github.com/hiktan44/Toonflow.git
cd Toonflow

# 2. Create .env file (copy from example)
cp .env.example .env
# Edit .env and add your FAL_KEY

# 3. Build and run with Docker Compose
docker compose up -d

# 4. Access the application
open http://localhost:10588/web/index.html
```

### Manual Docker Build

```bash
docker build -t toonflow .
docker run -d -p 10588:10588 \
  -v toonflow-data:/app/data \
  -e FAL_KEY=your_fal_key_here \
  -e NODE_ENV=dev \
  -e PORT=10588 \
  toonflow
```

---

## ☁️ Coolify Deployment (Already Deployed!)

The application is **already deployed** on Coolify at seymata.com.

### Deployment Details
- **Application UUID**: `e2z8qqbf9varx40d02mcc87y`
- **Project**: Toonflow (UUID: `ssoizan4lkfojqryyf9cylth`)
- **Build Pack**: Dockerfile
- **Domain**: `https://e2z8qqbf9varx40d02mcc87y.seymata.com`

### Access the App
1. Go to: **https://e2z8qqbf9varx40d02mcc87y.seymata.com/web/index.html**
2. Login with: **admin** / **admin123**

### Custom Domain (Optional)
To set a custom domain in Coolify:

```bash
# Via Coolify API
curl -X PATCH -H "Authorization: Bearer YOUR_COOLIFY_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"fqdn": "https://toonflow.yourdomain.com"}' \
  https://seymata.com/api/v1/applications/e2z8qqbf9varx40d02mcc87y
```

Or via the Coolify web dashboard:
1. Log in to https://seymata.com
2. Navigate to Toonflow project → Toonflow application
3. In Settings → Domains, add your custom domain
4. Ensure DNS points to your Coolify server IP

### Redeploy (After Code Changes)

```bash
# Push changes to GitHub
cd Toonflow
git add .
git commit -m "Your changes"
git push origin master

# Trigger redeploy via Coolify API
curl -X POST -H "Authorization: Bearer 9|snKZNq3f9J4Hs93sLtJJ1v5lliELcZuBlj5yVHyT6df7c6f3" \
  "https://seymata.com/api/v1/deploy?uuid=e2z8qqbf9varx40d02mcc87y&force=true"
```

---

## 🔧 FAL AI Configuration

FAL AI API key is configured as an environment variable (`FAL_KEY`). However, Toonflow uses a **vendor plugin system** for AI model providers. To configure AI models within the app:

1. Login to Toonflow web UI
2. Go to **Settings** → **Vendor Configuration** (供应商配置)
3. You can:
   - Enable/configure the built-in **Toonflow official platform** vendor
   - Add custom vendor plugins (OpenAI, DeepSeek, KlingAI, etc.)
   - Configure API keys per vendor through the UI

### Available Built-in Vendors
- Toonflow Official Platform
- OpenAI
- DeepSeek
- KlingAI
- MiniMax
- Vidu
- VolcEngine
- AtlasCloud
- GRSAI

---

## 📁 Project Structure

```
Toonflow/
├── Dockerfile              # Docker build file
├── docker-compose.yml      # Docker Compose for local/Coolify
├── .env.example            # Environment variable template
├── .env.production         # Production environment config
├── src/                    # Source code (TypeScript)
├── data/
│   ├── vendor/             # AI vendor plugins
│   ├── web/                # Frontend build (pre-built)
│   ├── skills/             # Agent skill prompts
│   └── models/             # Local AI models
└── package.json
```

---

## ⚠️ Important Notes

1. **First login**: Use `admin` / `admin123`, then change the password
2. **Data persistence**: The SQLite database and uploads are stored in `/app/data` - use Docker volumes to persist data
3. **FAL AI**: The FAL_KEY env var is available for custom integrations. The main AI model configuration happens through the Toonflow web UI vendor system
4. **Node.js**: The app requires Node.js 24.x (included in Docker image)
