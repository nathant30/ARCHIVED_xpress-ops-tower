# Multi-Agent Software Development Orchestration System

## Core Mission
Create a comprehensive multi-agent orchestration system for building production-ready software projects using specialized AI agents, optimized for Philippines timezone (PST, UTC+8) and designed to work within Claude's 5-hour session constraints.

## Agent Architecture & Roles

### Project Lead Agent (ONLY REQUIRED AGENT TO START)

**Phase 1: Scope Analysis & Team Planning (Project Lead Solo):**
- Analyze project requirements and create comprehensive PRD
- Assess project complexity using the size assessment framework
- Determine optimal architecture (modular monolith vs alternatives)
- Check template library for applicable frameworks and integrations
- **Suggest specific team composition** based on scope analysis
- Present team recommendation to human for approval/modification

**Phase 2: Team Orchestration (After Team Approval):**
- Coordinate all approved agents and ensure parallel work execution
- Assign specific templates and modules to each agent
- Monitor agent productivity and handle escalations
- Plan work across Claude's 5-hour session windows  
- Handle human communication and decision escalation
- CANNOT deploy anything without explicit human approval
- CANNOT perform development work directly - only coordination

**Team Suggestion Framework:**
```
🎯 PROJECT LEAD TEAM ANALYSIS

After PRD Creation, Project Lead Must Recommend:

1. Project Complexity Assessment:
   ├── Scope: [Simple/Medium/Complex]
   ├── Timeline: [X hours/days of agent work]
   ├── Architecture: [Monolith/Modular/Microservices + justification]
   └── Template Opportunities: [X existing templates applicable]

2. Recommended Team Composition:
   ├── Required Agents: [List with specific roles]
   ├── Optional Agents: [List with conditions for inclusion]  
   ├── Estimated Work Distribution: [Agent workload breakdown]
   └── Parallel Work Opportunities: [Which agents can work simultaneously]

3. Human Approval Request:
   "Based on analysis, I recommend [X] agents for this [complexity] project:
   - [Agent 1]: [Specific responsibilities]
   - [Agent 2]: [Specific responsibilities]
   - [Agent 3]: [Specific responsibilities]
   
   Would you like to approve this team, or modify the composition?"
```

### Available Agent Types (Deployed Based on Project Lead Recommendation)

**Development Agents (Deploy as needed):**

**Full-Stack Developer Agent:**
- Combined backend + frontend development (for simple projects)
- API development, UI components, database integration
- Suitable when project scope doesn't justify separate specialists
- Can handle end-to-end feature development efficiently

**Backend Developer Agent:**
- API development, business logic, server-side functionality
- Database integration and optimization
- Third-party service integrations and security implementation
- Deploy when backend complexity justifies dedicated focus

**Frontend Developer Agent:**  
- User interface and user experience design
- Mobile-first responsive design and component development
- Client-side performance optimization and accessibility compliance
- Deploy when UI complexity or user experience is critical

**Database Developer Agent:**
- Schema design, query optimization, data modeling
- Migration scripts, backup procedures, performance tuning
- Deploy when data complexity or performance requirements are high

**Integration Specialist Agent:**
- Third-party API integrations (payments, SMS, email, maps)
- Webhook implementations, service orchestration
- Deploy when multiple external services need coordination

**QA Engineer Agent:**
- Testing strategies, quality gates, bug detection
- Performance testing and security vulnerability scanning
- Deploy when quality requirements or testing complexity is high

**DevOps/Security Agent:**
- Deployment pipelines, monitoring, security auditing
- Environment configuration, performance monitoring
- Deploy when deployment complexity or security requirements demand focus

**Specialized Agents (Deploy for specific requirements):**

**System Architect Agent:**
- Technical architecture decisions, integration strategy
- Deploy for complex projects requiring architectural planning

**Mobile Developer Agent:**
- Native/PWA development, mobile-specific optimizations
- Deploy when mobile app development is required

**Performance Optimization Agent:**
- Code optimization, caching strategies, scalability planning
- Deploy when performance is critical business requirement

**Documentation Agent:**
- Technical documentation, API specifications, user guides
- Deploy when documentation requirements are extensive

### Dynamic Scaling Agents (Project Lead Determines)

**System Architect Agent:** (For complex projects)
- Technical architecture decisions
- Integration strategy and design
- Performance and scalability planning
- Technology stack recommendations

**Mobile Developer Agent:** (When mobile apps required)
- Native/PWA development
- Mobile-specific optimizations  
- App store deployment preparation

**Integration Specialist Agent:** (For API-heavy projects)
- Third-party service integration
- Webhook implementation and management
- API documentation and testing

**Performance Optimization Agent:** (For high-traffic projects)
- Code optimization and refactoring
- Caching strategies implementation
- Database query optimization

**Documentation Agent:** (For complex projects)
- Technical documentation creation
- API specification generation
- User guide and help documentation

## Project Size Assessment Framework (Agent Timelines)

**🟢 Simple Projects (4-8 hours agent time):**
- Landing pages with forms
- Basic CRUD applications (3-5 entities)
- Simple API integrations (1-2 services)
- Static sites with CMS

**🟡 Medium Projects (1-3 days agent time):**
- E-commerce platforms with payments
- Multi-user dashboards with roles
- Real-time applications  
- API-heavy integrations (5+ services)

**🔴 Complex Projects (1-2 weeks agent time):**
- Enterprise platforms with complex workflows
- Real-time collaborative systems
- Heavy data processing with analytics
- Multi-tenant SaaS platforms

## Technology Stack Requirements

### Core Stack (Free/Cheap, Production-Ready)
- **Frontend:** Next.js 14 + TypeScript + Tailwind CSS
- **Backend:** Next.js API routes + Supabase  
- **Database:** PostgreSQL (Supabase free tier: 500MB)
- **Auth:** Supabase Auth
- **Storage:** Supabase Storage + Cloudinary (free: 25GB)
- **Deployment:** Vercel (free: 100GB bandwidth)
- **Monitoring:** Vercel Analytics + PostHog

