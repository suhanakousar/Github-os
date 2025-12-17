# GitMind OS Design Guidelines

## Design Approach
**System**: Carbon Design System (IBM) - Purpose-built for data-intensive enterprise applications with strong patterns for analytics dashboards, complex data visualization, and developer tools.

**Rationale**: GitMind OS is a professional intelligence platform for engineers requiring clarity, efficiency, and sophisticated data presentation. Carbon excels at information hierarchy, structured layouts, and accessibility in technical contexts.

## Typography System

**Font Stack**: 
- Primary: IBM Plex Sans (via Google Fonts)
- Monospace: IBM Plex Mono (for code, metrics, technical data)

**Hierarchy**:
- Hero/Page Titles: text-4xl font-semibold tracking-tight
- Section Headers: text-2xl font-semibold 
- Subsection Headers: text-xl font-medium
- Body Text: text-base font-normal leading-relaxed
- Metrics/Data: text-sm font-mono
- Labels/Captions: text-xs uppercase tracking-wide font-medium

## Layout System

**Spacing Primitives**: Use Tailwind units of **2, 4, 8, 12, 16** exclusively
- Component padding: p-4, p-6, p-8
- Section spacing: space-y-8, gap-8
- Grid gaps: gap-4, gap-6
- Margins: m-4, m-8, m-12

**Grid Structure**:
- Dashboard: 12-column grid (grid-cols-12)
- Cards: 2-3 column layouts (md:grid-cols-2 lg:grid-cols-3)
- Data tables: Full-width with internal column structure
- Sidebar + Main: 64-unit fixed sidebar (w-64) + flex-1 main content

## Component Library

**Navigation**:
- Top nav bar: Fixed header (h-16) with logo left, actions right
- Sidebar: Fixed left panel (w-64) with hierarchical navigation, collapsible sections
- Breadcrumbs: Below header for deep navigation context

**Data Display**:
- Metric Cards: Compact cards showing KPIs with trend indicators (↑↓), primary number large (text-3xl), label small
- Risk Badges: Pill-shaped indicators (rounded-full px-3 py-1) with numeric scores
- Data Tables: Striped rows, sortable headers, fixed header on scroll, hover states
- Timeline Components: Vertical timeline for temporal analysis with connector lines
- Graph Visualizations: Chart.js or D3.js containers with consistent padding (p-6)

**Forms & Inputs**:
- Text Inputs: Clean borders (border-2), focused ring states, helper text below
- Select Dropdowns: Native styling with chevron indicators
- Toggles: For boolean governance rules
- Multi-select: For repository/contributor filtering

**Feedback Components**:
- Alert Banners: Full-width with icons (p-4, rounded-lg, border-l-4)
- Toast Notifications: Fixed top-right position for system feedback
- Loading States: Skeleton screens maintaining layout structure
- Empty States: Centered with icon, message, and action button

**Dashboard Layouts**:
- Overview Grid: 3-column metric cards at top (grid-cols-3 gap-6)
- Main Content Area: 2-column split for charts + detail panel (grid-cols-3, left col-span-2)
- Full-width Sections: Tables, timelines, and complex visualizations
- Sticky Elements: Headers and key metrics remain visible during scroll

**CLI Visualization**:
- Box-drawing characters for structure
- ANSI color codes (terminal compatible)
- Progress bars using ASCII characters
- Tabular data with aligned columns

## Animations

**Minimal & Purposeful Only**:
- Data updates: Smooth number transitions (duration-300)
- Card reveals: Subtle fade-in (opacity transitions)
- Loading spinners: Simple rotation for async operations
- NO scroll animations, parallax, or decorative motion

## Images

**No hero images required** - This is a data/analytics platform, not marketing.

**Icon Usage**:
- Use **Heroicons** (outline style) via CDN for UI elements
- Use consistent icon sizing: w-5 h-5 for inline, w-6 h-6 for buttons
- Risk indicators: Dedicated SVG icons (warning triangle, check circle, alert)

## Accessibility

- All interactive elements meet 44x44px touch target minimum
- Form inputs include visible labels and aria-labels
- Data tables include proper header associations
- Skip navigation links for keyboard users
- Focus indicators visible on all interactive elements (ring-2 ring-offset-2)

## Key Design Principles

1. **Information Density**: Pack data efficiently without overwhelming - use progressive disclosure
2. **Scanability**: Clear visual hierarchy enables quick metric scanning
3. **Consistency**: Reuse patterns across all intelligence layers
4. **Performance**: Lightweight components, lazy-load heavy visualizations
5. **Professional Credibility**: Enterprise-grade polish expected by technical users