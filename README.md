# 🎯 InterviewAI - AI Mock Interview Platform

**Master Your Interview Skills with AI-Powered Practice and Human Expert Guidance**

A comprehensive interview preparation platform that combines artificial intelligence with human expertise to help job seekers excel in their interviews.

---

## 🚀 Demo Video — Video Project 5

> See our InterviewAI platform in action! **Video Project 5** walks through AI-powered mock interviews and how users connect with industry professionals for personalized feedback.

https://github.com/user-attachments/assets/702bab60-30be-43ff-a37a-4ad03bdfa981

Local copy in this repo: [`Video Project 5.mp4`](./Video%20Project%205.mp4)

---

## 📋 Table of Contents

- [Problem Statement](#-problem-statement)
- [Solution](#-solution)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [Project Structure](#-project-structure)
- [Core Components](#-core-components)
- [Firebase Setup](#-firebase-setup)
- [Environment Variables](#-environment-variables)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🎯 Problem Statement

People apply to hundreds or thousands of jobs, but they don't prepare enough for interviews.

**When they finally get an interview:**
- They don't have anyone experienced to practice with

**Practicing with roommates or friends has drawbacks:**
- They are at the same level, so they can't give proper feedback
- Sometimes they make fun of you  
- You feel awkward or "dumb" practicing with them

## 💡 Solution


**InterviewAI** addresses these challenges through a dual-approach platform:

### 🤖 **AI-Powered Mock Interviews**

- **Real-time Speech Analysis**: Advanced voice processing and feedback during live conversations
- **Comprehensive Performance Analytics**: Detailed scoring across technical knowledge, communication skills, problem-solving, and professional presentation with analytical Dashboard
- **24/7 Availability**: Practice anytime, anywhere without scheduling constraints

### 👥 **Human Expert Network**
- **Industry Professional Pool**: Connect with experienced professionals from your target companies (e.g., Google, Microsoft, Meta)
- **Paid Expert Sessions**: Book mock interviews with industry insiders
- **Company-Specific Preparation**: Get insights into actual interview processes and culture
- **Referral Opportunities**: Potential networking and referral possibilities
- **Real Interview Simulation**: Human judgment and industry-specific feedback

### 🎯 **Complete Interview Ecosystem**
- **Pre-Interview**: AI-powered practice sessions to build confidence
- **Expert Validation**: Human professional review for final preparation
- **Post-Interview**: Detailed analytics and improvement roadmaps
- **Community**: Access to a network of professionals and job seekers

---

## ✨ Key Features

### 🤖 **AI Interview Engine**
- **Voice-Activated Conversations**: Natural speech interaction using 11Labs voice AI
- **Smart Question Generation**: Context-aware questions based on role requirements
- **Real-time Transcription**: Whisper API for accurate speech-to-text conversion
- **Advanced Analytics**: GPT-4 powered comprehensive performance analysis

### 👥 **Community Platform**
- **Professional Network**: Browse and connect with industry experts
- **Smart Matching**: Find interviewers by company, role, and experience level
- **Flexible Scheduling**: Integrated booking system with calendar management
- **Secure Payments**: Built-in payment processing for expert sessions

### 📊 **Performance Analytics**
- **Multi-dimensional Scoring**: Technical knowledge, communication, problem-solving, and presentation skills
- **Detailed Breakdowns**: Granular feedback on specific areas
- **Progress Tracking**: Historical performance monitoring
- **Actionable Recommendations**: Specific improvement suggestions

### 🔐 **Enterprise-Grade Security**
- **Firebase Authentication**: Secure user management with Google OAuth
- **Data Privacy**: Encrypted storage of interview sessions and personal data
- **GDPR Compliant**: Privacy-focused design and data handling

---

## 🛠 Tech Stack

### **Frontend**
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and building
- **Styling**: Tailwind CSS for responsive, modern UI
- **Component Library**: shadcn/ui with Radix UI primitives
- **Routing**: React Router DOM for client-side navigation
- **State Management**: React Context API + React Query for server state

### **Backend & Services**
- **Database**: Firebase Firestore (NoSQL, real-time)
- **Authentication**: Firebase Auth with Google OAuth
- **File Storage**: Firebase Storage for user uploads
- **Hosting**: Firebase Hosting for static site deployment

### **AI & Voice Technology**
- **Speech-to-Text**: OpenAI Whisper API
- **Natural Language Processing**: OpenAI GPT-4o-mini for interview analysis
- **Voice Interaction**: 11Labs React SDK for conversational AI
- **Real-time Communication**: WebRTC for voice recording

### **Development Tools**
- **Language**: TypeScript for type safety
- **Linting**: ESLint with React and TypeScript rules
- **Code Formatting**: Prettier (via shadcn/ui setup)
- **Package Manager**: npm
- **Version Control**: Git with GitHub integration

### **UI/UX Libraries**
- **Icons**: Lucide React for consistent iconography
- **Charts**: Recharts for data visualization
- **Forms**: React Hook Form with Zod validation
- **Date Handling**: date-fns for date manipulation
- **Notifications**: Sonner for toast notifications

---

## 🚀 Getting Started

### **Prerequisites**
- Node.js 18+ and npm
- Firebase project with Firestore, Auth, and Storage enabled
- OpenAI API key
- 11Labs API key

### **Installation**

1. **Clone the repository**
   ```bash
   git clone <YOUR_GIT_URL>
   cd instant-ai-conversations-orchestra
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment setup**
   ```bash
   # Copy environment template
   cp .env.example .env.local
   
   # Edit with your API keys (see Environment Variables section)
   ```

4. **Firebase configuration**
   ```bash
   # Follow the Firebase setup guide
   cat FIREBASE_SETUP.md
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   ```
   Navigate to http://localhost:5173
   ```

### **Build for Production**
```bash
# Create production build
npm run build

# Preview production build locally
npm run preview

# Deploy to Firebase (if configured)
firebase deploy
```

---

## 📁 Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── ui/              # shadcn/ui component library
│   ├── ConversationInterface.tsx    # AI voice interaction
│   ├── InterviewAnalysis.tsx        # Results display
│   ├── BookingDialog.tsx           # Human interview booking
│   ├── UserProfile.tsx             # User management
│   └── Sidebar.tsx                 # Navigation
├── contexts/            # React Context providers
│   ├── AuthContext.tsx             # Authentication state
│   └── InterviewQuotaContext.tsx   # Usage tracking
├── pages/               # Main application pages
│   ├── Home.tsx                    # Landing page
│   ├── Dashboard.tsx               # User dashboard
│   ├── Index.tsx                   # AI interview practice
│   ├── Community.tsx               # Human interviewer network
│   ├── Schedule.tsx                # Booking management
│   ├── Analytics.tsx               # Performance tracking
│   └── InterviewResults.tsx        # Analysis results
├── lib/                 # Utility libraries
│   ├── firebase.ts                 # Firebase configuration
│   ├── openai.ts                   # AI service integration
│   └── utils.ts                    # Helper functions
└── hooks/               # Custom React hooks
    └── use-mobile.tsx              # Responsive design helpers
```

---

## 🔧 Core Components

### **ConversationInterface**
- Manages AI-powered voice conversations
- Real-time speech recognition and transcription
- Session recording and analysis triggering

### **InterviewAnalysis**
- Displays comprehensive performance metrics
- Interactive charts and detailed feedback
- Progress tracking and recommendations

### **Community Platform**
- Professional interviewer profiles
- Search and filtering capabilities
- Booking system integration

### **UserProfile Management**
- Account settings and preferences
- Interview history and analytics
- Quota and subscription management

---

## 🔥 Firebase Setup

1. **Create Firebase Project**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project
   - Enable Google Analytics (optional)

2. **Enable Required Services**
   ```bash
   # Enable in Firebase Console:
   - Authentication (Google provider)
   - Firestore Database
   - Storage
   - Hosting (for deployment)
   ```

3. **Configure Authentication**
   - Enable Google Sign-in method
   - Add your domain to authorized domains

4. **Database Rules** (see `firestore.rules`)
   ```javascript
   // Basic security rules for development
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /{document=**} {
         allow read, write: if request.auth != null;
       }
     }
   }
   ```

5. **Get Configuration**
   - Copy Firebase config from Project Settings
   - Add to environment variables

---

## 🔐 Environment Variables

Create a `.env.local` file in the root directory:

```bash
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id

# OpenAI Configuration
VITE_OPENAI_API_KEY=your_openai_api_key

# 11Labs Configuration (for voice AI)
VITE_ELEVENLABS_API_KEY=your_elevenlabs_api_key
```

**Security Notes:**
- Never commit `.env.local` to version control
- Use Firebase Security Rules for production
- Rotate API keys regularly
- Consider using Firebase Functions for sensitive operations

---

## 🎯 Usage Guide

### **For Job Seekers:**

1. **Sign Up & Profile Setup**
   - Create account with Google OAuth
   - Complete profile with resume and target roles

2. **AI Practice Sessions**
   - Navigate to Practice page
   - Start voice-based mock interview
   - Receive real-time feedback and analysis

3. **Book Human Experts**
   - Browse Community page
   - Filter by company, experience, rate
   - Schedule paid sessions with professionals

4. **Track Progress**
   - View Analytics dashboard
   - Monitor improvement over time
   - Review detailed session feedback

### **For Interview Experts:**

1. **Professional Registration**
   - Complete interviewer profile
   - Set rates and availability
   - Verify professional background

2. **Manage Bookings**
   - Accept/decline interview requests
   - Manage calendar and availability
   - Conduct paid mock interviews

---

## 🧪 Testing

```bash
# Run linting
npm run lint

# Type checking
npx tsc --noEmit

# Manual testing checklist:
# - User authentication flow
# - AI interview functionality
# - Booking system workflow
# - Analytics display
# - Mobile responsiveness
```

---

## 🚀 Deployment

### **Firebase Hosting**
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize hosting
firebase init hosting

# Build and deploy
npm run build
firebase deploy
```

### **Alternative Deployment Options**
- **Vercel**: Zero-config deployment with Git integration
- **Netlify**: JAMstack platform with form handling
- **AWS S3 + CloudFront**: Scalable static hosting

---

## 🤝 Contributing

1. **Fork the repository**
2. **Create feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit changes** (`git commit -m 'Add amazing feature'`)
4. **Push to branch** (`git push origin feature/amazing-feature`)
5. **Open Pull Request**

### **Development Guidelines**
- Follow TypeScript best practices
- Use semantic commit messages
- Ensure mobile responsiveness
- Add proper error handling
- Update documentation for new features

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👥 Team

Built with ❤️ for job seekers everywhere.

---

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/your-repo/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-repo/discussions)
- **Email**: jbha0504@umd.edu / qd98375@umbc.edu

---

**Ready to ace your next interview? Get started with InterviewAI today! 🚀**