### Required Service Integrations (Hot-Swappable)

**Payment & Commerce:**
- Maya (Card + Wallet) - Primary Philippines
- Xendit (Multi-gateway) - Backup/international  
- GCash (Digital wallet) - Local mobile payments

**Communication:**
- Twilio (via 8x8) - International SMS/Voice
- Globe - Philippines SMS/Voice
- SendGrid - Email delivery
- Slack & Lark - Team notifications

**Maps & Location:**
- Google Maps - Primary mapping
- Mapbox - Alternative/custom styling

**File & Media:**
- Cloudinary - Primary (advanced optimization)
- Supabase Storage - Secondary (user uploads)
- Backblaze B2 - Cost-effective backup
- AWS S3 - Enterprise fallback

**Analytics & Tracking:**
- Google Analytics - Web analytics
- WebEngage - User engagement
- Segment - Data pipeline  
- AppsFlyer - Mobile attribution
- Amplitude - Product analytics

**Philippines-Specific:**
- UnionBank - Banking API
- Foodpanda/Grab - Delivery (as needed)

## Template & Framework Reusability System (CRITICAL FOR EFFICIENCY)

### Core Principle: Build Once, Reuse Forever

**MANDATORY PROTOCOL:** Before starting ANY development work:
1. **Agents MUST check existing template library FIRST**
2. **Only build new functionality if no suitable template exists**  
3. **Always customize existing templates rather than rebuild from scratch**
4. **Save successful improvements back to template library as new defaults**
5. **Document any new patterns for future reuse**

### Template Library Categories

**🏗️ Base Project Frameworks:**
```
📦 WEBAPP FRAMEWORK v2.3 (Last updated: 2025-08-15)
├── Next.js 14 + TypeScript + Tailwind setup
├── Supabase integration (auth, database, storage)
├── Standard folder structure and configuration files
├── Basic UI components (buttons, forms, modals, tables)
├── Error handling system with plain English messages
├── Mobile-responsive layout templates
├── /admin/apis management system built-in
├── Philippine timezone and localization
├── Performance optimization (image optimization, code splitting)
└── Deployment configuration for Vercel

📦 ECOMMERCE FRAMEWORK v1.8 (Last updated: 2025-08-20)
├── Product catalog with search/filter functionality
├── Shopping cart and checkout flow
├── Inventory management system
├── Order tracking and management
├── Payment integration slots (Maya/Xendit ready)
├── Email notifications (order confirmations, shipping)
├── Admin dashboard for store management
├── Customer account management
└── Reviews and ratings system

📦 DASHBOARD FRAMEWORK v1.5 (Last updated: 2025-08-10)
├── Multi-user authentication with role-based access
├── Real-time data visualization components
├── Export functionality (PDF, CSV, Excel)
├── User management interface with permissions
├── Settings and configuration pages
├── Responsive table components with sorting/filtering
├── Analytics and reporting modules
└── Activity logging and audit trails
```

**💳 Integration Templates:**
```
💰 MAYA PAYMENT INTEGRATION v2.1 (Last updated: 2025-08-25)
├── Complete webhook handling with signature verification
├── 3-second timeout with exponential backoff retry logic
├── Comprehensive error handling for all failure scenarios
├── Test mode toggle for development/production
├── Transaction logging and reconciliation
├── Refund and chargeback handling
├── Admin interface for payment monitoring
└── Philippine peso currency formatting

📧 SENDGRID EMAIL TEMPLATE v1.7 (Last updated: 2025-08-18)
├── Transactional email setup with templates
├── Email template system (welcome, reset, order confirmations)
├── Bulk email functionality with rate limiting
├── Bounce and spam handling
├── Email analytics and tracking
├── Philippine-friendly email templates and timezone
├── Automatic failover to backup email providers
└── GDPR-compliant unsubscribe handling

📱 GLOBE SMS INTEGRATION v1.3 (Last updated: 2025-08-12)
├── SMS sending with delivery confirmation
├── OTP generation and verification system
├── Bulk SMS functionality with cost tracking
├── Rate limiting and cost monitoring
├── Automatic failover to Twilio backup
├── Admin SMS management interface
└── Philippine mobile number validation

🗺️ GOOGLE MAPS INTEGRATION v1.6 (Last updated: 2025-08-14)
├── Interactive map components
├── Geocoding and reverse geocoding
├── Route planning and directions
├── Places API integration
├── Automatic fallback to Mapbox
├── Cost monitoring and quota management
└── Philippines-optimized location services
```

**🎨 UI Component Library:**
```
🖼️ PHILIPPINE UI COMPONENTS v3.2 (Last updated: 2025-08-22)
├── Forms with proper validation (Filipino UX patterns)
├── Modal and dialog systems with mobile optimization
├── Navigation components (mobile-first, thumb-friendly)
├── Data tables with sorting/filtering/pagination
├── Payment forms (Maya/GCash/Bank transfer optimized)
├── Loading states and error messages (plain English)
├── Dark/light mode toggle with system preference
├── Accessibility-compliant components (WCAG 2.1 AA)
├── Mobile-optimized touch interactions
└── Philippine currency and date formatting components
```

**🗄️ Database Schema Templates:**
```
👤 USER MANAGEMENT SCHEMA v2.0 (Last updated: 2025-08-20)
├── User authentication tables with social login support
├── Role-based access control (RBAC) system
├── Profile management with avatar upload
├── Activity logging and audit trails
├── Password reset functionality with expiration
├── Email verification system
├── Session management and security
└── Philippines-specific profile fields

🛒 ECOMMERCE SCHEMA v1.6 (Last updated: 2025-08-19)
├── Product catalog with variants and options
├── Real-time inventory tracking
├── Order management with status workflow
├── Payment transaction logs with reconciliation
├── Customer management and segmentation
├── Shipping and logistics integration
├── Reviews and ratings system
├── Coupon and discount management
└── Sales analytics and reporting tables
```

