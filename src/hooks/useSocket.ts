import { useEffect, useMemo, useRef } from 'react'
import { useSelector } from 'react-redux'
import type { RootState } from '../store'
import { SocketManager } from '../services/socketService'

export const useSocket = () => {
  const { user } = useSelector((state: RootState) => state.auth)

  // Ensure we always work against the singleton instance
  const manager = useMemo(() => SocketManager.getInstance(), [])
  const emit = useMemo(() => manager.emit.bind(manager), [manager])
  const on = useMemo(() => manager.on.bind(manager), [manager])
  const off = useMemo(() => manager.off.bind(manager), [manager])
  const isConnected = useMemo(() => manager.isConnected.bind(manager), [manager])

  useEffect(() => {
    if (!user) {
      return
    }

    manager.connect()

    const userId =
      (user as any).id ||
      (user as any)._id ||
      (user as any).userId ||
      (user as any).user?.id ||
      (user as any).user?._id

    if (userId) {
      manager.joinUserRoom(String(userId))
    }
  }, [manager, user])

  return {
    socket: manager.getSocket(),
    emit,
    on,
    off,
    isConnected,
  }
}

/**
 * Convenience hook for subscribing to a single socket event within a component.
 * Automatically cleans up the listener on unmount.
 */
export const useSocketEvent = <T = any>(
  event: string,
  handler: (payload: T) => void
) => {
  const { socket } = useSocket()
  const handlerRef = useRef(handler)

  useEffect(() => {
    handlerRef.current = handler
  }, [handler])

  useEffect(() => {
    if (!socket) return

    const wrappedHandler = (payload: T) => handlerRef.current(payload)

    socket.on(event, wrappedHandler)

    return () => {
      socket.off(event, wrappedHandler)
    }
  }, [socket, event])
}

export default useSocket

