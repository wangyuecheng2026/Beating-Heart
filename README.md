# Beating Heart Animation

A beautiful, mathematically generated beating heart animation with particle systems, color cycling, and heartbeat sound synthesis.

## Features

- **Mathematical Heart**: Generated using parametric equations.
- **Particle System**: Dynamic particles for halo, outline, and diffusion effects.
- **Color Cycling**: Smooth rainbow color transitions.
- **Heartbeat Sound**: Synthesized "Lub-dub" sound using Web Audio API.
- **Responsive Design**: Built with React and Tailwind CSS.

## Deployment to Vercel

To deploy this project to Vercel, follow these steps:

1. **Push to GitHub**:
   - Create a new repository on GitHub.
   - Initialize git in your local project: `git init`.
   - Add all files: `git add .`.
   - Commit: `git commit -m "Initial commit"`.
   - Link to GitHub: `git remote add origin <your-github-repo-url>`.
   - Push: `git push -u origin main`.

2. **Connect to Vercel**:
   - Go to [Vercel](https://vercel.com).
   - Click "Add New" -> "Project".
   - Import your GitHub repository.
   - Vercel will automatically detect the Vite framework.
   - Click "Deploy".

3. **Environment Variables**:
   - If you plan to use the Gemini API in the future, add `GEMINI_API_KEY` to your Vercel project settings under "Environment Variables".

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Credits

Inspired by the "Tina Heart Equation" Python animation.