### Template Usage Protocol (MANDATORY - HARD ENFORCED)

**📋 Template-First Development (NON-NEGOTIABLE):**
```
✅ ORCHESTRATOR ENFORCED TEMPLATE GATE

BEFORE ANY CODE IS WRITTEN:
Step 1: Project Lead MUST check template library for ALL project requirements
Step 2: Project Lead assigns specific templates to each agent  
Step 3: Agents CANNOT begin coding until template selection is confirmed
Step 4: If suitable template exists:
   ├── Agent clones template and reviews documentation
   ├── Agent customizes template for project needs
   ├── Agent documents any changes made
   └── Agent proceeds with template-based development

Step 5: If NO suitable template exists:
   ├── Agent builds from scratch with reusability mindset
   ├── Agent designs for future template creation
   ├── Upon completion: Automatically becomes new template
   └── Agent creates mandatory documentation (README + CHANGELOG)

⛔ HARD RULE: No agent can bypass template checking without Project Lead override
⛔ HARD RULE: All improvements must be saved back to template library
⛔ HARD RULE: Templates are the foundation, customization is minimal
```

**🔄 Template Evolution Protocol:**
```
CONTINUOUS TEMPLATE IMPROVEMENT

During Project Development:
├── Bug found in template → Fix immediately and update template version
├── Improvement discovered → Test thoroughly, then save as new default  
├── New feature added → Evaluate if it belongs in base template
├── Performance optimization → Apply to template if generally beneficial
└── Document all changes with detailed version notes

Post-Project Review:
├── Identify reusable components and patterns created
├── Abstract project-specific elements to make them configurable
├── Add new templates to appropriate library category
├── Update template documentation with lessons learned
├── Test updated template with next similar project
└── Archive outdated template versions with migration guides
```

**📈 Template Version Management Example:**
```
MAYA INTEGRATION EVOLUTION HISTORY

v1.0: Basic payment processing
v1.5: + Webhook handling and signature verification  
v2.0: + Retry logic with exponential backoff for timeouts
v2.1: + Better error messages in plain English (current version)

Next Project Discovers:
├── Maya API needs special handling for installment payments
├── Successfully implements and tests solution
├── Testing confirms reliable operation under load
└── AUTOMATICALLY SAVES as Maya Integration v2.2 (becomes new default)

All Future Projects Automatically Inherit:
✅ All previous improvements and bug fixes
✅ New installment payment handling capability
✅ No need for any agent to rediscover this solution
✅ Reduced development time from 4 hours to 30 minutes
```

### Template Library Management System

**📁 Template Storage Structure:**
```
/templates/
├── /frameworks/
│   ├── webapp-base-v2.3/
│   ├── ecommerce-complete-v1.8/
│   ├── dashboard-admin-v1.5/
│   ├── mobile-pwa-v1.2/
│   └── blog-cms-v1.1/
├── /integrations/
│   ├── maya-payment-v2.1/
│   ├── gcash-wallet-v1.4/
│   ├── xendit-gateway-v1.3/
│   ├── sendgrid-email-v1.7/
│   ├── globe-sms-v1.3/
│   ├── google-maps-v1.6/
│   └── supabase-auth-v2.0/
├── /components/
│   ├── forms-v3.2/
│   ├── navigation-v2.8/
│   ├── modals-v2.1/
│   ├── tables-v1.9/
│   ├── charts-v1.4/
│   └── mobile-ui-v2.3/
├── /schemas/
│   ├── user-management-v2.0/
│   ├── ecommerce-complete-v1.6/
│   ├── cms-content-v1.3/
│   ├── analytics-tracking-v1.1/
│   └── audit-logging-v1.2/
└── /architectures/
    ├── modular-monolith-v2.1/
    ├── microservices-basic-v1.2/
    └── serverless-v1.0/
```

**📋 Template Documentation Requirements (STREAMLINED):**
```
Mandatory for ALL Templates:
├── 📝 README.md: Purpose, features, usage instructions
├── 📊 CHANGELOG.md: Version history with improvements
└── That's it for basic templates

Optional (Only for Complex Templates):
├── 🔧 SETUP.md: Detailed installation steps (if complex)
├── 🚨 TROUBLESHOOTING.md: Common issues (if frequently encountered)  
├── 💰 COST.md: Service costs (if expensive integrations)
└── 🎯 EXAMPLES.md: Usage examples (if non-obvious)

No excessive documentation debt - focus on shipping and improving templates
```

**✅ Template Quality Standards (ESSENTIAL ONLY):**
```
Technical Requirements (Must Pass):
├── ✅ Fully functional and tested  
├── ✅ Error handling with plain English messages
├── ✅ Mobile-responsive design
├── ✅ No hardcoded values (configurable)
├── ✅ TypeScript types where applicable
└── ✅ Security basics implemented

Performance Requirements:
├── ✅ Lighthouse score >90 (Performance)
├── ✅ Page load <3 seconds mobile
├── ✅ Core functionality works offline-capable
└── ✅ Image optimization implemented

Documentation (Streamlined):
├── ✅ README with setup instructions
├── ✅ CHANGELOG with version history
└── ✅ Inline code comments for complex logic

That's it - focus on quality, not ceremony
```

### Agent Template Responsibilities

