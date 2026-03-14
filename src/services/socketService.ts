import { io, Socket } from 'socket.io-client'

type SocketEventHandler = (...args: any[]) => void

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000'

class SocketManager {
  private static instance: SocketManager
  private socket: Socket | null = null
  private connected = false

  private constructor() {}

  static getInstance(): SocketManager {
    if (!SocketManager.instance) {
      SocketManager.instance = new SocketManager()
    }
    return SocketManager.instance
  }

  connect(): void {
    if (this.socket && this.connected) {
      return
    }

    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null

    this.socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      withCredentials: true,
      auth: token
        ? {
            token: token,
          }
        : undefined,
    })

    this.socket.on('connect', () => {
      this.connected = true
    })

    this.socket.on('disconnect', () => {
      this.connected = false
    })
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
      this.connected = false
    }
  }

  isConnected(): boolean {
    return this.connected
  }

  getSocket(): Socket | null {
    return this.socket
  }

  emit(event: string, ...args: any[]): void {
    if (!this.socket) return
    this.socket.emit(event, ...args)
  }

  on(event: string, handler: SocketEventHandler): void {
    if (!this.socket) return
    this.socket.on(event, handler)
  }

  off(event: string, handler?: SocketEventHandler): void {
    if (!this.socket) return
    if (handler) {
      this.socket.off(event, handler)
    } else {
      this.socket.removeAllListeners(event)
    }
  }

  /**
   * Join the user-specific room on the server side.
   */
  joinUserRoom(userId: string): void {
    if (!this.socket || !userId) return
    this.socket.emit('join', userId)
  }
}

const socketManager = SocketManager.getInstance()

export default socketManager
export { SocketManager }

