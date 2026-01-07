Detailed Application Description
This is a Your Daily Planner - a comprehensive task management and personal finance application built with a Things 3-inspired design aesthetic. Here's a complete breakdown:
Core Architecture
Tech Stack
Frontend: React 18 with TypeScript + Vite
UI Framework: shadcn/ui components with Tailwind CSS
State Management: React hooks with custom hooks (useCloudTasks, useFinance, useAuth)
Backend: Supabase (PostgreSQL) for cloud sync + authentication
Desktop Wrapper: Tauri with Rust backend (minimal - mostly for desktop packaging)
Date Handling: date-fns library
Drag & Drop: @dnd-kit for sortable lists and drag interactions
Icons: Lucide React
Platform Targets
Web application (via Vite)
Desktop application (via Tauri - currently minimal Rust integration)
Mobile-responsive design
Main Features
1. Task Management System
Views (5 main views accessible via sidebar):
Inbox: Capture tasks without due dates/scheduling
Today: Tasks marked for today completion
Upcoming: Tasks with due dates (with calendar widget)
Someday: Backlog tasks for later
Logbook: Completed task history with date filtering
Task Properties:
Title (required)
Notes (optional rich text)
Due date (optional)
When: today/someday/evening
Project assignment (optional)
Area assignment (optional)
Tags (multiple, with colors)
Subtasks (nested, sortable)
Recurrence: daily/weekly/monthly (auto-generates next occurrence)
Position/ordering
Completion status (with 1-second delay animation)
Task Operations:
Smart Task Input: Parses natural language for dates/times (AI-powered via Supabase functions)
Drag & Drop: Reorder within views, move between views
Magic Plus Button: Draggable blue "+" to add tasks at specific positions (desktop only)
Quick Actions: Toggle complete, edit, delete (with undo toast), move to view
Task Edit Panel: Sliding panel for full task editing
Subtask Management: Add, toggle, delete, reorder
Tag Filtering: Filter tasks by tags
Advanced Features:
Daily Planner (AI): Supabase Edge Function that analyzes tasks and suggests:
Priority tasks ranked by importance
Quick wins (short tasks)
Daily tips
Time-of-day specific suggestions
Weekly Review: AI-powered weekly analysis of completed tasks
AI Task Breakdown: Breaks down complex tasks into subtasks
Task Search: Full-text search across all tasks
Offline Support: Queued operations sync when back online
Undo/Delete: Optimistic deletions with 5-second undo toast
2. Project & Area Management
Projects:
Name (required)
Color (HSL value)
Area assignment (optional)
Pie-chart progress indicator (completed/total tasks)
Task count display
Areas:
Broad categories containing multiple projects
Color-coded
Hierarchical: Areas → Projects → Tasks
Task counts per area
Operations:
Create/delete projects and areas
Reorganize projects between areas
Assign tasks to projects/areas
3. Finance Management System
4 Finance Views:
Overview: Balance summary, income/expenses, debt overview, quick actions
Transactions: Transaction history with categories
Debts: Track money owed/to you with payment tracking
Recurring: Manage recurring transactions (auto-process due items)
Finance Features:
Income/Expense Tracking: Categorize transactions with custom categories
Categories: Custom categories with colors and types (income/expense)
Budget Management: Set budgets per category with weekly/monthly/yearly periods
Debt Tracking:
"Owed to me" vs "I owe" tracking
Payment history with notes
Due date reminders
Settlement tracking
Recurring Transactions:
Daily/weekly/monthly/yearly recurrence
Auto-process on due dates
Pause/resume functionality
Balance Adjustment: Quick balance correction
Currency: Russian Rubles (RUB) formatted with ru-RU locale
Debt Reminders: Shows in Today view when debts are due
Finance Integration:
Tasks can have associated debts (shown in Today/Upcoming views)
Navigate from task reminders to Finance section
4. User Authentication
Email/password auth via Supabase
Reset password flow
Protected routes (require authentication)
Session persistence
UI/UX Design
Things 3 Aesthetics:
Colors: Custom color palette (Things blue, yellow, red, orange, green, gray)
Typography: System fonts with varied weights for hierarchy
Shapes: Massive rounded corners (20px+) on cards/containers
Layout: Minimalist with thin borders, subtle shadows
Animations: 60fps transitions with animate-fade-up classes
Dark Mode: Full dark/light theme support via next-themes
Responsive Design:
Desktop: Full sidebar, drag-and-drop add button, expanded panels
Mobile:
Bottom navigation bar
Slide-over sidebar
Floating action button (FAB) for quick add
Simplified task rows
Touch-optimized interactions
Components:
Sidebar: Collapsible, project/area hierarchy, task counts, finance shortcut
Task Row: Checkbox, title, metadata, drag handle, expand button
Calendar Widget: Month view with task indicators per day
Logbook Chart: Completion statistics visualization
Tag Filter: Horizontal scrollable tag badges
Mobile Nav: Fixed bottom nav with view switching
Toast Notifications: Success/error feedback with undo actions
Skeleton Loaders: Loading states for all lists
Data Models
Task (src/types/task.ts):
{  id: string;  title: string;  notes?: string;  completed: boolean;  completedAt?: Date;  createdAt: Date;  dueDate?: Date;  area?: string;  project?: string;  tags?: Tag[];  when?: 'today' | 'evening' | 'someday';  subtasks?: Subtask[];  recurrenceType?: 'daily' | 'weekly' | 'monthly';  recurrenceInterval?: number;}
Project: { id, name, color, areaId? }
Area: { id, name, color }
Tag: { id, name, color }
Subtask: { id, title, completed }
Finance Types (src/types/finance.ts):
Transaction: { id, categoryId?, type: 'income'|'expense', amount, description?, date, createdAt }
TransactionCategory: { id, name, type, color, icon? }
Debt: { id, personName, type: 'owed_to_me'|'i_owe', originalAmount, remainingAmount, description?, dueDate?, isSettled, createdAt, payments? }
Budget: { id, categoryId?, amount, period: 'weekly'|'monthly'|'yearly', createdAt, updatedAt }
RecurringTransaction: { id, type, amount, categoryId?, description?, recurrenceType: 'daily'|'weekly'|'monthly'|'yearly', nextDueDate, isActive, createdAt, updatedAt }
Key Hooks & Contexts
useCloudTasks (src/hooks/useCloudTasks.ts):
Fetches/syncs tasks, projects, areas, tags from Supabase
Provides CRUD operations with optimistic updates
Offline queue management
View filtering logic
Task completion with delayed removal (1 second)
Subtask operations
useFinance (src/hooks/useFinance.ts):
Fetches/syncs finance data from Supabase
Provides CRUD for transactions, debts, budgets, categories
Memoized calculations (totals, balances)
Recurring transaction processing
Balance adjustment
useAuth (src/hooks/useAuth.ts):
User authentication state
Sign in/up/sign out functions
Session management
useOfflineSync (src/hooks/useOfflineSync.ts):
Offline operation queue
Sync on reconnection
Pending operation count
Supabase Integration
Database Tables:
tasks - with subtasks, tags (many-to-many), recurrence
projects - with area_id foreign key
areas - top-level categories
tags - task labels
task_tags - junction table
transactions
transaction_categories
debts - with debt_payments
debt_payments
budgets
recurring_transactions
Edge Functions (Supabase):
daily-planner: AI-generated daily plan (priority tasks, quick wins, tips)
breakdown-task: AI task breakdown into subtasks
weekly-review: AI weekly analysis
parse-task: Natural language parsing for dates/times
File Structure Highlights
src/├── components/│   ├── TaskList.tsx - Main task view with drag-drop│   ├── TaskRow.tsx - Individual task component│   ├── Sidebar.tsx - Navigation sidebar│   ├── MobileNav.tsx - Bottom mobile navigation│   ├── finance/│   │   ├── FinanceSection.tsx - Finance main component│   │   ├── FinanceOverview.tsx - Dashboard│   │   ├── TransactionList.tsx│   │   ├── DebtList.tsx│   │   └── RecurringTransactionList.tsx│   ├── ui/ - shadcn/ui components│   └── ... (50+ UI components)├── hooks/│   ├── useCloudTasks.ts - Task management│   ├── useFinance.ts - Finance management│   ├── useAuth.ts - Authentication│   └── useOfflineSync.ts - Offline support├── types/│   ├── task.ts - Task types│   └── finance.ts - Finance types├── pages/│   ├── Index.tsx - Main app page│   ├── Auth.tsx - Login/signup│   └── ResetPassword.tsx├── contexts/│   └── OfflineSyncContext.tsx└── integrations/    └── supabase/        ├── client.ts - Supabase client        └── types.ts - Generated typessrc-tauri/ - Rust backend (minimal, mostly for desktop packaging)supabase/├── config.toml - Supabase config├── functions/ - Edge functions└── migrations/ - SQL schema migrations
Key Behaviors & Interactions
Task Completion Flow:
Click checkbox → immediately visually complete
Show loading spinner on checkbox
If recurring: create next occurrence
Show in list for 1 second (recently completed)
Then move to Logbook view
Drag Operations:
Tasks can be dragged to reorder within views
Tasks can be dropped into other views (Inbox/Today/Someday)
Subtasks can be reordered within a task
Magic Plus button can be dragged to insert at specific position
Offline Behavior:
Operations queued when offline
Offline indicator shows at top
Sync automatically when back online
Pending operations count displayed
AI Integration:
Smart task input parses natural language
Daily Planner generates prioritized daily schedule
Weekly Review provides insights on productivity
Task Breakdown creates subtasks automatically
Security:
Row-level security (RLS) on Supabase tables
JWT authentication
Input sanitization (see src/lib/sanitize.ts)
SQL injection prevention via parameterized queries
Environment & Deployment
Development:
npm run dev - Vite dev server
npm run tauri:dev - Desktop app with hot reload
npm run build - Production build
npm run tauri:build - Build desktop app
Key Configuration Files:
vite.config.ts - Vite build config
tailwind.config.ts - Tailwind theme with custom colors
tsconfig.json - TypeScript strict mode
src-tauri/tauri.conf.json - Tauri app config
supabase/config.toml - Supabase project config
Custom Colors (Tailwind):
Things-specific palette (blue, yellow, red, orange, green, gray)
Dark mode support
System theme detection