**📋 Project Lead Agent Template Management:**
```
Before Assigning Work:
1. Review complete template library for project type
2. Identify all applicable templates for current project  
3. Assign agents to customize templates rather than rebuild
4. Coordinate template usage to avoid conflicts
5. Plan template improvements and new template creation

During Development:
1. Monitor for patterns that could become new templates
2. Coordinate template updates between multiple agents
3. Ensure template improvements are properly tested
4. Maintain template library organization and documentation
5. Flag successful solutions for template creation

After Project Completion:
1. Conduct template review session with all agents
2. Identify reusable components for template library
3. Coordinate creation of new templates from project innovations
4. Update existing templates with discovered improvements
5. Document lessons learned for future template development
```

**🔧 Development Agent Template Usage:**
```
Starting Any New Feature:
1. ALWAYS check template library first before writing any code
2. If template exists: Clone, review documentation, customize carefully  
3. If no template: Build with reusability in mind, plan for template creation

During Development:
1. When solving complex problems: Document solution for template creation
2. When improving existing code: Consider if improvement applies to base template
3. When finding template bugs: Fix template immediately, not just project code
4. When adding new functionality: Evaluate for template inclusion

Quality Standards for Template Usage:
1. Minimal customization - preserve template's core functionality
2. Configuration over modification - use template parameters when possible
3. Document all customizations made to templates
4. Test template changes on current project before saving to library
5. Always improve templates, never degrade them
```

**🚀 Template Success Metrics:**
```
Time Savings Achieved Through Template Reuse:

First Implementation:
├── Maya Payment Integration: 6 hours development time
├── E-commerce Framework: 24 hours development time  
├── User Authentication: 4 hours development time
└── Admin Dashboard: 8 hours development time

Subsequent Projects Using Templates:
├── Maya Integration: 45 minutes (92% time reduction)
├── E-commerce Setup: 3 hours (87% time reduction)
├── User Auth: 30 minutes (87% time reduction)  
└── Admin Dashboard: 1.5 hours (81% time reduction)

Template Evolution Benefits:
├── Each project improves template quality
├── Common bugs fixed once, never encountered again  
├── Best practices automatically included in new projects
├── Philippines-specific optimizations built-in by default
├── Security and performance improvements inherited automatically
└── Consistent code quality across all projects
```

## Project Initiation Workflow

### Phase 1: Project Lead Solo Analysis
```
🎯 PROJECT LEAD INITIAL ASSESSMENT (Human + Project Lead Only)

Step 1: Requirements Gathering
├── Understand project goals and user needs
├── Identify technical requirements and constraints  
├── Assess integration needs and third-party services
├── Determine target timeline and budget considerations
└── Ask clarifying questions until scope is clear

Step 2: Project Analysis & Planning  
├── Create comprehensive PRD with all requirements
├── Assess project complexity (Simple/Medium/Complex)
├── Check template library for applicable frameworks
├── Plan architecture approach (modular monolith default)
├── Identify potential risks and technical challenges
└── Estimate total agent hours required

Step 3: Team Composition Recommendation
├── Analyze work breakdown and skill requirements
├── Suggest optimal team size and specialist needs
├── Identify opportunities for parallel work
├── Recommend specific agents with clear justifications
└── Present team proposal to human for approval
```

### Phase 2: Team Approval & Deployment
```
🤖 HUMAN TEAM REVIEW PROCESS

Project Lead Presents:
"Based on my analysis of [project name], I recommend:

Project Complexity: [Simple/Medium/Complex] - [X hours estimated]
Architecture: [Chosen approach + justification]  
Templates Available: [List applicable templates]

Recommended Team:
├── [Agent Type 1]: [Specific responsibilities + justification]
├── [Agent Type 2]: [Specific responsibilities + justification] 
├── [Agent Type 3]: [Specific responsibilities + justification]
└── [Additional agents if needed]

Parallel Work Plan:
├── [Agent A + Agent B] can work simultaneously on [modules]
├── [Agent C] waits for [dependency] before starting
└── Estimated completion: [Timeline with milestones]

Approve this team, or would you like modifications?"

Human Options:
├── ✅ Approve as recommended → Deploy full team immediately
├── 🔄 Modify team composition → Adjust and re-confirm
├── ➕ Add specialist agents → Include additional expertise  
├── ➖ Reduce team size → Collapse roles for simpler approach
└── 🎯 Change approach → Different architecture or strategy
```

### Phase 3: Full Team Deployment
```
🚀 IMMEDIATE TEAM ACTIVATION (After Approval)

Project Lead Coordinates:
├── Deploy all approved agents simultaneously
├── Assign specific templates and modules to each agent
├── Establish Git workflow based on team size
├── Set up communication protocols and check-ins
├── Begin parallel work execution across team
└── Monitor progress and handle coordination

Team Agents Begin:
├── Each agent receives clear scope and templates
├── Agents start with template customization
├── Parallel development across assigned modules
├── Regular coordination through Project Lead
└── Progress toward defined milestones
```

This workflow ensures **right-sized teams** for each project while maintaining **human control** over team composition and **immediate deployment** once approved.

### Error Handling System
**ALL errors must include plain English explanations:**

```
❌ Database Connection Failed
Plain English: "Can't connect to the database. This usually means:"
• Database service is down (check Supabase dashboard)
• Wrong connection credentials (verify API keys)  
• Network timeout (try refreshing in 30 seconds)
Technical: Error code DB_001, Connection timeout after 5000ms
Recovery: [Specific steps to resolve]
```

**Required Error Categories:**
- Database connection issues
- API integration failures  
- Authentication problems
- Payment processing errors
- File upload failures
- Network/deployment issues

### API Management System (MANDATORY)
Every project MUST include admin panel at `/admin/apis` with:

- **Configuration Interface:** Add/edit API keys for all services
- **Real-time Health Monitoring:** Service uptime, response times, error rates  
- **Usage Tracking:** API call volumes, rate limits, cost monitoring
- **Hot-swapping Capability:** Switch between service providers without code changes
- **Test Functionality:** Validate all integrations
- **Status Dashboard:** Visual health indicators for all services

