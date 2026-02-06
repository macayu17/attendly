# Attendly - Smart Attendance Tracker 📚

A beautiful, modern attendance tracking app for students. Track your classes, monitor your bunk buffer, and never fall below the required attendance percentage.

![Built with React](https://img.shields.io/badge/React-18-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E?logo=supabase)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38B2AC?logo=tailwindcss)

## ✨ Features

### Core Features
- **Subject Management** - Add subjects with custom colors, codes, and credit hours (0-4)
- **Attendance Tracking** - Mark Present, Absent, or Cancelled with one click
- **Bunk Buffer Calculator** - Know exactly how many classes you can skip
- **Recovery Tracker** - See how many classes needed to get back on track

### Smart Features
- **Timetable Integration** - Set your weekly schedule per subject
- **Multi-Session Support** - Track multiple classes of same subject per day (labs, tutorials)
- **Attendance History** - Edit past attendance with calendar view
- **Next Class Indicator** - Always know what's coming up

### UI/UX
- **Dynamic Greetings** - 24 unique hourly greetings ("Coffee Time ☕", "Burning Midnight Oil 🌙")
- **Glass Card Effects** - Modern frosted glass UI
- **Animated Background** - Subtle PixelBlast WebGL effect
- **Dark Mode** - Premium dark theme throughout

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/attendance-tracker.git
   cd attendance-tracker
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your Supabase credentials:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_anon_key
   ```

4. **Set up database**
   
   Run these SQL files in your Supabase SQL Editor:
   - `supabase/schema.sql` - Main schema
   - `supabase/migrations/add_session_number.sql` - Multi-session support
   - `supabase/migrations/add_credits.sql` - Credits field

5. **Run the app**
   ```bash
   npm run dev
   ```

## 📁 Project Structure

```
attendance-tracker/
├── src/
│   ├── components/       # React components
│   │   ├── SubjectCard.tsx
│   │   ├── AddSubjectModal.tsx
│   │   ├── EditSubjectModal.tsx
│   │   ├── AttendanceHistoryModal.tsx
│   │   ├── TimetableSection.tsx
│   │   └── PixelBlast.tsx
│   ├── pages/
│   │   └── Dashboard.tsx
│   ├── stores/           # Zustand state management
│   │   ├── authStore.ts
│   │   └── attendanceStore.ts
│   ├── hooks/            # Custom hooks
│   │   └── useAttendance.ts
│   └── lib/              # Utilities
│       ├── supabase.ts
│       └── database.types.ts
├── supabase/
│   ├── schema.sql        # Database schema
│   └── migrations/       # Database migrations
└── public/
```

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS v4, Framer Motion
- **State**: Zustand
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **3D Effects**: Three.js, Postprocessing

## 📊 Database Schema

### Tables
- `subjects` - Subject details (name, code, color, credits, min_attendance_req)
- `attendance_logs` - Daily attendance records with session numbers
- `timetable` - Weekly schedule entries

## 🎨 Customization

### Change Theme Colors
Edit `src/index.css`:
```css
@theme {
  --color-canvas: #030303;
  --color-brand: #6366f1;
}
```

### Adjust Credits Range
Edit the arrays in `AddSubjectModal.tsx` and `EditSubjectModal.tsx`:
```tsx
{[0, 1, 2, 3, 4].map((c) => ...)}
```

## 🚀 Deployment (Vercel)

1. **Push to GitHub**
   - Initialize git repo: `git init`
   - Add files: `git add .`
   - Commit: `git commit -m "Initial commit"`
   - Create a repo on GitHub and push.

2. **Deploy on Vercel**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard) and click "Add New... > Project".
   - Import your GitHub repository.
   - **Important**: In "Environment Variables", add:
     - `VITE_SUPABASE_URL`: Your Supabase URL
     - `VITE_SUPABASE_ANON_KEY`: Your Supabase Anon Key
   - Click **Deploy**.

3. **Production URL**
   - Vercel will give you a live URL (e.g., `attendly.vercel.app`).
   - Add this URL to your **Supabase Authentication > Site URL** settings to ensure login works correctly.

## 📝 License

MIT License - feel free to use for your own projects!

---

Built with ❤️ for students who want to bunk smartly.
