export interface WebRtcClientOptions {
  onRemoteStream?: (stream: MediaStream) => void
  onLocalStream?: (stream: MediaStream) => void
  onConnectionStateChange?: (state: RTCPeerConnectionState) => void
  onIceConnectionStateChange?: (state: RTCIceConnectionState) => void
  onIceCandidate?: (candidate: RTCIceCandidate) => void
  iceServers?: RTCIceServer[]
  // Preferred device IDs; used by createOffer/handleRemoteOffer when grabbing local media
  deviceConstraints?: { videoDeviceId?: string; audioDeviceId?: string }
}

export class WebRtcClient {
  private peer: RTCPeerConnection | null = null
  private localStream: MediaStream | null = null
  private remoteStream: MediaStream | null = null
  private options: WebRtcClientOptions
  private pendingIceCandidates: RTCIceCandidateInit[] = []
  private hasRemoteDescription = false
  private videoEnabled = true

  constructor(options: WebRtcClientOptions = {}) {
    this.options = options
  }

  async init(): Promise<void> {
    if (this.peer) return

    const config: RTCConfiguration = {
      iceServers:
        this.options.iceServers && this.options.iceServers.length > 0
          ? this.options.iceServers
          : [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
          ],
    }

    this.peer = new RTCPeerConnection(config)

    this.peer.onicecandidate = (event) => {
      // ICE candidates are handled externally via socket signaling
      if (event.candidate && this.options.onIceCandidate) {
        this.options.onIceCandidate(event.candidate)
      }
    }

    this.peer.ontrack = (event) => {
      const stream = event.streams?.[0];
      if (stream) {
        // Remove any stale track of the same kind before the new one takes over.
        // This handles Chrome firing ontrack after replaceTrack with the same
        // stream object — without this, the stream may contain two video tracks
        // and the video element keeps rendering the ended/stale one.
        stream.getTracks().forEach(existing => {
          if (existing.kind === event.track.kind && existing.id !== event.track.id) {
            stream.removeTrack(existing);
          }
        });
        this.remoteStream = stream;
        if (this.options.onRemoteStream) this.options.onRemoteStream(stream);
      } else {
        if (!this.remoteStream) {
          this.remoteStream = new MediaStream();
        }
        // Replace existing track of same kind rather than accumulating duplicates
        this.remoteStream.getTracks().forEach(existing => {
          if (existing.kind === event.track.kind && existing.id !== event.track.id) {
            this.remoteStream!.removeTrack(existing);
          }
        });
        if (!this.remoteStream.getTracks().some(t => t.id === event.track.id)) {
          this.remoteStream.addTrack(event.track);
        }
        if (this.options.onRemoteStream) this.options.onRemoteStream(this.remoteStream);
      }
    }

    this.peer.onconnectionstatechange = () => {
      if (this.options.onConnectionStateChange && this.peer) {
        this.options.onConnectionStateChange(this.peer.connectionState)
      }
    }

    this.peer.oniceconnectionstatechange = () => {
      if (this.options.onIceConnectionStateChange && this.peer) {
        this.options.onIceConnectionStateChange(this.peer.iceConnectionState)
      }
    }
  }