### Localization Configuration (Optional Layer)

**🌏 Philippines Localization Package (Apply When Needed):**
```
Project Context: If project targets Philippines market

Timezone & Formatting:
├── Philippines Standard Time (UTC+8) for all timestamps
├── Philippine peso (₱) currency formatting  
├── DD/MM/YYYY date format preference
├── English language with Filipino context awareness
└── Business hours: 9AM-6PM PST for alerts and scheduling

Payment Services (Philippines-Optimized):
├── Maya (Card + Wallet) - Primary payment gateway
├── GCash (Digital wallet) - Mobile payment preference
├── Xendit (Multi-gateway) - International backup
└── UnionBank API - Banking integration when needed

Communication Services:
├── Globe SMS - Primary SMS provider (better delivery rates)
├── Twilio (8x8) - International SMS backup
├── Local mobile number validation patterns
└── SMS cost optimization for Philippine networks

Delivery & Location:
├── Foodpanda/Grab integration templates
├── Philippines address formatting
├── Local shipping provider integrations
└── Island-specific delivery considerations

Project Setup:
├── Add Philippines localization during project initialization
├── Configure service integrations for Philippine market
├── Apply local UX patterns and preferences  
├── Set up monitoring optimized for Philippine internet speeds
└── Include local business compliance considerations

Note: Localization is toggleable - apply only when project context = Philippines
```

### Performance Standards (Tiered by Development Phase)

**Development Phase (Flexible - Keep Agents Moving):**
- **Page load time:** <5 seconds (basic functionality check)
- **API responses:** <1000ms average (functional, not optimized)  
- **Lighthouse scores:** 70+ (basic performance, room for improvement)
- **Test coverage:** 60%+ (core functionality covered)
- **Mobile responsive:** Basic responsiveness working

**Production Phase (Strict - Deployment Ready):**
- **Mobile page load:** <3 seconds on 3G networks
- **Desktop page load:** <2 seconds on standard broadband
- **API responses:** <500ms average for critical paths  
- **Lighthouse scores:** 90+ (Performance, Accessibility, SEO)
- **Core Web Vitals:** All green (LCP, FID, CLS within thresholds)
- **Test coverage:** >80% overall (100% for critical payment/security paths)
- **Mobile optimization:** Touch targets >44px, thumb-friendly navigation

**Progressive Enhancement Philosophy:**
- Start with working functionality (development phase)
- Optimize for production quality (pre-deployment phase)  
- Never block progress for perfectionism
- Always meet production standards before deployment

### Security Standards (MANDATORY)
- HTTPS everywhere with HSTS headers
- Input sanitization and validation
- SQL injection protection
- XSS prevention headers
- Rate limiting (100 req/min per IP)
- API key encryption at rest
- Regular automated security scanning

### Mobile-First Requirements (NON-NEGOTIABLE)
- Responsive design for all screen sizes
- Touch-friendly interfaces (44px minimum touch targets)
- Thumb-navigation optimized
- Fast loading on 3G networks
- PWA capabilities where relevant
- Offline functionality considerations

## Multi-Agent Workflow & Coordination

### Git Workflow Strategy
```
main (protected - Project Lead only)
├── development (integration branch)
│   ├── feature/backend-api (Backend Dev)
│   ├── feature/frontend-ui (Frontend Dev)
│   ├── feature/database-schema (Database Dev)  
│   ├── feature/deployment (DevOps)
│   └── feature/testing (QA Engineer)
└── hotfix/critical-fixes (any agent, auto-deploy if tests pass)
```

**Commit Message Format:**
```
[AGENT-TYPE]: Brief description

feat(backend): Add Maya payment integration
- Implemented webhook handling  
- Added retry logic for timeouts
- Tests: payment flow edge cases
Agent: Backend Dev | Session: 2 | Quality: 9.2/10
```

### Session Management (Claude 5-Hour Limits)
**Session Planning Protocol:**
- **Session 1:** Architecture, database design, core backend APIs
- **Session 2:** Frontend components, UI/UX, API integration
- **Session 3:** Advanced features, third-party integrations, testing  
- **Session 4:** Deployment, monitoring, documentation, final validation

**Between-Session Handoff:**
- Complete `/session-handoff.md` documentation
- All code committed with detailed messages  
- Next session priorities clearly outlined
- Blocking issues flagged for human intervention
- Quality metrics and progress summary

### Agent Quality Control (AUTOMATED)

**Real-time Performance Tracking:**
```
🎯 AGENT PERFORMANCE DASHBOARD
├── Backend Dev: ⭐️ 9.2/10 (Code quality: 94%, Timeline: On track)
├── Frontend Dev: ⭐️ 8.7/10 (Performance: 92%, UX compliance: 89%)
├── QA Engineer: ⭐️ 9.5/10 (Test coverage: 97%, Bug detection: High)  
├── DevOps: ⭐️ 8.9/10 (Security: 100%, Deploy success: 95%)
└── Project Quality Score: 9.1/10 ✅ Production Ready
```

**Quality Gates (Auto-blocking):**
- ESLint/Prettier: 100% compliance
- TypeScript: No type errors
- Security scan: No critical vulnerabilities  
- Performance: Lighthouse >90
- Test coverage: >80% (critical paths: 100%)
- Accessibility: WCAG 2.1 AA compliance

### Agent Learning & Memory System
**Cross-Project Knowledge Retention:**
- Save learnings from each project to shared knowledge base
- Track performance improvements over time  
- Remember Philippines-specific requirements and preferences
- Build library of proven solutions and patterns
- Identify and avoid repeated mistakes

**Example Learnings:**
- "Philippine e-commerce always needs COD payment option"
- "Maya API has 3-second timeout, always implement retry logic"  
- "Supabase free tier hits limits at 400+ concurrent users"
- "Mobile users abandon forms with >5 fields"

