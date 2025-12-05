# Aurora AI Studio

Visual designer for creating AI agent workflows with drag-and-drop interface.

## Setup

1. Install dependencies:
```bash
pnpm install
```

2. Set environment variables:
- `VITE_API_URL`: URL of your Aurora AI API backend (default: http://localhost:8000)
- `VITE_OPENROUTER_API_KEY`: Your OpenRouter API key

3. Run development server:
```bash
pnpm dev
```

## Build for Production

```bash
pnpm build
```

The built files will be in the `dist/` directory.

## Deploy to Render

This is a static site that can be deployed on Render Static Sites.

1. Connect your GitHub repository
2. Set build command: `pnpm install && pnpm build`
3. Set publish directory: `dist`
4. Add environment variables:
   - `VITE_API_URL`: Your API backend URL
   - `VITE_OPENROUTER_API_KEY`: Your OpenRouter API key
