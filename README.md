# Cricket Match Feedback Form

A web application for collecting and managing cricket match feedback with React frontend and Node.js backend.

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Desktop (with Kubernetes enabled)
- Node.js (for local development)
- MongoDB (or use the provided Docker setup)

### Option 1: Docker Desktop Kubernetes (Recommended)
```bash
# Enable Kubernetes in Docker Desktop
# Apply the manifests
kubectl apply -f k8s/

# Access the app
open http://localhost/
```

### Option 2: Local Development
```bash
# Backend
cd backend
npm install
npm run dev

# Frontend
cd frontend
npm install
npm start
```

## 📋 Features

### Frontend
- **Feedback Form** with:
  - Match date picker
  - Player name input
  - 1-5 star ratings for batting, bowling, fielding, and team spirit
  - Detailed experience text area
  - Issues faced checkboxes (venue, equipment, timing, umpiring, other)
  - Additional comments section
  - Form validation and error handling
  - Mobile-responsive design with Tailwind CSS

- **Admin Dashboard** with:
  - Password-protected access for admins only
  - Aggregated statistics and ratings
  - Issues summary with accurate counts
  - Detailed feedback table with clickable rows
  - Interactive modal for viewing complete feedback details
  - Real-time data updates
  - Enhanced total submissions card with detailed averages
  - Session persistence and logout functionality

### Backend
- **REST API** endpoints:
  - `POST /api/feedback` - Submit new feedback
  - `GET /api/feedback` - Get all feedback submissions
  - `GET /api/feedback/stats` - Get aggregated statistics
  - `POST /api/admin/authenticate` - Admin authentication
  - `GET /api/health` - Health check endpoint

- **Authentication**:
  - Password-protected admin dashboard
  - Session management with localStorage
  - Environment variable for admin password

- **Database**:
  - MongoDB with Mongoose ODM
  - Schema validation
  - Timestamp tracking

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Axios
- **Backend**: Node.js, Express, MongoDB, Mongoose
- **Deployment**: Vercel (ready)
- **Development**: Concurrently, Nodemon

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or MongoDB Atlas)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd survey-project
```

2. Install dependencies:
```bash
npm install
cd frontend && npm install
cd ../backend && npm install
```

3. Set up environment variables:
```bash
# Backend
cd backend
cp .env.example .env
# Edit .env with your MongoDB URI

# Frontend
cd ../frontend
cp .env.example .env
# Edit .env with your API URL (for development)
```

4. Start the development servers:
```bash
# From root directory
npm run dev
```

This will start both frontend (http://localhost:3000) and backend (http://localhost:5000) concurrently.

### Local Development

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- Health check: http://localhost:5000/api/health

## API Endpoints

### Submit Feedback
```http
POST /api/feedback
Content-Type: application/json

{
  "playerName": "John Doe",
  "matchDate": "2024-01-15",
  "batting": 4,
  "bowling": 3,
  "fielding": 5,
  "teamSpirit": 4,
  "feedbackText": "Great match experience!",
  "issues": {
    "venue": false,
    "equipment": true,
    "timing": false,
    "umpiring": false,
    "other": false
  },
  "additionalComments": "The equipment could be better"
}
```

### Get All Feedback
```http
GET /api/feedback
```

### Get Statistics
```http
GET /api/feedback/stats
```

## Deployment

### Vercel Deployment

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Set environment variables in Vercel dashboard:
   - `MONGODB_URI`: Your MongoDB connection string
4. Deploy!

The application is configured with `vercel.json` for automatic deployment.

### Environment Variables for Production

- `MONGODB_URI`: MongoDB connection string (required)
- `NODE_ENV`: Set to 'production' automatically by Vercel
- `PORT`: Set automatically by Vercel

## Project Structure

```
survey-project/
├── frontend/                 # React frontend
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── services/        # API services
│   │   ├── types/          # TypeScript types
│   │   └── App.tsx         # Main app component
│   ├── public/
│   └── package.json
├── backend/                  # Node.js backend
│   ├── config/
│   │   └── database.js     # Database connection
│   ├── models/
│   │   └── Feedback.js     # Mongoose model
│   ├── routes/
│   │   └── feedback.js     # API routes
│   └── index.js            # Server entry point
├── vercel.json             # Vercel configuration
└── README.md
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License
