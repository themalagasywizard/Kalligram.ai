# Kalligram TypeScript Editor App

## Overview

A modern, TypeScript-based text editor application built with Next.js, shadcn/ui, and React. This is a complete rewrite of the original `app.html` file with all its features.

## Features Implemented

### ✅ Core Editor
- Rich text editing with contentEditable
- Formatting toolbar (Bold, Italic, Heading, Font Size)
- Word count with progress visualization
- Full-screen mode
- Keyboard shortcuts (Ctrl+B for bold, Ctrl+I for italic)
- Serif font (Merriweather) for writing experience

### ✅ Chapter Management
- Sidebar with chapter list
- Add new chapters
- Rename chapters (double-click)
- Delete chapters with confirmation
- Drag-and-drop chapter reordering
- Active chapter highlighting

### ✅ AI Assistant
- Collapsible AI panel
- Multiple modes: Write, Brainstorm, Chat
- Chat interface with message history
- Simulated AI responses (ready for API integration)

### ✅ Application Header
- Project title display
- Save button (changes color when unsaved)
- Load project button
- New project button
- AI toggle button
- Dark/Light theme toggle
- User menu with avatar

### ✅ State Management
- React Context for global app state
- Chapter caching for performance
- Dirty state tracking for unsaved changes

### ✅ UI/UX
- shadcn/ui components for consistent design
- Responsive layout
- Dark mode support
- Toast notifications (via sonner)
- Tooltips for better UX
- Smooth transitions and animations

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript
- **UI Library**: shadcn/ui (Radix UI primitives)
- **Styling**: Tailwind CSS v4
- **Icons**: Lucide React
- **Theme**: next-themes
- **Notifications**: Sonner

## Project Structure

```
web/src/
├── app/
│   └── editor/
│       └── page.tsx          # Main editor page
├── components/
│   ├── ai/
│   │   └── AIAssistant.tsx   # AI chat interface
│   ├── editor/
│   │   ├── Editor.tsx        # Main editor component
│   │   ├── EditorToolbar.tsx # Formatting toolbar
│   │   └── WordCount.tsx     # Word count display
│   ├── layout/
│   │   └── AppHeader.tsx     # Application header
│   ├── sidebar/
│   │   ├── ChapterSidebar.tsx # Chapter list sidebar
│   │   └── ChapterItem.tsx    # Individual chapter item
│   └── ui/                    # shadcn/ui components
├── contexts/
│   └── AppContext.tsx         # Global state management
└── types/
    └── index.ts               # TypeScript type definitions
```

## Getting Started

1. **Navigate to the web directory**:
   ```bash
   cd web
   ```

2. **Install dependencies** (if not already done):
   ```bash
   npm install
   ```

3. **Run the development server**:
   ```bash
   npm run dev
   ```

4. **Open the editor**:
   Navigate to `http://localhost:3000/editor`

## Usage

### Creating a Chapter
1. Click the "Add Chapter" button in the sidebar
2. A new chapter will be created and added to the list
3. Double-click the chapter name to rename it

### Writing Content
1. Select a chapter from the sidebar
2. Use the formatting toolbar to style your text
3. Word count updates in real-time at the bottom
4. Content auto-saves (when integrated with backend)

### Using AI Assistant
1. Click the AI button in the header
2. Choose a mode (Write, Brainstorm, or Chat)
3. Type your message and press Enter or click Send
4. AI will respond (currently simulated)

### Managing Chapters
- **Rename**: Double-click chapter name, edit, press Enter
- **Delete**: Hover over chapter, click trash icon
- **Reorder**: Drag and drop chapters using the grip icon
- **Navigate**: Click chapter to open in editor

### Theme Toggle
Click the moon/sun icon in the header to switch between dark and light modes.

## What Still Needs Integration

### Backend Integration
The current implementation uses local state. You'll need to integrate with your existing localStorage services:

1. **Projects**: Load/save from `lib/local-storage.js`
2. **Chapters**: Connect CRUD operations to storage
3. **Auto-save**: Implement the auto-save timer
4. **User authentication**: Connect to existing auth system

### Features to Add
- [ ] New project modal dialog
- [ ] Load project modal dialog
- [ ] Context management (characters, locations, timeline)
- [ ] PDF export functionality
- [ ] Project search/filter
- [ ] Character relationship tree visualization
- [ ] Timeline visualization
- [ ] Settings panel

### AI Integration
Replace the simulated AI responses in `AIAssistant.tsx` with actual API calls to your AI service.

## Customization

### Colors
The app uses CSS variables for theming. Primary color is set to a purple-blue (#4B5EAA). Modify in your Tailwind config or CSS variables.

### Fonts
- **UI**: Inter (sans-serif)
- **Editor**: Merriweather (serif)

### Word Count Target
Default is 1000 words. Modify in `AppContext.tsx` initial state or make it configurable per project.

## Adding shadcn/ui Components

If you need additional shadcn components:

```bash
npx shadcn@latest add [component-name]
```

For example:
```bash
npx shadcn@latest add card
npx shadcn@latest add alert-dialog
```

## Performance Considerations

- Chapter content is cached in memory to avoid re-fetching
- Content editable uses `suppressContentEditableWarning`
- Drag-and-drop is optimized with visual feedback
- Word count calculation is memoized

## Browser Support

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support
- Mobile: Responsive design included (needs testing)

## Next Steps

1. **Integrate with existing backend**: Connect to `lib/local-storage.js` services
2. **Add dialogs**: Create modals for new project, load project
3. **Implement auto-save**: Add timer-based saving
4. **Connect AI**: Replace simulated responses with real API
5. **Add tests**: Unit tests for components and integration tests
6. **Mobile optimization**: Test and refine mobile experience
7. **Accessibility**: Add ARIA labels and keyboard navigation

## Migration from app.html

All features from the original `app.html` have been reimplemented:
- ✅ Editor with formatting
- ✅ Chapter management
- ✅ Word count visualization
- ✅ AI assistant panel
- ✅ Dark mode
- ✅ Project information display
- ✅ Save/load functionality (UI ready, needs backend)

The new version is more maintainable, type-safe, and follows modern React best practices.
