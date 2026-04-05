# LeetCode Notes - Full-Stack AI-Powered Study Assistant

A comprehensive full-stack application for solving LeetCode problems with AI assistance, smart tagging, topic-based search, and automated resume generation.

## 🚀 Features

### Backend (Flask)
- **AI-Powered Notes Generation** - Uses Gemini API to generate detailed problem analysis
- **Smart Tagging System** - Auto-generates tags for problems using Gemini
- **Topic-Based Search** - Filter problems by tags (dp, graph, array, etc.)
- **Resume Builder** - Automatically tailors your resume to job descriptions using Claude API
- **LaTeX to PDF Compilation** - Generates professional PDF documents
- **Folder Organization** - Organize notes into folders
- **Starred System** - Mark important problems for quick reference
- **CORS Enabled** - Ready for cross-origin requests
- **Database Management** - SQLite with WAL mode for concurrent access

### Frontend (React/Vite)
- **Real-time Chat Interface** - Stream AI responses
- **Code Input & Processing** - Input LeetCode problem solutions
- **Tag Management** - View, add, and remove tags from notes
- **Search & Filter** - Search by topic, folder, or starred status
- **Responsive Design** - Dark theme with amber accents
- **Resume Builder UI** - Interactive interface for resume customization
- **PDF Preview** - View generated PDFs inline
- **Download Options** - Export notes as PDF or DOCX

## 📋 Tech Stack

### Backend
- **Framework**: Flask 3.1.0
- **APIs**: 
  - Gemini (google-genai)
  - Claude (anthropic)
- **Database**: SQLite
- **PDF Generation**: reportlab
- **Document Generation**: python-docx
- **Server**: Gunicorn

### Frontend
- **Framework**: React 19.2.4
- **Build Tool**: Vite 8.0.1
- **Styling**: Tailwind CSS 4.2.2
- **HTTP Client**: Axios
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Markdown**: React Markdown + Syntax Highlighter

## 🏃 Quick Start (Local Development)

### Prerequisites
- Python 3.9+
- Node.js 18+
- npm or yarn
- Git

### Backend Setup

1. **Clone repository**
   ```bash
   git clone https://github.com/Rhythem2005/leetcode-notes.git
   cd leetcode-notes/backend
   ```

2. **Create virtual environment**
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env and add your API keys:
   # GEMINI_API_KEY=your_key_here
   # CLAUDE_API_KEY=your_key_here
   ```

5. **Run development server**
   ```bash
   python app.py
   ```
   Server runs on `http://localhost:5001`

### Frontend Setup

1. **Open new terminal, navigate to frontend**
   ```bash
   cd leetcode-notes/frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # VITE_API_URL is already set to http://localhost:5001
   ```

4. **Run development server**
   ```bash
   npm run dev
   ```
   App available at `http://localhost:5173`

## 🌐 Deployment

### Backend Deployment (Render)

1. **Create Render account** - https://render.com

2. **Connect GitHub repository**
   - Go to Dashboard → New → Web Service
   - Select GitHub repository
   - Choose `leetcode-notes` repository

3. **Configure service**
   - **Name**: `leetcode-notes-api`
   - **Region**: Select closest region
   - **Runtime**: Python 3.9
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn app:app`
   - **Root Directory**: `backend`

4. **Set environment variables**
   - In Render Dashboard → Environment
   - Add:
     ```
     GEMINI_API_KEY=your_key_here
     CLAUDE_API_KEY=your_key_here
     PORT=5000
     FLASK_ENV=production
     ```

5. **Deploy**
   - Render auto-deploys on git push to main
   - Monitor logs in Render Dashboard

### Frontend Deployment (Vercel)

1. **Create Vercel account** - https://vercel.com

2. **Connect GitHub repository**
   - Go to Dashboard → Add New → Project
   - Select `leetcode-notes` repository

3. **Configure settings**
   - **Project Name**: `leetcode-notes`
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

4. **Set environment variables**
   - In Vercel Dashboard → Settings → Environment Variables
   - Add:
     ```
     VITE_API_URL=https://your-render-backend-url.onrender.com
     ```
   - Replace with your actual Render backend URL

5. **Deploy**
   - Vercel auto-deploys on git push to main
   - Preview and production URLs generated automatically

## 📝 Environment Variables Reference

### Backend (.env)
```dotenv
# API Keys (REQUIRED)
GEMINI_API_KEY=your_gemini_key          # For problem analysis & tagging
CLAUDE_API_KEY=your_claude_key          # For resume builder

