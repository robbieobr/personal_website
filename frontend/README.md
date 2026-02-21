# Frontend

React + TypeScript web application for the personal website.

## 📋 Overview

This is the frontend React application that displays:
- User profile information
- Job history with dates and descriptions
- Educational background
- Professional summary

## 🛠 Technology Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Axios** - HTTP client for API communication
- **i18n** - Internationalization support
- **CSS** - Styling

## 📁 Directory Structure

```
frontend/
├── src/
│   ├── App.tsx                 # Main application component
│   ├── index.tsx              # React entry point
│   ├── App.css                # Global styles
│   ├── index.css              # Base styles
│   │
│   ├── components/            # Reusable React components
│   │   ├── UserProfile.tsx    # User profile display
│   │   ├── UserProfile.css
│   │   ├── JobHistory.tsx     # Job history list
│   │   ├── JobHistory.css
│   │   ├── EducationHistory.tsx  # Education list
│   │   └── EducationHistory.css
│   │
│   ├── pages/                 # Page-level components
│   │   ├── ProfilePage.tsx    # Main profile page
│   │   └── ProfilePage.css
│   │
│   ├── services/              # API client services
│   │   └── api.ts             # API communication layer
│   │
│   ├── i18n/                  # Internationalization
│   │   ├── config.ts          # i18n configuration
│   │   └── locales/           # Translation files
│   │       └── en.json        # English translations
│   │
│   └── types/                 # TypeScript type definitions
│       └── index.ts
│
├── public/                    # Static assets
│   ├── index.html            # HTML template
│   └── images/               # Image assets
│
├── mock/                      # Mock server for development
│   ├── mockServer.js         # Mock server setup
│   ├── mockUserProfile.json  # Mock user data
│   └── package.json          # Mock server dependencies
│
├── Dockerfile                # Docker configuration
├── package.json             # Node dependencies and scripts
├── tsconfig.json            # TypeScript configuration
└── README.md                # This file
```

## 🚀 Quick Start

### With Docker

The frontend is automatically built and started with Docker Compose:

```bash
cd ..
docker-compose up -d
```

Access at http://localhost:3000

### Local Development (Without Docker)

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start development server:**
   ```bash
   npm run dev
   ```

   The app will start on http://localhost:3000

### Using Mock Server

For development without the backend API:

```bash
# In one terminal, start the mock server
npm run mock

# In another terminal, start the frontend pointing to mock server
npm run dev:mock
```

This starts the Vite dev server configured to proxy requests to the mock server at http://localhost:5001.

## 📦 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Vite development server at http://localhost:3000 (connects to real backend) |
| `npm run dev:mock` | Start Vite dev server configured to use mock server |
| `npm run build` | Build for production using TypeScript and Vite |
| `npm run preview` | Preview production build locally |
| `npm run mock` | Start mock Express server for development testing |

## 🔌 API Integration

The frontend communicates with the backend API through the `services/api.ts` file.

### Proxy Architecture

In development mode, the Vite dev server proxies all `/api` requests to the backend:

- **`npm run dev`:** Proxies `/api` requests to `http://localhost:5000`
- **`npm run dev:mock`:** Proxies `/api` requests to `http://localhost:5001` (mock server)

This approach avoids CORS issues during development by serving API requests from the same origin.

### Available API Endpoints

- `GET /api/users/:id` - Get specific user
- `GET /api/users/:id/profile` - Get user profile with job history and education

## 🌐 Internationalization (i18n)

The application supports multiple languages through the i18n system.

### Available Languages

- English (en) - Default

### Adding New Languages

1. Create translation file: `src/i18n/locales/[lang].json`
2. Add translations following the structure in `src/i18n/locales/en.json`
3. Update `src/i18n/config.ts` to include the new language

## 💻 Development Workflow

### Adding a New Component

1. Create component file in `src/components/`:
   ```bash
   src/components/NewComponent.tsx
   src/components/NewComponent.css
   ```