  async startLocalMedia(deviceConstraints?: { videoDeviceId?: string, audioDeviceId?: string }): Promise<MediaStream> {
    // Ensure peer connection is initialized before adding tracks
    if (!this.peer) {
      await this.init()
    }

    if (!this.localStream) {
      // Check if we're in a secure context (HTTPS required for camera access)
      if (typeof window === 'undefined') {
        throw new Error('WebRTC is only available in browser environments')
      }

      if (!window.navigator) {
        throw new Error('Browser navigator not available')
      }

      // Check for getUserMedia support
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Your browser does not support camera and microphone access. Please try a modern browser like Chrome, Firefox, or Safari.')
      }

      // Check for HTTPS requirement (most browsers require HTTPS for getUserMedia)
      // Allow localhost and local network IPs for development
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname.startsWith('127.') || window.location.hostname.startsWith('192.168.') || window.location.hostname.startsWith('10.') || window.location.hostname.startsWith('172.') || window.location.hostname.startsWith('169.254.')
      if (window.location.protocol !== 'https:' && !isLocalhost) {
        throw new Error('Camera and microphone access requires HTTPS. Please access this page over a secure connection or use localhost.')
      }

      try {
        console.log('Requesting camera/microphone access...')
        const constraints: MediaStreamConstraints = {
          video: deviceConstraints?.videoDeviceId
            ? { deviceId: { ideal: deviceConstraints.videoDeviceId } }
            : true,
          audio: deviceConstraints?.audioDeviceId
            ? { deviceId: { ideal: deviceConstraints.audioDeviceId } }
            : true,
        }
        this.localStream = await navigator.mediaDevices.getUserMedia(constraints)
        console.log('Camera/microphone access granted')
      } catch (error: any) {
        console.error('getUserMedia error:', error)
        // Provide user-friendly error messages for common issues
        if (error.name === 'NotAllowedError') {
          throw new Error('Camera and microphone access denied. Please allow access in your browser and try again.')
        } else if (error.name === 'NotFoundError') {
          throw new Error('No camera or microphone found. Please connect a camera and microphone.')
        } else if (error.name === 'NotReadableError') {
          console.warn('Camera busy, attempting audio-only fallback...')
          try {
            this.localStream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true })
            this.videoEnabled = false
            console.log('Audio-only fallback succeeded')
          } catch {
            throw new Error('Camera/microphone busy. Try screen sharing instead, or close other video apps.')
          }
        } else if (error.name === 'NotSupportedError') {
          throw new Error('Your browser does not support camera and microphone access.')
        } else {
          throw new Error(`Failed to access camera/microphone: ${error.message || error.name}`)
        }
      }

      if (this.options.onLocalStream) {
        this.options.onLocalStream(this.localStream)
      }
    }

    // Always add tracks to peer if peer exists — handles both initial setup
    // and re-init after a call ends and a new peer is created
    if (this.peer && this.localStream) {
      // Check which tracks are already added to avoid duplicates
      const existingSenders = this.peer.getSenders()
      const existingTrackIds = new Set(existingSenders.map(s => s.track?.id).filter(Boolean))

      this.localStream.getTracks().forEach((track) => {
        if (!existingTrackIds.has(track.id)) {
          this.peer?.addTrack(track, this.localStream as MediaStream)
        }
      })
    }

    return this.localStream
  }

  async createOffer(): Promise<RTCSessionDescriptionInit> {
    if (!this.peer) {
      await this.init()
    }
    if (!this.peer) {
      throw new Error('Failed to initialize peer connection')
    }
    await this.startLocalMedia(this.options.deviceConstraints)
    const offer = await this.peer.createOffer()
    await this.peer.setLocalDescription(offer)
    return offer
  }

  async handleRemoteOffer(offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> {
    if (!this.peer) {
      await this.init()
    }
    if (!this.peer) {
      throw new Error('Failed to initialize peer connection')
    }

    await this.startLocalMedia(this.options.deviceConstraints)
    await this.peer.setRemoteDescription(new RTCSessionDescription(offer))
    this.hasRemoteDescription = true

    // Flush any ICE candidates that arrived before the remote description was set
    await this.flushPendingIceCandidates()

    const answer = await this.peer.createAnswer()
    await this.peer.setLocalDescription(answer)
    return answer
  }

  async handleRemoteAnswer(answer: RTCSessionDescriptionInit): Promise<void> {
    if (!this.peer) {
      await this.init()
    }
    if (!this.peer) {
      throw new Error('Failed to initialize peer connection')
    }
    await this.peer.setRemoteDescription(new RTCSessionDescription(answer))
    this.hasRemoteDescription = true

    // Flush any ICE candidates that arrived before the remote description was set
    await this.flushPendingIceCandidates()
  }

  async addIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    if (!candidate) return

    // Queue candidates if peer or remote description not ready yet
    if (!this.peer || !this.hasRemoteDescription) {
      console.log('Queuing ICE candidate (remote description not set yet)')
      this.pendingIceCandidates.push(candidate)
      return
    }

    try {
      await this.peer.addIceCandidate(new RTCIceCandidate(candidate))
    } catch (error) {
      console.error('Failed to add ICE candidate:', error)
    }
  }

  /**
   * Flush all queued ICE candidates after remote description has been set.
   */
  private async flushPendingIceCandidates(): Promise<void> {
    if (!this.peer || this.pendingIceCandidates.length === 0) return

    console.log(`Flushing ${this.pendingIceCandidates.length} queued ICE candidates`)
    const candidates = [...this.pendingIceCandidates]
    this.pendingIceCandidates = []

    for (const candidate of candidates) {
      try {
        await this.peer.addIceCandidate(new RTCIceCandidate(candidate))
      } catch (error) {
        console.error('Failed to add queued ICE candidate:', error)
      }
    }
  }

  /**
   * Expose the peer connection for advanced operations like screen sharing.
   */
  getPeer(): RTCPeerConnection | null {
    return this.peer
  }

  getLocalStream(): MediaStream | null {
    return this.localStream
  }

  getRemoteStream(): MediaStream | null {
    return this.remoteStream
  }

  /**
   * Fully stop the client — close peer, stop media tracks, reset all state.
   */
  async stop(): Promise<void> {
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop())
      this.localStream = null
    }
    if (this.peer) {
      this.peer.close()
      this.peer = null
    }
    this.remoteStream = null
    this.pendingIceCandidates = []
    this.hasRemoteDescription = false
    this.videoEnabled = true
  }

  isVideoEnabled(): boolean {
    return this.videoEnabled
  }

  /**
   * Inject an external stream (e.g. screen share) as the local stream before a call starts.
   * Stops any existing local tracks, assigns the new stream, adds its tracks to the peer
   * connection (deduplicating against existing senders), and notifies the UI via onLocalStream.
   */
  setLocalStream(stream: MediaStream): void {
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop())
      this.localStream = null
    }
    this.localStream = stream
    this.videoEnabled = stream.getVideoTracks().length > 0
    if (this.peer) {
      const existingSenders = this.peer.getSenders()
      const existingTrackIds = new Set(existingSenders.map(s => s.track?.id).filter(Boolean))
      stream.getTracks().forEach((track) => {
        if (!existingTrackIds.has(track.id)) {
          this.peer?.addTrack(track, stream)
        }
      })
    }
    this.options.onLocalStream?.(stream)
  }
}
