# GitMind OS - AI-Driven GitHub Intelligence Platform

> **Built for CODE FIESTA Hackathon** 🏆  
> "Connect. Collaborate. Code." - Showcasing Best Use of GitHub & GitHub Copilot

[![GitHub](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)](https://github.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)


---

## 📋 Overview

GitMind OS is an **enterprise-grade AI-driven GitHub Intelligence & Governance Platform** that transforms how teams understand, manage, and evolve their GitHub repositories. It combines the power of GitHub's ecosystem with AI to provide deep insights, risk analysis, and automated governance.

### Core Philosophy

GitMind OS behaves like:
- 🧠 **A Senior Tech Lead** - Strategic insights and architectural guidance
- 📊 **A Project Manager** - Sprint analysis and deadline predictions
- 🔍 **A Code Quality Auditor** - Multi-dimensional risk assessment
- 🛡️ **A DevOps Guardian** - Automated governance and policy enforcement
- 🤖 **An AI Co-Engineer** - Copilot-powered refactoring and planning

---

## 🚀 Key Features

### 1. **Multi-Dimensional Risk Engine** ⚠️
Analyzes PRs across 5 risk dimensions:
- **Code Risk** - Change complexity, test coverage, code quality
- **Process Risk** - Review velocity, merge patterns, approval delays
- **Human Risk** - Contributor experience, SPOF detection
- **Architectural Risk** - Dependency impact, structural changes
- **Release Risk** - Deployment readiness, breaking changes

### 2. **Temporal Intelligence Engine** 📈
Time-aware analysis tracking:
- Repository velocity trends
- Code churn patterns
- Contributor burnout signals
- PR review delays
- Historical pattern recognition

### 3. **Architectural Drift Detection** 🏗️
Automatically detects:
- God-files and oversized modules
- Circular dependencies
- Boundary violations
- Folder structure degradation
- Auto-suggests refactoring strategies

### 4. **GitHub Copilot-Powered Refactor Planner** 🤖
AI-generated step-by-step refactoring plans including:
- File modification order
- Test strategy recommendations
- Risk mitigation steps
- Dependency resolution paths

### 5. **Contributor Intelligence** 👥
Tracks and analyzes:
- Contribution quality scores
- Review reliability metrics
- Risk profiles per contributor
- Single-point-of-failure (SPOF) detection
- Activity patterns and burnout signals

### 6. **Sprint Intelligence** 🎯
AI-powered sprint analysis:
- Sprint completion probability
- Blocker identification
- Priority reordering suggestions
- Risk-based sprint planning

### 7. **Automated Governance Engine** 🛡️
Policy-as-code system with:
- Configurable PR size limits
- Test coverage requirements
- Mandatory reviewer rules
- Commit message quality checks
- Custom rule definitions

### 8. **Predictive Failure Engine** 🔮
Predicts:
- Likely bugs based on patterns
- PR revert probability
- Missed deadline risks
- High-risk merge scenarios

### 9. **Developer Simulation Mode** 🧪
"What-if" scenario analysis:
- Simulate PR merges
- Model contributor departures
- Project risk impact changes
- Test governance rule changes

### 10. **Knowledge Graph Engine** 🕸️
Builds comprehensive repository knowledge graphs:
- **Nodes:** Files, Functions, Commits, PRs, Contributors, Issues
- **Edges:** Relationships, dependencies, ownership
- Powers advanced reasoning and impact analysis

---

## 🛠️ Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and builds
- **Wouter** for client-side routing
- **TanStack Query** for server state management
- **Shadcn/ui** with Radix UI primitives
- **Tailwind CSS** with Carbon Design System inspiration
- **Recharts** for data visualization

### Backend
- **Express.js** with TypeScript
- **OpenAI GPT-4o** for AI-powered analysis
- **@octokit/rest** for GitHub API integration
- **Passport.js** for GitHub OAuth authentication
- **Drizzle ORM** for database management
- **Zod** for runtime validation

### GitHub Integration
- **GitHub OAuth 2.0** for secure authentication
- **GitHub REST API** via Octokit
- **GitHub Actions** for automation (see `.github/workflows/`)
- **Repository Analysis** - Commits, PRs, Issues, Contributors
- **Webhook Support** (ready for integration)

---

## 📦 GitHub Usage Highlights

### 1. **GitHub OAuth Integration**
```typescript
// server/auth.ts
- Secure GitHub OAuth 2.0 flow
- Session-based token management
- Repository access permissions
- User authentication state
```

### 2. **Comprehensive GitHub API Usage**
```typescript
// server/github.ts
✅ Repository metadata and health scores
✅ Pull Requests (open, closed, merged)
✅ Issues tracking and analysis
✅ Commit history and patterns
✅ Contributor statistics and profiles
✅ Repository tree and file structure
✅ File content retrieval
✅ Branch and ref management
```

### 3. **GitHub Actions Workflows**
Automated workflows for:
- PR risk analysis
- Governance rule enforcement
- Repository health monitoring
- Automated PR comments and labels

### 4. **Best Practices Demonstrated**
- ✅ Clean commit history with meaningful messages
- ✅ Feature branches for development
- ✅ Pull Request workflow
- ✅ Code review process
- ✅ Issue tracking
- ✅ Documentation in README and code comments

---

## 🤖 GitHub Copilot Usage

GitMind OS extensively leverages **GitHub Copilot** throughout development:

### 1. **AI-Powered Risk Analysis**
```typescript
// Copilot-assisted generation of multi-dimensional risk scoring
// Analyzes PR changesets, commit patterns, contributor history
// Generates natural language explanations for risk scores
```

**Copilot Contribution:**
- Generated risk calculation algorithms
- Suggested scoring heuristics
- Created explanation templates
- Assisted with pattern recognition logic

### 2. **Refactor Planning Engine**
```typescript
// AI-generated step-by-step refactoring plans
// Includes file order, test strategy, risk mitigation
```

**Copilot Contribution:**
- Generated refactor plan templates
- Suggested test strategy patterns
- Created dependency resolution logic
- Assisted with risk mitigation steps

### 3. **Temporal Intelligence**
```typescript
// Machine learning-inspired pattern detection
// Velocity trend analysis
// Contributor activity modeling
```

**Copilot Contribution:**
- Generated time-series analysis functions
- Suggested pattern matching algorithms
- Created insight generation templates
- Assisted with statistical calculations

### 4. **Code Generation & Refactoring**
Throughout development, Copilot helped with:
- **Component Generation** - React components with proper TypeScript types
- **API Endpoint Creation** - Express routes with validation
- **Type Definitions** - Comprehensive Zod schemas
- **Error Handling** - Robust error handling patterns
- **Test Utilities** - Helper functions for testing

### 5. **Documentation & Comments**
Copilot assisted in:
- Generating comprehensive JSDoc comments
- Creating API documentation
- Writing clear commit messages
- Generating code examples

### Copilot Usage Statistics
- **~40% of code** generated or suggested by Copilot
- **100+ functions** created with Copilot assistance
- **All AI prompts** refined with Copilot suggestions
- **Type definitions** largely Copilot-generated

---

## 🏗️ Project Structure

```
gitmind-os/
├── client/                    # React frontend
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   ├── pages/             # Page components
│   │   ├── contexts/          # React contexts
│   │   ├── hooks/             # Custom hooks
│   │   └── lib/               # Utilities
│   └── public/                # Static assets
│
├── server/                    # Express backend
│   ├── auth.ts                # GitHub OAuth setup
│   ├── github.ts              # GitHub API service
│   ├── routes.ts              # API endpoints
│   ├── storage.ts             # Data storage
│   └── index.ts               # Server entry
│
├── shared/                    # Shared types
│   └── schema.ts              # Zod schemas
│
├── .github/
│   └── workflows/             # GitHub Actions
│       ├── pr-risk-analysis.yml
│       └── governance-enforcement.yml
│
├── GITHUB_OAUTH_SETUP.md      # OAuth setup guide
├── design_guidelines.md       # Design system docs
└── README.md                  # This file
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- GitHub account (for OAuth)
- OpenAI API key (for AI features)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/suhanakousar/Github-os.git
cd Github-os
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
Create a `.env` file:
```env
# GitHub OAuth (required)
GITHUB_CLIENT_ID=your_client_id_here
GITHUB_CLIENT_SECRET=your_client_secret_here
GITHUB_CALLBACK_URL=http://localhost:3457/api/auth/github/callback

# OpenAI (required for AI features)
OPENAI_API_KEY=your_openai_api_key

# Session
SESSION_SECRET=your-random-secret-key-here
```

4. **Set up GitHub OAuth App**
   - Go to https://github.com/settings/developers
   - Click "New OAuth App"
   - Application name: `GitMind OS`
   - Homepage URL: `http://localhost:3457`
   - Authorization callback URL: `http://localhost:3457/api/auth/github/callback`
   - Copy Client ID and Secret to `.env`

5. **Run the development server**
```bash
npm run dev
```

6. **Open in browser**
```
http://localhost:3457
```

### Build for Production
```bash
npm run build
npm start
```

---

## 📡 API Endpoints

### Authentication
- `GET /api/auth/github` - Initiate GitHub OAuth
- `GET /api/auth/github/callback` - OAuth callback
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout

### GitHub Integration
- `GET /api/github/repositories` - List user repositories
- `GET /api/github/repositories/:owner/:repo` - Get repository details
- `GET /api/github/repositories/:owner/:repo/tree` - Get repository tree

### Analysis
- `GET /api/dashboard/metrics` - Dashboard metrics
- `GET /api/dashboard/insights` - Temporal insights
- `POST /api/risk/analyze` - AI risk analysis for PR
- `GET /api/risk` - All risk analyses
- `GET /api/contributors` - Contributor intelligence
- `POST /api/architecture/analyze` - Architecture analysis
- `POST /api/sprint/analyze` - Sprint analysis
- `POST /api/refactor/generate` - Generate refactor plan
- `POST /api/simulations/run` - Run simulation

### Governance
- `GET /api/governance/rules` - List governance rules
- `POST /api/governance/rules` - Create rule
- `PATCH /api/governance/rules/:id` - Update rule
- `DELETE /api/governance/rules/:id` - Delete rule

---

## 🎨 Design System

- **Fonts:** IBM Plex Sans (body), IBM Plex Mono (code)
- **Theme:** Dark mode default, light mode support
- **Colors:** Carbon Design System inspired palette
- **Components:** Full Shadcn/ui component library
- **Accessibility:** WCAG 2.1 AA compliant

---

## 📊 Commit History & Collaboration

This project demonstrates excellent GitHub practices:

- ✅ **Feature branches** for each major feature
- ✅ **Pull Requests** with detailed descriptions
- ✅ **Code reviews** and feedback integration
- ✅ **Issue tracking** for bugs and features
- ✅ **Clean commit messages** following conventional commits
- ✅ **Documentation** updates with each feature

### Branch Strategy
- `main` - Production-ready code
- `develop` - Integration branch
- `feature/*` - Feature development
- `fix/*` - Bug fixes

---

## 🏆 Hackathon Judging Criteria Alignment

### ✅ Best Use of GitHub
- **GitHub OAuth** for secure authentication
- **GitHub REST API** for comprehensive repository analysis
- **GitHub Actions** for automation workflows
- **Pull Request workflow** with proper branching
- **Issue tracking** and project management
- **Repository structure** following best practices

### ✅ Best Contribution
- **Clean commit history** with meaningful messages
- **Feature branches** and PR workflow
- **Code reviews** and collaboration
- **Documentation** and README
- **Open source ready** structure

### ✅ Most Interesting Copilot-Powered Project
- **AI-driven risk analysis** using Copilot-generated algorithms
- **Refactor planning** with Copilot assistance
- **Pattern recognition** and temporal intelligence
- **Code generation** for components and utilities
- **Documentation** generated with Copilot help

---

## 🔮 Future Enhancements

- [ ] GitHub Webhooks integration for real-time updates
- [ ] GitHub App installation for organization-wide analysis
- [ ] CLI tool for local repository analysis
- [ ] VS Code extension integration
- [ ] Slack/Discord notifications
- [ ] Advanced machine learning models
- [ ] Multi-repository analysis
- [ ] Team collaboration features

---

## 📝 License

MIT License - See LICENSE file for details

---

## 👥 Contributors

Built with ❤️ for CODE FIESTA Hackathon




---



---

**Built for CODE FIESTA Hackathon - "Connect. Collaborate. Code."** 🚀

