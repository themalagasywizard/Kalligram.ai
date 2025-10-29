# Kalligram.ai

An AI-powered book writing assistant built with Next.js, TypeScript, and modern web technologies. Write your book faster with AI that keeps your voice.

## Features

- 📝 **Rich Text Editor** - Powerful writing environment with formatting tools
- 🤖 **AI Assistant** - Multiple AI models (GPT-4o, Claude Sonnet 4, DeepSeek, Qwen 3)
- ✨ **Smart Rewrite** - Select text and rewrite with AI, with inline accept/reject
- 📚 **Chapter Management** - Organize your book with drag-and-drop chapters
- 💾 **Local Storage** - All your data stays on your device
- 🌓 **Dark Mode** - Beautiful themes for day and night writing
- 📤 **Export** - Export your project as PDF or text file
- 🎨 **Modern UI** - Clean, professional interface with glassmorphism effects

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **UI Components**: Radix UI + shadcn/ui
- **Icons**: Lucide React
- **AI**: OpenRouter API (user brings their own key)

## Getting Started

### Prerequisites

- Node.js 20+
- npm, yarn, pnpm, or bun

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/Kalligram.ai.git
cd Kalligram.ai
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Using the AI Features

1. Open the app and go to Settings
2. Add your OpenRouter API key (get one at [openrouter.ai](https://openrouter.ai))
3. Select which AI models you want to use
4. Start writing and use the AI assistant!

## Deployment

### Deploy to Netlify

1. Push your code to GitHub
2. Connect your repository to Netlify
3. Netlify will automatically detect the Next.js configuration
4. Deploy! The `netlify.toml` is already configured.

### Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/Kalligram.ai)

Or manually:
```bash
npm run build
```

Then deploy the `.next` folder to Vercel.

## Project Structure

```
├── src/
│   ├── app/              # Next.js app router pages
│   │   ├── page.tsx      # Landing page
│   │   ├── editor/       # Editor page
│   │   └── api/          # API routes
│   ├── components/       # React components
│   │   ├── ai/          # AI assistant components
│   │   ├── editor/      # Editor components
│   │   ├── layout/      # Layout components
│   │   ├── sections/    # Landing page sections
│   │   └── ui/          # shadcn/ui components
│   ├── contexts/        # React contexts
│   ├── lib/            # Utilities and storage
│   └── types/          # TypeScript types
├── public/             # Static assets
└── netlify.toml       # Netlify configuration
```

## Privacy & Data

- **All writing data is stored locally** in your browser's localStorage
- **No account required** - start writing immediately
- **Your API key is stored locally** and only sent to OpenRouter for AI requests
- **No analytics or tracking** - your work is private

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - feel free to use this project for your own purposes.
