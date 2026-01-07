# Daily Planner

> A beautiful, minimal task management app inspired by Things 3. Built with modern web technologies for a seamless cross-platform experience.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Build Status](https://github.com/fapcheck/your-daily-planner/workflows/Build%20and%20Test/badge.svg)](https://github.com/fapcheck/your-daily-planner/actions)
[![Web Deploy](https://github.com/fapcheck/your-daily-planner/workflows/Deploy%20Web/badge.svg)](https://github.com/fapcheck/your-daily-planner/actions)

## ✨ Features

- **Task Management**: Create, organize, and complete tasks with ease
- **AI-Powered**: Smart task breakdown, daily planning, and weekly reviews
- **Multiple Views**: Inbox, Today, Upcoming, Anytime, Someday, and Logbook
- **Project & Area Management**: Organize tasks into projects with progress tracking
- **Tags & Filters**: Efficiently categorize and filter your tasks
- **Cross-Platform Sync**: Seamless synchronization via Supabase
- **Offline Support**: Work offline with local caching and sync when back online
- **Beautiful UI**: Clean, minimalist design inspired by Things 3
- **Dark Mode**: Built-in theme toggling
- **Desktop App**: Native desktop experience with Tauri

## 🚀 Tech Stack

### Frontend
- **Vite** - Fast build tool and dev server
- **React 18** - UI library
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **Radix UI** - Accessible UI primitives
- **Tauri** - Desktop app framework

### Backend
- **Supabase** - Authentication, database, and real-time sync
- **Edge Functions** - Serverless AI-powered features
- **OpenRouter API** - AI task analysis and planning

## 📦 Installation

### Prerequisites

- Node.js 20+ and npm
- Rust (for Tauri builds)
- Git

### Clone and Install

```bash
# Clone the repository
git clone https://github.com/yourusername/daily-planner.git
cd daily-planner

# Install dependencies
npm install
```

## 🏃 Running the Application

### Development Mode (Web)

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) to view it in your browser.

### Development Mode (Desktop)

```bash
npm run tauri:dev
```

This will open the desktop application with hot reload.

## 🏗️ Building

### Build for Web

```bash
npm run build
```

The output will be in the `dist/` directory.

### Build Desktop App

```bash
npm run tauri:build
```

Installers will be built to:
- **Windows**: `src-tauri/target/release/bundle/`
  - MSI installer (.msi)
  - NSIS installer (.exe)
- **macOS**: `src-tauri/target/release/bundle/dmg/`
- **Linux**: `src-tauri/target/release/bundle/appimage/`

### Preview Production Build

```bash
npm run preview
```

## ⚙️ Environment Setup

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

For Supabase Edge Functions, set these environment variables in Supabase dashboard:

```env
OPENROUTER_API_KEY=your_openrouter_api_key
```

## 📁 Project Structure

```
daily-planner/
├── src/
│   ├── components/         # React components
│   ├── contexts/          # React contexts (auth, sync, etc.)
│   ├── hooks/             # Custom React hooks
│   ├── integrations/      # External service integrations (Supabase)
│   ├── lib/               # Utility functions and helpers
│   ├── pages/             # Page components
│   ├── types/             # TypeScript type definitions
│   └── main.tsx           # App entry point
├── src-tauri/            # Tauri desktop app configuration
│   ├── src/               # Rust backend code
│   └── target/            # Build outputs
├── supabase/              # Supabase configuration and edge functions
│   ├── functions/         # Edge functions
│   └── migrations/        # Database migrations
├── public/                # Static assets
└── .github/workflows/     # CI/CD workflows
```

## 🎯 Features in Detail

### Task Views

- **Inbox**: Capture all incoming tasks
- **Today**: Focus on what's due today
- **Upcoming**: See future scheduled tasks
- **Anytime**: Tasks without specific dates
- **Someday**: Tasks for later
- **Logbook**: View completed tasks

### AI Features

- **Task Breakdown**: Automatically break down complex tasks
- **Smart Parsing**: Natural language task input
- **Daily Planning**: AI-generated daily plans
- **Weekly Review**: Analyze your week with AI insights

### Projects & Areas

- Create projects with multiple tasks
- Track project progress with visual indicators
- Group related projects into areas
- Color-code for organization

## 🌐 Deployment

### Web Deployment

Deploy to any static hosting service:

```bash
npm run build
# Deploy the `dist` folder to your hosting provider
```

Popular options:
- Vercel
- Netlify
- GitHub Pages (automated via GitHub Actions)
- Cloudflare Pages

### Desktop Distribution

Desktop installers are built via CI/CD to:
- Windows: MSI and NSIS installers
- macOS: DMG packages
- Linux: AppImage packages

## 🔧 CI/CD

This project uses GitHub Actions for automated builds and deployments:

- **Build Workflow**: Runs on every push/PR
  - Tests on Ubuntu, Windows, and macOS
  - Builds web and desktop versions
  - Uploads artifacts

- **Deploy Workflow**: Runs on main branch pushes
  - Deploys web version to GitHub Pages

## 📚 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 🤝 Support

For issues, questions, or feature requests, please open an issue in the repository.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by [Things 3](https://culturedcode.com/things/)
- Built with [Tauri](https://tauri.app/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Icons from [Lucide](https://lucide.dev/)

---

Built with ❤️ using modern web technologies