# Server Configuration
PORT=5000                               # Server port (optional, default: 5000)
FLASK_ENV=production                    # Set to 'production' in deployment
```

### Frontend (.env.local / Vercel)
```dotenv
VITE_API_URL=https://backend-url.onrender.com   # Backend API URL
VITE_DEBUG=false                                 # Debug mode
```

## 🔑 Getting API Keys

### Gemini API
1. Go to https://aistudio.google.com/app/apikeys
2. Create new API key
3. Copy and paste into `.env`

### Claude API
1. Go to https://console.anthropic.com/
2. Create API key
3. Copy and paste into `.env`

## 📚 API Endpoints

### Notes
- `POST /generate` - Generate notes for a problem
- `GET /all-notes` - Get accumulated notes

### History
- `GET /api/history` - Get all notes (supports ?tag=filter)
- `POST /api/history` - Save new note
- `DELETE /api/history/<id>` - Delete note
- `PATCH /api/history/<id>/star` - Toggle star
- `PATCH /api/history/<id>/tags` - Update tags
- `PATCH /api/history/<id>/folder` - Move to folder

### Folders
- `GET /api/history/folders` - List folders
- `POST /api/history/folders` - Create folder
- `DELETE /api/history/folders/<id>` - Delete folder

### Resume
- `POST /api/resume/generate` - Generate tailored resume
- `GET /api/resume/download/<uuid>` - Download PDF

## 🐛 Troubleshooting

### Backend won't start
- Check Python version (3.9+)
- Ensure virtual environment is activated
- Run `pip install -r requirements.txt`
- Check if port 5001 is available

### Frontend API errors
- Verify `VITE_API_URL` is correct
- In dev: should be `http://localhost:5001`
- In production: should be your Render backend URL
- Check browser console for CORS errors

### API Key errors
- Verify keys are in `.env` (backend) or Environment Variables (deployment)
- Check keys are valid and not expired
- Ensure no extra spaces in keys

### Database errors
- Check write permissions in `backend/data/` directory
- Ensure SQLite is available
- Clear database with `rm backend/data/history.sqlite*` to reset

## 📦 Production Checklist

Before deploying:
- [ ] API keys configured in environment variables
- [ ] Backend `.env.example` created with all variables
- [ ] Frontend `.env.example` created
- [ ] `Procfile` present in backend directory
- [ ] Requirements.txt updated with all dependencies
- [ ] CORS properly configured
- [ ] API_URL using environment variables
- [ ] Build tested locally (`npm run build`)
- [ ] Git repository updated and pushed
- [ ] Render service created and configured
- [ ] Vercel project created and configured

## 🔄 CI/CD Pipeline

Both services auto-deploy on git push to main:
1. GitHub receives push
2. Render detects backend changes → rebuilds backend
3. Vercel detects frontend changes → rebuilds frontend
4. New versions automatically available

## 📄 License

MIT Licensed - See LICENSE file for details

## 🤝 Contributing

Contributions welcome! Please:
1. Fork repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📧 Support

For issues or questions:
- Open an issue on GitHub
- Check existing documentation
- Review API endpoint examples

## 🎯 Future Enhancements

- [ ] User authentication and accounts
- [ ] Problem difficulty ratings
- [ ] Study plan generation
- [ ] Performance analytics dashboard
- [ ] Mobile app
- [ ] Real-time collaboration
- [ ] Code playground integration
- [ ] Interview question bank

---

**Made with ❤️ for DSA learners**