2. Define TypeScript interfaces/types in the component or in `src/types/index.ts`

3. Import and use in parent component

4. Add any necessary translations to `src/i18n/locales/en.json`

### Adding a New Page

1. Create page file in `src/pages/`:
   ```bash
   src/pages/NewPage.tsx
   src/pages/NewPage.css
   ```

2. Add route in `src/App.tsx`

3. Update navigation as needed

## 🐳 Docker Configuration

### Build Image

```bash
docker build -t personal_website_frontend .
```

### Run Container

```bash
docker run -p 3000:3000 personal_website_frontend
```

### Dockerfile Details

- **Base Image:** node:20-alpine
- **Build Stage:** Builds React app with Vite
- **Runtime:** Serves built app with Vite preview server
- **Port:** 3000
- **Hot Reload:** Watches src/ and public/ directories when running with docker-compose

## � Security

The frontend is built with security best practices:

- **Content Security Policy (CSP)** - Configured in `public/index.html` to prevent XSS attacks
- **HTTPS Headers** - Includes X-Frame-Options, X-Content-Type-Options, X-XSS-Protection
- **Secure Dependencies** - Uses Vite instead of react-scripts for minimal dependency footprint, eliminating the large webpack dependency tree
- **HTML Escaping** - i18n configured with `escapeValue: true` to prevent XSS
- **Error Boundaries** - React error boundary component catches and handles errors securely without exposing stack traces
- **Secure API Calls** - Axios configured with proper timeout and validation

### Vulnerability Scanning

Run security audit with:
```bash
npm audit
```

To fix vulnerabilities:
```bash
npm audit fix
```

## 📊 Build Tool: Vite

The frontend uses **Vite** instead of react-scripts for the following advantages:

- ⚡ **Fast Dev Server** - Instant server start and lightning-fast HMR (Hot Module Replacement)
- 📦 **Minimal Dependencies** - ~95% fewer dependencies compared to create-react-app
- 🔒 **Better Security** - Smaller attack surface with fewer transitive dependencies
- 🎯 **True ES Modules** - Native ESM support in the browser
- 🏗️ **Optimized Builds** - Leverages Rollup for highly optimized production builds

## �🔧 Troubleshooting

### Port 3000 Already in Use

```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>

# Or use different port
VITE_PORT=3001 npm run dev
```

### Module Not Found Errors

```bash
# Clear node_modules and reinstall
rm -rf node_modules
npm install
```

### API Connection Errors

```bash
# Verify backend is running on port 5000
curl http://localhost:5000/api/users

# Check frontend logs for API errors
npm run dev
```

### Build Errors

```bash
# Clear build cache
rm -rf dist/

# Rebuild
npm run build
```

## 📚 Additional Resources

- [Main Project README](../README.md) - Project overview and global setup
- [Backend README](../backend/README.md) - Backend API documentation
- [Database Setup](../database/README.md) - Database configuration

## 👨‍💻 Coding Standards

### TypeScript

- Use TypeScript for all components
- Define props interfaces for components
- Avoid using `any` type

### Component Structure

```typescript
import React from 'react';
import './Component.css';

interface ComponentProps {
  title: string;
  onAction?: () => void;
}

export const Component: React.FC<ComponentProps> = ({ title, onAction }) => {
  return (
    <div className="component">
      <h1>{title}</h1>
      {onAction && <button onClick={onAction}>Action</button>}
    </div>
  );
};
```

### CSS Organization

- Component styles in separate `.css` files
- Use BEM naming convention: `.component__element--modifier`
- Global styles in `App.css` and `index.css`

## 🚢 Production Build

```bash
npm run build
```

This creates an optimized production build in the `dist/` directory. The Dockerfile automatically handles this when building the image.

## 📝 Notes

- Development uses React Fast Refresh for hot module replacement
- TypeScript is configured with strict mode
- CSS supports CSS Grid and Flexbox
- Mock server is useful for API prototype development
