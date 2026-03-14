import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { networkInterfaces } from 'os'

// Get the computer's IP address for proxy configuration
const getLocalIp = () => {
  const nets = networkInterfaces()
  console.log('Available network interfaces:', Object.keys(nets))

  for (const name of Object.keys(nets)) {
    const net = nets[name]
    if (net) {
      for (const netInfo of net) {
        console.log(`${name}: ${netInfo.address} (${netInfo.family}) internal: ${netInfo.internal}`)
        if (netInfo.family === 'IPv4' && !netInfo.internal && netInfo.address.startsWith('192.168.')) {
          console.log('Using IP:', netInfo.address)
          return netInfo.address
        }
      }
    }
  }

  // Fallback: try to get any non-internal IPv4 address
  for (const name of Object.keys(nets)) {
    const net = nets[name]
    if (net) {
      for (const netInfo of net) {
        if (netInfo.family === 'IPv4' && !netInfo.internal) {
          console.log('Using fallback IP:', netInfo.address)
          return netInfo.address
        }
      }
    }
  }

  console.log('Using localhost fallback')
  return 'localhost' // fallback
}




// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL,
        changeOrigin: true,
        secure: true, // Since it's HTTPS
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
})
