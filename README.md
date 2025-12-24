<div align="center">

  <img src="public/next.svg" alt="ScholarSync Logo" width="120"/>

  # 🎓 ScholarSync

  ### Smart Fee & Scholarship Tracker

  *Never miss money you deserve*

  [![Next.js](https://img.shields.io/badge/Next.js-16.1-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
  [![Firebase](https://img.shields.io/badge/Firebase-12.7-orange?style=for-the-badge&logo=firebase)](https://firebase.google.com/)
  [![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

  [Features](#-features) • [Getting Started](#-getting-started) • [Tech Stack](#-tech-stack) • [Documentation](#-documentation) • [Contributing](#-contributing)

</div>

---

## 📖 Overview

**ScholarSync** is an AI-powered scholarship discovery and financial aid management platform designed specifically for Indian students. Every year, over ₹1,000 crores in scholarship funds go unclaimed. ScholarSync solves this problem by intelligently matching students with scholarships they're eligible for, automating applications, and detecting fee anomalies.

### 🎯 Problem Statement

- **₹1,000+ Cr** in scholarships go unclaimed annually
- Students spend **100+ hours** manually searching for scholarships
- **60%** of eligible students miss deadlines due to lack of awareness
- **45%** of students overpay fees due to unclear fee structures
- Complex eligibility criteria create confusion and missed opportunities

### 💡 Our Solution

An intelligent platform that acts as your **Financial Aid Copilot**, combining:

- AI-powered scholarship matching with 95% accuracy
- Automated document management and application auto-fill
- Real-time fee anomaly detection
- Community-driven insights and success stories

---

## ✨ Features

### 🎯 Scholarship Radar

AI-powered matching engine that finds scholarships you actually qualify for.

- **Semantic Search**: Uses Pinecone vector database for intelligent matching
- **Multi-factor Scoring**: Analyzes 7+ eligibility criteria (category, income, marks, state, etc.)
- **Real-time Updates**: Daily scraping of NSP, state portals, and college websites
- **Personalized Match Scores**: Get detailed reasons why you match (85%, 92%, etc.)

### ❓ Why Not Me? Analyzer

Discover scholarships you *almost* qualify for and learn how to bridge the gap.

- **Gap Analysis**: Shows exactly what you're missing (e.g., "Need 2% more marks")
- **Actionable Steps**: Specific recommendations to improve eligibility
- **Progress Tracking**: Monitor your journey toward qualification
- **Priority Ranking**: Focus on near-miss opportunities with highest potential

### 📄 Document Vault + Auto-Fill

Upload once, use everywhere. Your secure digital document repository.

- **OCR Extraction**: Tesseract.js extracts data from scanned documents automatically
- **Intelligent Parsing**: AI understands context (income certificates, marksheets, etc.)
- **Secure Storage**: Firebase Cloud Storage with encryption
- **One-Click Auto-Fill**: Populate scholarship applications instantly
- **Document Verification**: Track expiry dates and renewal requirements

### 💰 Fee Anomaly Detector

Compare your fees against official structures and catch overcharges.

- **Receipt Analysis**: Upload fee receipts for instant comparison
- **AI-Powered Detection**: Identifies discrepancies in fee components
- **Official Fee Database**: Compare against verified college fee structures
- **Detailed Reports**: Get itemized breakdowns of anomalies
- **Save Money**: Recover overcharged amounts with documented proof

### 🔔 Smart Notifications

Never miss a deadline or opportunity.

- **Deadline Reminders**: Timely alerts before scholarship deadlines
- **New Matches**: Instant notifications when new scholarships match your profile
- **Application Updates**: Track status of submitted applications
- **Smart Scheduling**: Customizable notification preferences

### 👥 Community Intelligence

Learn from students who've successfully secured scholarships.

- **Success Stories**: Real experiences from scholarship recipients
- **Pro Tips**: Community-shared insights (e.g., "Actually accepts applications till 15th")
- **Discussion Forums**: Ask questions and get answers from peers
- **Anonymized Data**: Success rates for different scholarship types

---

## 🛠️ Tech Stack

### Frontend

- **Framework**: Next.js 16.1 (App Router)
- **Language**: TypeScript 5.0
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Forms**: React Hook Form + Zod validation

### Backend

- **API**: Next.js API Routes (serverless)
- **Database**: Firebase Firestore (NoSQL)
- **Authentication**: Firebase Auth (Email/Password, Google OAuth)
- **Storage**: Firebase Cloud Storage
- **Vector DB**: Pinecone (semantic search)

### AI/ML

- **LLM**: Google Gemini 2.5 Flash (`gemini-2.5-flash-preview-05-20`)
- **Embeddings**: Google `text-embedding-004`
- **Orchestration**: LangChain
- **OCR**: Tesseract.js

### Web Scraping & Automation

- **Scraper**: Puppeteer (headless browser)
- **Targets**: NSP Portal, State Scholarship Websites, College Portals
- **Scheduling**: Cron jobs for daily updates

### Development Tools

- **Package Manager**: npm/yarn/pnpm/bun
- **Linting**: ESLint
- **Type Checking**: TypeScript strict mode

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm/yarn/pnpm/bun
- Firebase project
- Pinecone account
- Google AI API key

### Quick Start

1. **Clone the repository:**

```bash
git clone https://github.com/JaiswalShivang/ScholarSync.git
cd ScholarSync
```

2. **Install dependencies:**

```bash
npm install
# or
yarn install
# or
pnpm install
```

3. **Configure environment variables:**

```bash
cp .env.example .env.local
```

Edit `.env.local` with your credentials:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id

# Pinecone Configuration
PINECONE_API_KEY=your-pinecone-api-key
PINECONE_INDEX_NAME=scholarships

# Google AI (Gemini) Configuration
GOOGLE_API_KEY=your-google-ai-api-key
```

4. **Run the development server:**

```bash
npm run dev
```

5. **Open your browser:**

Navigate to [http://localhost:3000](http://localhost:3000)

---

## 📁 Project Structure

```
ScholarSync/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API Routes
│   │   │   ├── documents/     # Document upload & OCR
│   │   │   ├── fees/          # Fee analysis
│   │   │   ├── profile/       # User profile management
│   │   │   ├── scholarships/  # Scholarship matching
│   │   │   │   ├── match/
│   │   │   │   ├── explain/
│   │   │   │   ├── why-not-me/
│   │   │   │   └── save/
│   │   │   └── scraper/       # Web scraping
│   │   ├── auth/              # Authentication pages
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── dashboard/         # Dashboard pages
│   │   │   ├── scholarships/
│   │   │   ├── documents/
│   │   │   ├── fees/
│   │   │   ├── profile/
│   │   │   ├── saved/
│   │   │   ├── why-not-me/
│   │   │   └── community/
│   │   ├── page.tsx           # Landing page
│   │   ├── layout.tsx         # Root layout
│   │   └── globals.css        # Global styles
│   ├── components/            # React components
│   │   ├── auth/             # Authentication forms
│   │   ├── dashboard/        # Dashboard components
│   │   ├── documents/        # Document vault
│   │   ├── fees/             # Fee analyzer
│   │   ├── scholarships/     # Scholarship components
│   │   └── ui/               # shadcn/ui components
│   ├── contexts/             # React contexts
│   │   └── AuthContext.tsx   # Authentication context
│   ├── lib/                  # Utilities & configurations
│   │   ├── firebase/        # Firebase setup
│   │   ├── langchain/       # LangChain chains
│   │   ├── pinecone/        # Pinecone client
│   │   └── utils.ts         # Utility functions
│   └── types/               # TypeScript type definitions
├── public/                   # Static assets
├── docs/                     # Documentation
├── .env.local               # Environment variables (gitignored)
├── next.config.ts           # Next.js configuration
├── tsconfig.json            # TypeScript configuration
├── package.json             # Dependencies
└── README.md                # This file
```

---

## 🔌 API Routes

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/scholarships/match` | POST | Get personalized scholarship matches |
| `/api/scholarships/explain` | POST | Get AI-powered eligibility explanation |
| `/api/scholarships/why-not-me` | POST | Analyze near-miss scholarships |
| `/api/scholarships/save` | POST | Save scholarship to favorites |
| `/api/documents/upload` | POST | Upload document with OCR extraction |
| `/api/fees/analyze` | POST | Analyze fee receipt for anomalies |
| `/api/profile/update` | POST | Update user profile |
| `/api/profile` | GET | Get current user profile |
| `/api/scraper/run` | POST | Trigger web scraper (admin) |

---

## 🎨 Key Features Explained

### Scholarship Matching Algorithm

1. **Profile Embedding**: User profile converted to vector using Google's text-embedding-004
2. **Semantic Search**: Pinecone finds similar scholarships (top 50)
3. **Rule-based Filtering**: Strict eligibility criteria (category, income, marks)
4. **AI Scoring**: Gemini 2.5 Flash analyzes match quality (0-100%)
5. **Ranking**: Results sorted by match percentage

### Document OCR Pipeline

1. **Upload**: User uploads document to Firebase Storage
2. **OCR Processing**: Tesseract.js extracts text
3. **AI Parsing**: Gemini understands context and structure
4. **Data Extraction**: Key-value pairs stored in Firestore
5. **Auto-fill**: One-click population of forms

### Fee Anomaly Detection

1. **Receipt Upload**: User uploads fee receipt
2. **Text Extraction**: OCR extracts fee components
3. **Database Lookup**: Compare with official fee structure
4. **AI Analysis**: Gemini identifies discrepancies
5. **Report Generation**: Detailed anomaly report with recommendations

---

## 🌐 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project on [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/JaiswalShivang/ScholarSync)

### Other Platforms

- **Netlify**: Supports Next.js with Edge Functions
- **Railway**: Full-stack deployment with cron jobs
- **AWS Amplify**: Scalable hosting with CI/CD

---

## 📚 Documentation

- **[ARCHITECTURE.md](docs/ARCHITECTURE.md)**: System architecture and design decisions
- **[API_DOCS.md](docs/API_DOCS.md)**: Complete API reference
- **[REAL_LIFE_USECASE.md](docs/REAL_LIFE_USECASE.md)**: Real-world use cases and success stories
- **[CONTRIBUTING.md](CONTRIBUTING.md)**: Contribution guidelines

---

## 🧪 Testing

```bash
# Run ESLint
npm run lint

# Type check
npx tsc --noEmit

# Build for production
npm run build

# Start production server
npm start
```

---

## 🔐 Security

- **Authentication**: Firebase Auth with secure token management
- **Data Encryption**: All data encrypted at rest and in transit
- **Document Security**: Granular access control for uploaded documents
- **API Protection**: Rate limiting and authentication middleware
- **CORS**: Configured for production domains only

---

## 📈 Roadmap

- [ ] Mobile app (React Native)
- [ ] Multi-language support (Hindi, Tamil, Telugu, etc.)
- [ ] Scholarship application form builder
- [ ] Success rate predictor
- [ ] Referral program
- [ ] College-specific scholarship pages
- [ ] Integration with payment gateways for fees
- [ ] WhatsApp notifications

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md).

### Quick Contribution Steps

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👥 Team

Created with ❤️ by the ScholarSync team

- **GitHub**: [@JaiswalShivang](https://github.com/JaiswalShivang)
- **Project**: [ScholarSync](https://github.com/JaiswalShivang/ScholarSync)

---

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - The React framework
- [Firebase](https://firebase.google.com/) - Backend infrastructure
- [Pinecone](https://pinecone.io/) - Vector database
- [Google AI](https://ai.google.dev/) - Gemini API
- [shadcn/ui](https://ui.shadcn.com/) - UI components
- [Vercel](https://vercel.com/) - Hosting platform

---

## 📞 Support

- **Documentation**: See docs in this repository
- **Issues**: [GitHub Issues](https://github.com/JaiswalShivang/ScholarSync/issues)
- **Questions**: Open a discussion on GitHub

---

<div align="center">
  <p>If ScholarSync helped you, please ⭐ star this repository!</p>
  <p>Made with ❤️ for students across India</p>
</div>
