# 📧 Inbox'd — AI-Powered Email Marketing Platform

An intelligent email marketing platform with behavior-driven personalization, campaign scheduling, and real-time analytics.

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?logo=tailwindcss&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3FCF8E?logo=supabase&logoColor=white)

---

## ✨ Features

### 📊 Dashboard
- Real-time campaign performance metrics (open rates, click rates, delivery stats)
- Interactive line charts for campaign trends over the last 6 months
- AI-generated insights and recommendations powered by Google Gemini

### 🚀 Campaign Builder
- AI-powered email copy generation with 5 tone options (Professional, Friendly, Urgent, Benefit-Driven, Announcement)
- Image upload and auto-extraction from URLs
- Recipient selection with search, tag filtering, and shift-range multi-select
- Draft saving, scheduling, and instant sending
- Template variables (`{{name}}`) for basic personalization
- CTA button customization

### 🎯 AI Personalization Engine
- Behavior-driven email generation unique to each subscriber
- Analyzes cart status, engagement level, purchase history, and tags
- Generates tailored subject lines and email bodies per recipient
- Bulk personalization with one-click send

### 👥 Subscriber Management
- Manual subscriber addition with inline editing
- CSV/Excel bulk import with duplicate detection
- Behavioral data tracking (cart status, engagement level, purchase history)
- Tag-based segmentation

### 📅 Campaign Scheduling
- Schedule campaigns for future delivery
- Automated cron-based processing via Edge Functions
- Edit or delete scheduled campaigns before send time

### 📈 Email Tracking & Analytics
- Open tracking via transparent tracking pixels
- Click tracking with event logging
- Per-campaign performance metrics (sent, opened, clicked)
- Sent campaign history with open/click rates

### 🔐 Authentication
- Email/password signup and login
- Protected routes with session management
- User profiles with customizable settings

### ⚙️ Settings
- Dark/light theme toggle
- Username management
- Password change
- Account deletion

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, TypeScript 5, Vite 5 |
| **Styling** | Tailwind CSS 3, shadcn/ui |
| **State Management** | TanStack React Query 5 |
| **Charts** | Recharts 2 |
| **Routing** | React Router DOM 6 |
| **Backend** | Supabase (PostgreSQL, Auth, Storage, Edge Functions) |
| **AI** | Google Gemini (2.5 Flash & 3 Flash Preview) via Lovable AI Gateway |
| **Email Delivery** | Resend API |
| **Runtime** | Deno (Edge Functions) |

---

## 🏗️ Architecture

```
├── src/
│   ├── components/       # Reusable UI components (Sidebar, Header, Charts, etc.)
│   ├── hooks/             # Custom hooks (theme, mobile, toast)
│   ├── integrations/      # Supabase client & auto-generated types
│   ├── pages/             # Route pages (Dashboard, Campaigns, Personalization, etc.)
│   └── lib/               # Utility functions
├── supabase/
│   ├── functions/         # Deno Edge Functions
│   │   ├── ai-insights/           # AI-powered dashboard insights
│   │   ├── generate-email/        # AI email copy generation
│   │   ├── generate-personalized-email/  # Behavior-based personalization
│   │   ├── send-campaign-emails/  # Email delivery via Resend
│   │   ├── track-email/           # Open & click tracking
│   │   ├── extract-image/         # URL image extraction
│   │   └── process-scheduled-campaigns/  # Cron-based scheduling
│   └── migrations/        # Database schema migrations
```

---

## 🗄️ Database Schema

| Table | Description |
|-------|-------------|
| `profiles` | User profiles (name, avatar, username) |
| `customers` | Subscriber data with behavioral attributes |
| `campaigns` | Email campaigns (draft, scheduled, sending, sent) |
| `email_sends` | Individual email delivery records |
| `email_events` | Open and click tracking events |

### Key Enums
- **Campaign Status:** `draft` · `scheduled` · `sending` · `sent`
- **Cart Status:** `empty` · `active` · `abandoned`
- **Engagement Level:** `new` · `active` · `inactive` · `vip`
- **Email Tone:** `professional` · `friendly` · `urgent` · `benefit_driven` · `announcement`

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- npm or bun

### Installation

```bash
# Clone the repository
git clone <YOUR_GIT_URL>

# Navigate to the project
cd inboxd

# Install dependencies
npm install

# Start the development server
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
