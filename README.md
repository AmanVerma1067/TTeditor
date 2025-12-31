# 📅 Admin Timetable Editor Dashboard

A modern, responsive React-based timetable editor for managing university class schedules. Built with TypeScript, Tailwind CSS, and shadcn/ui components.

![React](https://img.shields.io/badge/React-18.3-blue?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8?logo=tailwindcss)
![Vite](https://img.shields.io/badge/Vite-5.0-646cff?logo=vite)

## ✨ Features

- **Interactive Timetable Grid** - Visual 2D grid with 8 time slots (8:00 AM - 3:50 PM) across Monday-Saturday
- **Drag & Drop** - Move class blocks between slots using react-dnd
- **Color-Coded Classes** - Visual distinction by type:
  - 🔵 **Lecture (L)** - Blue theme
  - 🔴 **Lab (P)** - Red theme  
  - 🟡 **Tutorial (T)** - Yellow theme
- **Batch Management** - Switch between batches (E15, E16, E17)
- **Conflict Detection** - Validates room and faculty conflicts before saving
- **Undo/Redo** - Full history support for all grid modifications
- **Dark/Light Mode** - System-aware theme with manual toggle
- **Export JSON** - Download Flutter-compatible timetable format
- **Responsive Design** - Works on desktop and tablet devices

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| Framework | React 18 + TypeScript |
| Build Tool | Vite |
| Styling | Tailwind CSS |
| UI Components | shadcn/ui |
| State Management | Zustand |
| Drag & Drop | react-dnd |
| HTTP Client | Axios |
| Routing | React Router v6 |

## 📁 Project Structure

```
src/
├── components/
│   ├── timetable/
│   │   ├── ClassBlockCard.tsx    # Draggable class block component
│   │   ├── EditClassModal.tsx    # Add/Edit class form modal
│   │   ├── GridCell.tsx          # Individual grid cell (drop target)
│   │   ├── TimetableGrid.tsx     # Main grid layout
│   │   └── TopBar.tsx            # Header with actions
│   ├── ui/                       # shadcn/ui components
│   ├── ThemeProvider.tsx         # Dark mode context
│   └── ThemeToggle.tsx           # Theme switcher button
├── hooks/
│   └── use-mobile.tsx            # Responsive breakpoint hook
├── pages/
│   ├── Index.tsx                 # Main dashboard page
│   └── NotFound.tsx              # 404 page
├── services/
│   └── api.ts                    # API client & data converters
├── stores/
│   └── useTimetableStore.ts      # Zustand global state
├── types/
│   └── timetable.ts              # TypeScript interfaces
├── lib/
│   └── utils.ts                  # Utility functions
├── App.tsx                       # Root component with routing
├── main.tsx                      # Entry point
└── index.css                     # Global styles & design tokens
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or bun

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd <project-folder>

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

### Build for Production

```bash
npm run build
npm run preview
```

## 📡 API Integration

The app fetches timetable data from a public API endpoint:

```
GET https://timetable-api-9xsz.onrender.com/api/timetable
```

### Response Structure

```json
[
  {
    "0": {
      "batch": "E16",
      "Monday": [
        {
          "time": "9:00-9:50",
          "subject": "L-CS",
          "room": "226",
          "teacher": "JYOTI"
        }
      ],
      "Tuesday": []
    },
    "1": {
      "batch": "E15",
      "Monday": [],
      "Tuesday": []
    }
  }
]
```

## 📤 Export Format

The exported JSON follows this Flutter-compatible schema:

```json
{
  "batch": "E16",
  "Monday": [
    {
      "time": "10:00-11:50",
      "subject": "P-VLSI LAB",
      "room": "142",
      "teacher": "ABK"
    }
  ],
  "Tuesday": [],
  "Wednesday": [],
  "Thursday": [],
  "Friday": [],
  "Saturday": []
}
```

## 🎨 Theming

The app uses CSS custom properties for theming. Colors are defined in HSL format in `src/index.css`:

```css
:root {
  --background: 0 0% 100%;
  --foreground: 222 47% 11%;
  --primary: 221 83% 53%;
  /* ... */
}

.dark {
  --background: 224 71% 4%;
  --foreground: 213 31% 91%;
  /* ... */
}
```

### Class Type Colors

| Type | Light Mode | Dark Mode |
|------|------------|-----------|
| Lecture | `--lecture` | Blue tones |
| Lab | `--lab` | Red tones |
| Tutorial | `--tutorial` | Yellow tones |

## ⌨️ Usage

1. **Load Data** - Click "Load timetable" to fetch from API
2. **Select Batch** - Use dropdown to switch between E15, E16, E17
3. **Add Class** - Click any empty cell to open the add modal
4. **Edit Class** - Click an existing class block to modify
5. **Move Class** - Drag and drop blocks between cells
6. **Undo/Redo** - Use toolbar buttons to revert changes
7. **Export** - Click "Export JSON" to download the timetable

## 🧩 Key Components

### `useTimetableStore`

Zustand store managing:
- Selected batch
- Grid state (6 days × 8 time slots)
- History for undo/redo
- Loading/error states

### `ClassBlockCard`

Draggable card displaying:
- Subject code with type badge
- Room number
- Faculty initials
- Duration indicator (1 or 2 slots)

### `EditClassModal`

Form with fields:
- Subject name
- Type (Lecture/Lab/Tutorial)
- Room number
- Faculty name
- Duration (1 or 2 slots for labs)

## 📄 License

MIT License - feel free to use this project for your own purposes.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
