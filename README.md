# NetruDoc Frontend

A modern React TypeScript application for healthcare appointment and consultation management.

## Environment Setup

1. **Copy environment configuration:**

   ```bash
   cp .env.example .env
   ```

2. **Update environment variables in `.env`:**

   ```bash
   # API Configuration
   VITE_API_URL=http://localhost:5000/api

   # Socket.IO Configuration
   VITE_SOCKET_URL=http://localhost:5000

   # Client URL
   VITE_CLIENT_URL=http://localhost:3000
   ```

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Environment Variables

| Variable           | Description                      | Default                     | Used In                                   |
| ------------------ | -------------------------------- | --------------------------- | ----------------------------------------- |
| `VITE_API_URL`     | Backend API base URL (with /api) | `http://localhost:5000/api` | API client, HTTP requests                 |
| `VITE_SOCKET_URL`  | Socket.IO server URL             | `http://localhost:5000`     | WebSocket connections, real-time features |
| `VITE_CLIENT_URL`  | Frontend application URL         | `http://localhost:3000`     | CORS, redirects, external links           |
| `VITE_NODE_ENV`    | Environment mode                 | `development`               | Feature flags, debugging                  |
| `VITE_APP_NAME`    | Application name                 | `NetruDoc`                  | UI branding                               |
| `VITE_APP_VERSION` | Application version              | `1.0.0`                     | Version display                           |

### How Environment Variables Are Used

- **API Client**: Uses `VITE_API_URL` for all HTTP requests to backend
- **Socket.IO**: Uses `VITE_SOCKET_URL` for WebSocket connections (chat, notifications, video calls)
- **WebRTC**: Gets ICE server configuration from backend API (TURN/STUN servers)
- **Vite Proxy**: Development server proxies `/api` requests to `VITE_API_URL`

### Automatic Configuration Detection

The application automatically detects and uses environment variables:

```typescript
// API calls automatically use VITE_API_URL
const response = await apiClient.get("/users/doctors");

// WebSocket connections automatically use VITE_SOCKET_URL
const socket = io(SOCKET_URL); // Uses VITE_SOCKET_URL

// ICE servers fetched from backend API
const { iceServers } = await consultationApi.getIceConfig();
```

## Port Forwarding for Mobile Testing

To test on mobile devices:

1. **VS Code Tunnels** (Recommended):
   - Open Ports panel in VS Code
   - Forward port 3000 (frontend)
   - Forward port 5000 (backend)
   - Share the generated HTTPS URLs

2. **Local Network Access**:
   - Frontend automatically detects your IP
   - Access from mobile: `http://YOUR_IP:3000`

## Features

- User authentication and authorization
- Appointment booking and management
- Real-time chat and messaging
- Video consultations (WebRTC)
- Doctor profiles and availability
- Prescription management
- Payment integration
