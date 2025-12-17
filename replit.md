# GitMind OS - AI-Driven GitHub Intelligence Platform

## Overview
GitMind OS is an enterprise-grade AI-driven GitHub Intelligence & Governance Platform featuring:
- Multi-dimensional risk analysis (Code, Process, Human, Architectural, Release)
- Temporal intelligence and velocity tracking
- Architectural drift detection
- AI-driven refactor planning
- Contributor intelligence and SPOF detection
- Sprint prediction and analysis
- Automated governance (policy-as-code)
- Predictive failure detection
- Developer simulation mode

## Project Architecture

### Frontend (React + TypeScript)
- **Framework**: React with TypeScript, Vite bundler
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query for server state
- **UI Components**: Shadcn/ui with Radix primitives
- **Styling**: Tailwind CSS with IBM Plex fonts (Carbon Design System inspired)
- **Charts**: Recharts for data visualization

### Backend (Express + TypeScript)
- **Framework**: Express.js with TypeScript
- **AI Integration**: OpenAI GPT-4o for intelligent analysis
- **Storage**: In-memory storage (MemStorage class)
- **API Design**: RESTful endpoints for all features

### Key Files
- `shared/schema.ts` - Data models and types (Drizzle ORM compatible)
- `server/storage.ts` - Storage interface and implementation
- `server/routes.ts` - All API endpoints
- `client/src/App.tsx` - Main app with routing
- `client/src/components/` - Reusable UI components
- `client/src/pages/` - Page components for each feature

## Pages & Features

1. **Dashboard** (`/`) - Health score, metrics, velocity trends, insights
2. **Knowledge Graph** (`/knowledge-graph`) - Repository entity visualization
3. **Risk Analysis** (`/risk-analysis`) - Multi-dimensional PR risk assessment
4. **Temporal Intelligence** (`/temporal`) - Time-aware repository evolution
5. **Contributors** (`/contributors`) - Contributor profiles and SPOF detection
6. **Sprint Analysis** (`/sprint`) - Sprint risk and completion prediction
7. **Architecture** (`/architecture`) - Drift detection and suggestions
8. **Predictions** (`/predictions`) - Bug/revert/deadline predictions
9. **Governance** (`/governance`) - Policy-as-code rule management
10. **Refactor Planner** (`/refactor`) - AI-generated refactoring plans
11. **Simulation** (`/simulation`) - What-if scenario analysis
12. **Settings** (`/settings`) - Configuration options
13. **Help** (`/help`) - Documentation and guides

## API Endpoints

- `GET /api/dashboard/metrics` - Dashboard metrics
- `GET /api/dashboard/insights` - Temporal insights
- `GET /api/risk` - All risk analyses
- `GET /api/risk/high` - High-risk items only
- `POST /api/risk/analyze` - AI risk analysis for a PR
- `GET /api/contributors` - Contributor list
- `GET /api/architecture/drifts` - Architecture issues
- `POST /api/architecture/analyze` - AI architecture analysis
- `GET /api/governance/rules` - Governance rules
- `POST /api/governance/rules` - Create rule
- `PATCH /api/governance/rules/:id` - Update rule
- `DELETE /api/governance/rules/:id` - Delete rule
- `GET /api/sprint/current` - Current sprint analysis
- `POST /api/sprint/analyze` - AI sprint analysis
- `GET /api/predictions` - All predictions
- `POST /api/predictions/generate` - Generate new prediction
- `GET /api/refactor/plans` - Refactor plans
- `POST /api/refactor/generate` - AI-generate refactor plan
- `GET /api/simulations` - Past simulations
- `POST /api/simulations/run` - Run new simulation

## Design System
- **Fonts**: IBM Plex Sans (body), IBM Plex Mono (code/numbers)
- **Theme**: Dark mode default, Carbon Design System inspired
- **Colors**: Professional enterprise palette with semantic colors
- **Components**: Full Shadcn/ui library with custom extensions

## Running the Project
```bash
npm run dev
```
Server runs on port 5000, serving both frontend and API.

## Environment Variables
- `OPENAI_API_KEY` - Required for AI-powered analysis features
- `SESSION_SECRET` - Session encryption (auto-generated)

## Recent Changes
- December 2024: Initial implementation of GitMind OS v1.0
  - Complete frontend with 13 pages and 17+ reusable components
  - Backend with full API endpoints and Zod validation
  - OpenAI integration for intelligent analysis
  - Carbon Design System styling with dark/light mode support
  
- December 17, 2024: Integration & Polish
  - Added Zod validation to all POST endpoints for request body validation
  - Fixed NaN calculation bug in contributors page (avgQuality)
  - Comprehensive data-testid attributes across all interactive elements
  - Improved error handling with proper 400 responses for invalid requests
  - Full TanStack Query integration with proper loading states

## Testing Attributes
All interactive elements have data-testid attributes for testing:
- Navigation: `nav-item-*`, `button-sidebar-toggle`
- Forms: `input-*`, `button-*`, `select-*`
- Cards: `*-card-*`, `plan-card-*`, `rule-card-*`
- Tabs: `tab-*`, `settings-tab-*`
- Metrics: `metric-*`