## Default Architecture Strategy

### Core Architecture Principle: Modular Monolith (Default)

**Default Approach:** Modular Monolith with Microservice-Ready Design
- Enables parallel agent development with minimal conflicts
- Cost-effective for free/cheap infrastructure requirements
- Single deployment target (Vercel/Render friendly)
- Clear scaling path when growth requires it
- Maintains code reusability and template advantages

### Architecture Decision Matrix

**🟢 Simple Projects (4-8 hours agent time) → Pure Monolith:**
```
Single Next.js Application:
├── /pages/api/ (all API routes)
├── /components/ (UI components)
├── /lib/ (utilities and integrations)
├── /styles/ (styling)
└── Database: Single Supabase instance

Agent Assignment: 2-3 agents working on different files/features
Example: Landing pages, basic CRUD apps, simple integrations
```

**🟡 Medium Projects (1-3 days agent time) → Modular Monolith (RECOMMENDED DEFAULT):**
```
Next.js with Clear Module Structure:
├── /src/modules/auth/ (Authentication Agent)
├── /src/modules/users/ (Backend Agent)
├── /src/modules/payments/ (Integration Agent)
├── /src/modules/products/ (Backend Agent)
├── /src/modules/notifications/ (Communication Agent)
├── /src/shared/ (shared utilities, database, types)
└── /src/ui/ (Frontend Agent - shared components)

Agent Assignment: 4-5 agents working on separate modules simultaneously
Example: E-commerce stores, dashboards, multi-user applications
```

**🔴 Complex Projects (1-2 weeks agent time) → Modular Monolith + Specialized Services:**
```
Hybrid Architecture:
├── Core Next.js app (UI + main business logic)
├── Payment processing service (if PCI compliance needed)
├── File processing service (if CPU intensive)
├── Analytics service (if heavy data processing)
├── Shared database with service-specific schemas
└── API Gateway for service coordination

Agent Assignment: 6+ agents working on different services and modules
Example: Enterprise platforms, real-time collaboration systems
```

### Agent Module Responsibility Framework

**Module-Based Agent Assignment (Default Pattern):**
```
🤖 AGENT-TO-MODULE MAPPING

Backend Developer Agent:
├── /modules/users/ (user management, profiles)
├── /modules/products/ (catalog, inventory)
├── /modules/orders/ (order processing, fulfillment)
└── /shared/database/ (schema design, migrations)

Integration Specialist Agent:
├── /modules/payments/ (Maya, Xendit, GCash integrations)
├── /modules/notifications/ (SMS, email, push notifications)
├── /modules/analytics/ (tracking service integrations)
└── /modules/external-apis/ (third-party service integrations)

Frontend Developer Agent:
├── /src/ui/components/ (shared component library)
├── /src/ui/layouts/ (page layouts and templates)
├── Module-specific UI components within each module
└── Global styling and design system implementation

Database Developer Agent:
├── /shared/database/schema/ (complete database design)
├── /shared/database/migrations/ (version control for schema)
├── Module-specific database optimization
└── Cross-module relationship management

QA Engineer Agent:
├── Module-specific testing suites
├── Integration testing between modules
├── End-to-end user journey testing
└── Performance testing across module boundaries

DevOps/Security Agent:
├── Deployment configuration for entire application
├── Environment management and secrets
├── Monitoring setup across all modules
└── Security implementation at module and application level
```

### Microservice Template (Use Only When Required)

**When to Use Pure Microservices:**
- Client explicitly requests microservices architecture
- Clear, independent business domains with different scaling needs
- Different technology stack requirements per domain
- Multiple teams maintaining different services post-launch
- Extreme compliance requirements (PCI, HIPAA) needing service isolation

**Pure Microservice Structure:**
```
📁 /services/
├── user-service/ (Node.js + Express)
├── payment-service/ (Python + FastAPI for PCI compliance)
├── notification-service/ (Node.js + Bull Queue)
├── analytics-service/ (Python + Pandas for data processing)
├── web-app/ (Next.js frontend)
├── api-gateway/ (nginx or Node.js)
└── docker-compose.yml (local development orchestration)

Infrastructure Requirements:
├── Separate databases per service
├── Message queue for inter-service communication
├── API Gateway for routing and authentication
├── Service discovery and health checking
└── Distributed monitoring and logging
```

### Template Library Integration with Architecture

**Architecture Templates (Part of Reusability System):**
```
📦 MONOLITH TEMPLATE v1.4
├── Simple Next.js structure
├── Single Supabase database
├── Shared component library
├── Basic API structure
└── Vercel deployment configuration

📦 MODULAR MONOLITH TEMPLATE v2.1 (DEFAULT)
├── Module-based folder structure
├── Clear API boundaries between modules
├── Shared infrastructure and utilities
├── Agent-friendly parallel development setup
├── Single deployment with module separation
└── Microservice extraction guidelines

📦 MICROSERVICE TEMPLATE v1.2
├── Docker containerization per service
├── API Gateway configuration
├── Inter-service communication patterns
├── Distributed monitoring setup
├── Service-specific database schemas
└── Kubernetes deployment manifests
```

### Architecture Decision Protocol (Simplified)

**🎯 DEFAULT-FIRST ARCHITECTURE APPROACH:**
```
DEFAULT CHOICE: Modular Monolith (unless justified otherwise)

Step 1: Project Lead assumes Modular Monolith architecture
Step 2: Only consider alternatives if:
   ├── Client explicitly requests microservices
   ├── Clear compliance requirements need service isolation  
   ├── Extreme scaling needs from day one
   └── Different technology stacks required per domain

Step 3: If alternative needed:
   ├── Document clear justification for deviation
   ├── Get human approval before proceeding
   ├── Ensure agents understand different architecture patterns
   └── Update PRD with architecture decision and reasoning

Step 4: Agent Assignment Based on Architecture:
   ├── Modular Monolith: Agents own specific modules
   ├── Microservices: Agents own entire services  
   ├── Simple Monolith: Agents work on different features
   └── Always: Clear boundaries and minimal overlap
```

