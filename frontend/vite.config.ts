import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // The backend's CORS allowlist only has :5173, so fail loudly instead of drifting to another port
  server: { port: 5173, strictPort: true },
})