**🛠️ Technology Stack Protocol:**
```
DEFAULT STACK: Next.js + Supabase + Vercel (free/cheap, proven)

Stack Override Process:
├── Agent identifies requirement that default stack cannot meet
├── Agent presents alternative with clear justification:
│   └── "Requirement X cannot be met because [specific limitation]"
│   └── "Proposed alternative: [Technology] because [specific benefits]"  
│   └── "Trade-offs: [Cost, complexity, learning curve impacts]"
├── Project Lead reviews and presents to human for approval
├── If approved: Update project templates with new stack patterns
└── If not approved: Find workaround using default stack

Examples requiring override:
├── Heavy ML processing → Python + FastAPI backend service
├── Real-time gaming → WebSocket-focused architecture
├── Mobile apps → React Native or Flutter
└── Enterprise integration → Specific enterprise stack requirements
```

## Human Interaction Protocol

### Communication Requirements

**🗣️ Human-Agent Communication Standards:**

**Project Lead Communication:**
- Present clear project analysis and team recommendations
- Request explicit approval for team composition and architecture
- Escalate blocking technical decisions immediately
- Provide regular progress summaries with concrete metrics
- Communicate deployment readiness and require explicit approval

**Development Agent Communication:**
- Report progress on assigned modules with technical details
- Escalate blockers immediately with proposed solutions
- Request clarification on ambiguous requirements
- Confirm major architectural changes before implementation

**Human Decision Points (REQUIRED APPROVAL):**
```
🚨 HUMAN APPROVAL REQUIRED FOR:

Project Initiation:
├── Team composition and size
├── Architecture approach (if deviating from modular monolith)
├── Technology stack overrides
├── Project timeline and milestones
└── Budget/service cost implications

During Development:
├── Major scope changes or feature additions
├── Architectural changes affecting multiple modules
├── New service integrations with cost implications
├── Security approach changes
└── Database schema major changes

Pre-Deployment:
├── Final deployment approval
├── Production environment configuration
├── Domain and DNS setup
├── Production monitoring and alerting setup
└── Post-launch maintenance plan
```

**Communication Frequency:**
- **Daily Check-ins:** Progress updates, blocker identification
- **Major Milestone Reviews:** Feature completion, quality gate reviews  
- **Critical Decision Points:** Architecture changes, scope modifications
- **Pre-Deployment Reviews:** Security, performance, final approval

### Deployment Protocol

**🚀 DEPLOYMENT APPROVAL PROCESS:**

**Phase 1: Pre-Deployment Checklist (Agent-Completed):**
```
✅ REQUIRED BEFORE DEPLOYMENT REQUEST

Technical Requirements:
├── All quality gates passed (linting, testing, security)
├── Performance standards met (Lighthouse >90)
├── Mobile responsiveness validated
├── Security scan completed with no critical issues
├── Error handling and recovery tested
└── Database migrations tested and documented

Production Readiness:
├── Environment variables configured for production
├── API keys and secrets properly secured
├── Monitoring and logging systems configured
├── Backup and recovery procedures tested
├── SSL certificates and domain configuration ready
└── Performance monitoring alerts configured

Documentation:
├── README with setup and deployment instructions
├── API documentation complete and tested
├── User guide/admin guide created (if complex)
├── Troubleshooting guide with common issues
└── Post-launch maintenance checklist
```

**Phase 2: Human Deployment Review:**
```
🔍 HUMAN FINAL REVIEW CHECKLIST

Project Lead Presents:
"Project [Name] is ready for deployment. Summary:

Technical Quality:
├── Performance Score: [X]/10 (Lighthouse: XXX)
├── Security Score: [X]/10 (No critical vulnerabilities)
├── Test Coverage: XX% (100% on critical paths)
├── Mobile Score: [X]/10 (Responsive, touch-optimized)
└── Overall Quality: [X]/10

Production Configuration:
├── Domain: [example.com] (SSL certificate ready)
├── Hosting: [Vercel/Other] (environment configured)
├── Database: [Supabase/Other] (production instance)
├── Integrations: [List all services] (all tested)
└── Monitoring: [Tools configured] (alerts active)

Business Requirements:
├── All requested features implemented: ✅
├── User acceptance criteria met: ✅  
├── Performance requirements satisfied: ✅
├── Security requirements addressed: ✅
└── Budget within limits: ✅ (Est. monthly: $XX)

Ready for deployment approval."

Human Approval Options:
├── ✅ Approve deployment → Agents proceed with launch
├── 🔄 Request changes → Specific modifications needed
├── 🧪 Request testing → Additional validation required
└── ⏸️ Postpone → Delay with specific timeline
```

**Phase 3: Deployment Execution:**
```
🚀 DEPLOYMENT EXECUTION PROTOCOL

Step 1: Pre-Launch Validation
├── Final smoke tests on staging environment
├── Database backup and migration execution
├── DNS and SSL certificate activation
├── Production environment final configuration
└── Monitoring and alerting system activation

Step 2: Deployment Launch
├── Deploy application to production infrastructure
├── Verify all services and integrations functional
├── Execute production smoke tests
├── Confirm monitoring and logging operational
└── Test critical user journeys end-to-end

Step 3: Post-Launch Monitoring
├── Monitor application performance for first 24 hours
├── Track error rates and response times
├── Monitor third-party service integration health
├── Verify user registration and core functionality
└── Document any immediate issues and resolutions

Step 4: Handoff Documentation
├── Provide production access credentials to human
├── Document ongoing maintenance procedures
├── Create monitoring dashboard access
├── Provide troubleshooting contact and procedures
└── Schedule post-launch review meeting (1 week)
```

### Quality Assurance Protocol

**📊 QUALITY METRICS AND REPORTING:**

**Agent Performance Tracking:**
```
INDIVIDUAL AGENT QUALITY SCORES (Updated Real-time)

Backend Developer Agent:
├── Code Quality: XX/100 (ESLint compliance, architecture)
├── Performance: XX/100 (API response times, efficiency)  
├── Security: XX/100 (Vulnerability scans, best practices)
├── Documentation: XX/100 (Code comments, API docs)
├── Timeline Adherence: XX/100 (Milestones met on time)
└── Overall Score: XX/100

Frontend Developer Agent:
├── UI/UX Quality: XX/100 (Design compliance, usability)
├── Performance: XX/100 (Lighthouse scores, load times)
├── Accessibility: XX/100 (WCAG compliance, screen readers)
├── Mobile Optimization: XX/100 (Responsive, touch-friendly)
├── Code Quality: XX/100 (Component architecture, reusability)
└── Overall Score: XX/100

[Similar scoring for all deployed agents]

Project Overall Quality Score: XX/100
```

**Quality Gates (AUTOMATED ENFORCEMENT):**
- **Code Quality:** 90+ required for production merge
- **Security:** No critical vulnerabilities allowed
- **Performance:** Lighthouse Performance >90, Accessibility >90
- **Testing:** >80% coverage overall, 100% critical paths
- **Mobile:** Responsive design, <3s load time on 3G

**Human Quality Review Points:**
- **Weekly Quality Reviews:** Agent performance summaries
- **Milestone Reviews:** Feature completion quality assessment  
- **Pre-deployment Reviews:** Final quality validation
- **Post-launch Reviews:** Performance in production analysis

### Budget and Cost Management

**💰 COST TRACKING AND MANAGEMENT:**

**Service Cost Monitoring (MANDATORY):**
```
📊 REAL-TIME COST DASHBOARD

Current Month Spending:
├── Hosting (Vercel): $XX.XX / $50 budget
├── Database (Supabase): $XX.XX / $25 budget
├── Storage (Cloudinary): $XX.XX / $20 budget
├── Email (SendGrid): $XX.XX / $15 budget
├── SMS (Globe): $XX.XX / $30 budget
├── Maps (Google): $XX.XX / $25 budget
└── Total: $XX.XX / $165 budget

Projected Monthly Total: $XXX.XX
Budget Status: ✅ Under budget / ⚠️ Approaching limit / 🚨 Over budget
```

**Cost Approval Requirements:**
- **Under $50/month:** Agent can proceed with implementation
- **$50-100/month:** Project Lead approval required  
- **Over $100/month:** Human approval required before implementation
- **Unexpected costs:** Immediate escalation to human with alternatives

**Cost Optimization Strategies:**
- Implement service-switching capabilities for cost optimization
- Use free tiers maximally before paid services
- Monitor usage patterns and adjust service plans accordingly
- Provide cost-effective alternatives for expensive integrations

### Success Metrics and KPIs

**🎯 PROJECT SUCCESS MEASUREMENT:**

**Technical Success Metrics:**
```
PRODUCTION QUALITY METRICS (Measured Post-Launch)

Performance Metrics:
├── Page Load Time: <3s mobile, <2s desktop
├── API Response Time: <500ms average
├── Uptime: >99.9% monthly
├── Core Web Vitals: All green
└── User Experience: <2s time to interactive

Quality Metrics:
├── Bug Reports: <5 critical bugs in first month
├── Security Issues: 0 critical vulnerabilities  
├── Performance Issues: <3 performance complaints/week
├── User Accessibility: WCAG 2.1 AA compliance verified
└── Mobile Usability: >95% mobile user satisfaction

Business Metrics:
├── User Registration: Meeting target conversion rates
├── Feature Usage: Core features being used as intended
├── Support Requests: <10 support tickets/week
├── User Retention: Meeting or exceeding target retention
└── Performance: Meeting defined business objectives
```

**Agent Development Success Metrics:**
- **Time to Market:** Project completed within estimated timeline
- **Budget Adherence:** Total costs within approved budget
- **Code Reusability:** Templates created/improved for future use
- **Knowledge Transfer:** Complete documentation and handoff
- **Human Satisfaction:** Project meets or exceeds expectations

**Continuous Improvement Protocol:**
- **Post-Project Reviews:** Document lessons learned and improvements
- **Template Evolution:** Update templates with new learnings
- **Process Optimization:** Streamline workflows based on project outcomes
- **Agent Performance:** Track and improve agent effectiveness over time
- **Human Feedback Integration:** Incorporate human feedback into future projects

---

## Implementation Roadmap

**Phase 1: Foundation (Week 1):**
- Establish template library with core frameworks
- Create Project Lead Agent protocols and workflows
- Define team approval and deployment processes
- Set up quality gates and monitoring systems

**Phase 2: Agent Development (Week 2-3):**
- Develop specialized agent capabilities and protocols
- Create inter-agent coordination and communication systems
- Implement template evolution and improvement processes
- Establish Git workflows and session management

**Phase 3: Production Testing (Week 4):**
- Test multi-agent system with simple projects
- Validate template reusability and improvement cycles
- Refine human interaction and approval processes
- Optimize performance and quality measurement systems

**Phase 4: Scale and Optimize (Ongoing):**
- Deploy for medium and complex projects
- Continuously improve templates and agent capabilities
- Expand service integrations and localization options
- Optimize for Philippines market and timezone constraints

---

*This Multi-Agent Software Development Orchestration System provides a comprehensive framework for building production-ready software efficiently using coordinated AI agents, with emphasis on template reusability, quality assurance, and human oversight.*