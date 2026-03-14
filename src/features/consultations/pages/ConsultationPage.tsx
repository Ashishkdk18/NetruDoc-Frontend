import React, { useEffect, useRef, useState, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import {
  Box,
  Button,
  Container,
  Grid,
  IconButton,
  Stack,
  Typography,
  TextField,
  Paper,
  Collapse,
  CircularProgress,
  Chip,
  Snackbar,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog as MuiDialog,
  DialogTitle as MuiDialogTitle,
  DialogContent as MuiDialogContent,
  DialogActions as MuiDialogActions,
} from '@mui/material'
import {
  Call as CallIcon,
  CallEnd as CallEndIcon,
  Mic as MicIcon,
  MicOff as MicOffIcon,
  Videocam as VideocamIcon,
  VideocamOff as VideocamOffIcon,
  Notes as NotesIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  CheckCircle as CheckCircleIcon,
  Add as AddIcon,
  Settings as SettingsIcon,
  ScreenShare as ScreenShareIcon,
  StopScreenShare as StopScreenShareIcon,
} from '@mui/icons-material'
import { useSocket, useSocketEvent } from '../../../hooks/useSocket'
import { WebRtcClient } from '../webrtcClient'
import consultationApi from '../api/consultationApi'
import { updateNotes, setCurrentConsultation } from '../consultationSlice'
import { AppDispatch, RootState } from '../../../store/index'
import CreatePrescriptionForm from '../../prescriptions/components/CreatePrescriptionForm'
import dayjs from 'dayjs'
import duration from 'dayjs/plugin/duration'

dayjs.extend(duration)

const ConsultationPage: React.FC = () => {
  const { appointmentId } = useParams()
  const { socket, emit, isConnected } = useSocket()
  const dispatch = useDispatch<AppDispatch>()
  const { user } = useSelector((state: RootState) => state.auth)
  const { currentConsultation, updatingNotes } = useSelector((state: RootState) => state.consultations)

  const [inCall, setInCall] = useState(false)
  const [micEnabled, setMicEnabled] = useState(true)
  const [cameraEnabled, setCameraEnabled] = useState(true)
  const [notesPanelOpen, setNotesPanelOpen] = useState(false)
  const [notes, setNotes] = useState('')
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [consultationId, setConsultationId] = useState<string | null>(null)
  const [prescriptionDialogOpen, setPrescriptionDialogOpen] = useState(false)

  // Ringing alert states
  const [isIncomingCall, setIsIncomingCall] = useState(false)
  const [incomingOffer, setIncomingOffer] = useState<RTCSessionDescriptionInit | null>(null)
  const ringtoneRef = useRef<HTMLAudioElement | null>(null)
  const callTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // New states for connection status and feedback
  const [callStatus, setCallStatus] = useState<'idle' | 'ready' | 'connecting' | 'connected' | 'ended' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [callDuration, setCallDuration] = useState(0)
  const [callStartTime, setCallStartTime] = useState<Date | null>(null)
  const [useScreenShare, setUseScreenShare] = useState(false)
  const [remoteScreenSharing, setRemoteScreenSharing] = useState(false)
  const [audioOnly, setAudioOnly] = useState(false)
  const [availableDevices, setAvailableDevices] = useState<{ cameras: MediaDeviceInfo[], microphones: MediaDeviceInfo[] }>({ cameras: [], microphones: [] })
  const [showDeviceDialog, setShowDeviceDialog] = useState(false)
  const [selectedCamera, setSelectedCamera] = useState<string>('')
  const [selectedMicrophone, setSelectedMicrophone] = useState<string>('')

  const localVideoRef = useRef<HTMLVideoElement | null>(null)
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null)
  const webrtcRef = useRef<WebRtcClient | null>(null)
  const screenShareStreamRef = useRef<MediaStream | null>(null)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const appointmentIdRef = useRef<string | undefined>(appointmentId)
  const hasJoinedRoomRef = useRef(false)
  const isInitializingWebRTCRef = useRef(false)
  const isCreatingOfferRef = useRef(false)

  const isDoctor = user?.role === 'doctor'

  // We use appointmentId as the consultation room key (server maps it to a room name).
  const currentAppointmentId = appointmentId

  useEffect(() => {
    let cancelled = false

    // Only initialize WebRTC when appointmentId exists, socket is connected, and user is available
    if (!currentAppointmentId || !isConnected() || !user) {
      return
    }

      ; (async () => {
        try {
          if (cancelled) return
          await initializeWebRTC()
        } catch (error) {
          console.error('Failed to initialize WebRTC:', error)
          setCallStatus('error')
          setErrorMessage('Failed to initialize video connection. Please refresh the page.')
        }
      })()

    return () => {
      cancelled = true
      webrtcRef.current?.stop()
    }
  }, [currentAppointmentId, isConnected, user])

  // Keep ref in sync so WebRTC callbacks always have the latest value
  useEffect(() => {
    appointmentIdRef.current = appointmentId
  }, [appointmentId])

  // Load consultation data and enumerate devices
  useEffect(() => {
    // Initialize ringtone
    ringtoneRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3')
    ringtoneRef.current.loop = true

    return () => {
      if (ringtoneRef.current) {
        ringtoneRef.current.pause()
        ringtoneRef.current = null
      }
      if (callTimeoutRef.current) {
        clearTimeout(callTimeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (!currentAppointmentId) return
    const loadConsultation = async () => {
      try {
        const { consultation } = await consultationApi.getByAppointmentId(currentAppointmentId)
        if (consultation) {
          const id = consultation._id || consultation.id || null
          setConsultationId(id)
          setNotes(consultation.notes || '')
          dispatch(setCurrentConsultation(consultation))
        }
      } catch (error) {
        console.error('Failed to load consultation:', error)
      }
    }
    loadConsultation()
    // Get available media devices
    getAvailableDevices()
  }, [currentAppointmentId, dispatch])

  // Sync notes when currentConsultation changes
  useEffect(() => {
    if (currentConsultation) {
      setNotes(currentConsultation.notes || '')
      const id = currentConsultation._id || currentConsultation.id || null
      if (id) setConsultationId(id)
    }
  }, [currentConsultation])

  // Auto-save notes with debounce
  const handleNotesChange = useCallback((newNotes: string) => {
    setNotes(newNotes)
    setSaveStatus('saving')

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    // Set new timeout for auto-save (3 seconds)
    saveTimeoutRef.current = setTimeout(async () => {
      if (consultationId && isDoctor) {
        try {
          await dispatch(updateNotes({ consultationId, notes: newNotes })).unwrap()
          setSaveStatus('saved')
          setTimeout(() => setSaveStatus('idle'), 2000)
        } catch (error) {
          console.error('Failed to save notes:', error)
          setSaveStatus('idle')
        }
      }
    }, 3000)
  }, [consultationId, isDoctor, dispatch])

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

  // Call duration tracking
  useEffect(() => {
    if (callStatus === 'connected' && callStartTime) {
      const interval = setInterval(() => {
        setCallDuration(dayjs().diff(callStartTime, 'second'))
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [callStatus, callStartTime])

  // Show waiting message if connecting for too long (after call is initiated)
  useEffect(() => {
    if (callStatus === 'connecting') {
      const timeout = setTimeout(() => {
        const otherParticipant = isDoctor ? 'patient' : 'doctor'
        setErrorMessage(`${otherParticipant} hasn't answered yet. They may not be on the page or have their video disabled.`)
      }, 45000) // 45 seconds - give more time

      return () => clearTimeout(timeout)
    }
  }, [callStatus, isDoctor])

  // Room joining with connection checking and timeout
  useEffect(() => {
    if (!currentAppointmentId) return

    const joinRoom = async () => {
      console.log('Attempting to join consultation room for appointment:', currentAppointmentId)

      // Wait for socket connection
      let attempts = 0
      while (!isConnected() && attempts < 50) { // Wait up to 5 seconds
        console.log(`Waiting for socket connection... attempt ${attempts + 1}/50`)
        await new Promise(resolve => setTimeout(resolve, 100))
        attempts++
      }

      if (!isConnected()) {
        console.error('Socket not connected after 5 seconds, cannot join consultation room')
        setCallStatus('error')
        setErrorMessage('Network connection lost. Please check your internet connection and refresh the page.')
        return
      }

      console.log('Socket connected, joining consultation room:', currentAppointmentId)
      emit('consultation:join', { appointmentId: currentAppointmentId })

      // Set timeout for room joining — use the ref (not state) to avoid stale closures
      const joinTimeout = setTimeout(() => {
        if (!hasJoinedRoomRef.current) {
          console.error('Room joining timeout')
          setCallStatus('error')
          setErrorMessage('Failed to connect to consultation room. Please try refreshing the page.')
        }
      }, 10000) // 10 second timeout

      return () => clearTimeout(joinTimeout)
    }

    joinRoom()

    return () => {
      if (isConnected()) {
        emit('consultation:leave', { appointmentId: currentAppointmentId })
      }
      hasJoinedRoomRef.current = false
    }
  }, [emit, currentAppointmentId, isConnected])


  const handleStartCall = async () => {
    if (isCreatingOfferRef.current) return
    isCreatingOfferRef.current = true
    try {
      setCallStatus('connecting')
      setErrorMessage(null) // Clear any previous errors
      console.log('Starting WebRTC call...')

      // If peer was closed (e.g. after ending a previous call), fully reinitialize
      if (!webrtcRef.current || !webrtcRef.current.getPeer()) {
        console.log('Reinitializing WebRTC client for new call...')
        await webrtcRef.current?.stop()
        await initializeWebRTC()
      }

      if (!webrtcRef.current) return

      const offer = await webrtcRef.current.createOffer()
      setAudioOnly(!webrtcRef.current.isVideoEnabled())
      console.log('WebRTC offer created:', offer)
      if (!currentAppointmentId) return

      // Emit ringing state
      emit('consultation:ringing', { appointmentId: currentAppointmentId, isRinging: true })

      emit('consultation:offer', { appointmentId: currentAppointmentId, offer })

      // Start 120s timeout for the call
      if (callTimeoutRef.current) clearTimeout(callTimeoutRef.current)
      callTimeoutRef.current = setTimeout(() => {
        if (callStatus !== 'connected') {
          console.log('Call timed out after 120 seconds')
          handleEndCall()
          setErrorMessage('Call timed out. The other participant did not answer.')

          // Emit missed call event
          const receiverId = isDoctor ? currentConsultation?.patientId : currentConsultation?.doctorId
          const receiverIdStr = typeof receiverId === 'object' ? (receiverId as any)?._id || (receiverId as any)?.id : receiverId
          if (receiverIdStr) {
            emit('consultation:missed_call', { appointmentId: currentAppointmentId, receiverId: receiverIdStr })
          }
        }
      }, 120000)

      // Note: setInCall(true) is now handled in onConnectionStateChange when 'connected'
      console.log('Call started successfully')
    } catch (error: any) {
      console.error('Failed to start call:', error)
      setCallStatus('ready')
      setErrorMessage(error.message || 'Failed to start call')
    } finally {
      isCreatingOfferRef.current = false
    }
  }

  const initializeWebRTC = async (deviceConstraints?: { videoDeviceId?: string, audioDeviceId?: string }) => {
    if (isInitializingWebRTCRef.current) return
    try {
      isInitializingWebRTCRef.current = true

      const { iceServers } = await consultationApi.getIceConfig()

    webrtcRef.current = new WebRtcClient({
      iceServers,
      deviceConstraints,
      onLocalStream: (stream) => {
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream
        }
      },
      onRemoteStream: (stream) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = stream
        }
      },
      onConnectionStateChange: (state) => {
        if (state === 'connected') {
          setInCall(true)
          setCallStatus('connected')
          setCallStartTime(new Date())
          if (callTimeoutRef.current) {
            clearTimeout(callTimeoutRef.current)
            callTimeoutRef.current = null
          }
        } else if (state === 'disconnected' || state === 'failed' || state === 'closed') {
          setInCall(false)
          setCallStatus('ended')
          setCallStartTime(null)
        }
      },
      onIceConnectionStateChange: (state) => {
        // Provide finer-grained feedback during connection
        if (state === 'checking') {
          setCallStatus('connecting')
        }
      },
      onIceCandidate: (candidate) => {
        // Use ref to avoid stale closure — appointmentId may not be set at init time
        const aptId = appointmentIdRef.current
        if (!aptId) return
        emit('consultation:iceCandidate', { appointmentId: aptId, candidate })
      },
    })

    // Note: local media is started lazily inside createOffer() / handleRemoteOffer()
    // so we do NOT call startLocalMedia() here. This avoids grabbing the camera before
    // the call actually starts, which causes NotReadableError on same-PC multi-browser scenarios.
    } finally {
      isInitializingWebRTCRef.current = false
    }
  }

  const handleRetryMediaAccess = async () => {
    try {
      setCallStatus('idle')
      setErrorMessage(null)
      // Reinitialize WebRTC client with selected devices
      const deviceConstraints = selectedCamera || selectedMicrophone ? {
        videoDeviceId: selectedCamera || undefined,
        audioDeviceId: selectedMicrophone || undefined
      } : undefined
      await initializeWebRTC(deviceConstraints)
      setCallStatus('ready')
    } catch (error: any) {
      setCallStatus('error')
      setErrorMessage(error.message || 'Failed to reinitialize media access')
    }
  }

  const handleEndCall = async () => {
    if (callTimeoutRef.current) {
      clearTimeout(callTimeoutRef.current)
      callTimeoutRef.current = null
    }
    await webrtcRef.current?.stop()
    setInCall(false)
    setCallStatus('ended')
    setCallStartTime(null)
    if (currentAppointmentId) {
      emit('consultation:end', { appointmentId: currentAppointmentId })
      emit('consultation:ringing', { appointmentId: currentAppointmentId, isRinging: false })
    }
    if (ringtoneRef.current) {
      ringtoneRef.current.pause()
      ringtoneRef.current.currentTime = 0
    }
    setIsIncomingCall(false)
    setIncomingOffer(null)
  }

  const handleAnswerCall = async () => {
    if (callTimeoutRef.current) {
      clearTimeout(callTimeoutRef.current)
      callTimeoutRef.current = null
    }
    if (!incomingOffer || !currentAppointmentId) return
    try {
      setCallStatus('connecting')
      if (ringtoneRef.current) {
        ringtoneRef.current.pause()
        ringtoneRef.current.currentTime = 0
      }
      setIsIncomingCall(false)

      // If the receiver's peer was closed from a previous call, reinitialize
      if (!webrtcRef.current || !webrtcRef.current.getPeer()) {
        console.log('Reinitializing WebRTC client to receive incoming call...')
        await webrtcRef.current?.stop()
        await initializeWebRTC()
      }
      if (!webrtcRef.current) return

      const answer = await webrtcRef.current.handleRemoteOffer(incomingOffer)
      setAudioOnly(!webrtcRef.current.isVideoEnabled())

      emit('consultation:answer', { appointmentId: currentAppointmentId, answer })
      emit('consultation:ringing', { appointmentId: currentAppointmentId, isRinging: false })
      setIncomingOffer(null)
    } catch (error) {
      console.error('Failed to handle remote offer', error)
      setCallStatus('error')
      setErrorMessage((error as Error).message || 'Failed to handle incoming call')
    }
  }

  const handleRejectCall = () => {
    if (callTimeoutRef.current) {
      clearTimeout(callTimeoutRef.current)
      callTimeoutRef.current = null
    }
    if (ringtoneRef.current) {
      ringtoneRef.current.pause()
      ringtoneRef.current.currentTime = 0
    }
    setIsIncomingCall(false)
    setIncomingOffer(null)
    if (currentAppointmentId) {
      emit('consultation:ringing', { appointmentId: currentAppointmentId, isRinging: false })
      emit('consultation:end', { appointmentId: currentAppointmentId })

      // Emit missed call event when rejected
      const receiverId = isDoctor ? currentConsultation?.patientId : currentConsultation?.doctorId
      const receiverIdStr = typeof receiverId === 'object' ? (receiverId as any)?._id || (receiverId as any)?.id : receiverId
      if (receiverIdStr) {
        emit('consultation:missed_call', { appointmentId: currentAppointmentId, receiverId: receiverIdStr })
      }
    }
  }

  useSocketEvent<{ appointmentId: string; offer: RTCSessionDescriptionInit }>('consultation:offer', async (payload) => {
    if (!payload?.offer) return
    if (currentAppointmentId && payload?.appointmentId && payload.appointmentId !== currentAppointmentId) return

    // Store offer and wait for user to answer
    setIncomingOffer(payload.offer)
    setIsIncomingCall(true)
  })

  useSocketEvent<{ appointmentId: string; isRinging: boolean; fromUserId: string }>('consultation:ringing', (payload) => {
    if (currentAppointmentId && payload?.appointmentId === currentAppointmentId) {
      if (payload.isRinging) {
        setIsIncomingCall(true)
        if (ringtoneRef.current) {
          ringtoneRef.current.play().catch(e => console.error('Error playing ringtone:', e))
        }

        // Start 120s timeout for incoming call too
        if (callTimeoutRef.current) clearTimeout(callTimeoutRef.current)
        callTimeoutRef.current = setTimeout(() => {
          if (isIncomingCall) {
            console.log('Incoming call timed out after 120 seconds')
            handleRejectCall()
            setErrorMessage('Missed call. The consultation call timed out.')
          }
        }, 120000)
      } else {
        setIsIncomingCall(false)
        if (ringtoneRef.current) {
          ringtoneRef.current.pause()
          ringtoneRef.current.currentTime = 0
        }
        if (callTimeoutRef.current) {
          clearTimeout(callTimeoutRef.current)
          callTimeoutRef.current = null
        }
      }
    }
  })

  useSocketEvent<{ appointmentId: string; fromUserId: string }>('consultation:missed_call', (payload) => {
    if (currentAppointmentId && payload?.appointmentId === currentAppointmentId) {
      setErrorMessage('You have a missed consultation call.')
    }
  })

  useSocketEvent<{ appointmentId: string; answer: RTCSessionDescriptionInit }>('consultation:answer', async (payload) => {
    if (!webrtcRef.current || !payload?.answer) return
    if (currentAppointmentId && payload?.appointmentId && payload.appointmentId !== currentAppointmentId) return
    try {
      await webrtcRef.current.handleRemoteAnswer(payload.answer)
    } catch (error) {
      console.error('Failed to handle remote answer', error)
    }
  })

  useSocketEvent<{ appointmentId: string; fromUserId: string }>('consultation:end', async (payload) => {
    if (currentAppointmentId && payload?.appointmentId === currentAppointmentId) {
      webrtcRef.current?.stop()
      setInCall(false)
      setCallStatus('ended')
      setCallStartTime(null)
    }
  })

  useSocketEvent<{ appointmentId: string; candidate: RTCIceCandidateInit }>('consultation:iceCandidate', async (payload) => {
    if (!webrtcRef.current || !payload?.candidate) return
    if (currentAppointmentId && payload?.appointmentId && payload.appointmentId !== currentAppointmentId) return
    try {
      await webrtcRef.current.addIceCandidate(payload.candidate)
    } catch (error) {
      console.error('Failed to add ICE candidate', error)
    }
  })

  // Socket event listeners for room and participant feedback
  useSocketEvent<{ appointmentId: string; roomName: string; participantCount?: number }>('consultation:joined', (payload) => {
    if (currentAppointmentId && payload?.appointmentId === currentAppointmentId) {
      console.log('Successfully joined consultation room:', payload.roomName)
      hasJoinedRoomRef.current = true
      setCallStatus('ready')
      setErrorMessage(null) // Clear any previous errors

    // If participant joins second and other is waiting, auto-initiate offer immediately
    if (payload.participantCount && payload.participantCount > 1 && !inCall && isDoctor) {
      handleStartCall()
    }
    }
  })

  useSocketEvent<{ appointmentId: string; message: string }>('consultation:error', (payload) => {
    if (currentAppointmentId && payload?.appointmentId === currentAppointmentId) {
      console.error('Consultation room error:', payload.message)
      setCallStatus('error')
      setErrorMessage(payload.message || 'Failed to join consultation room. Please refresh the page.')
    }
  })

  useSocketEvent<{ appointmentId: string; userId: string; socketId: string }>('consultation:participant_joined', async (payload) => {
    if (currentAppointmentId && payload?.appointmentId === currentAppointmentId) {
      console.log('Other participant joined the consultation room:', payload.userId)

      // Both doctors and patients can initiate offers, but prefer doctor to prevent glare
      // Use hasJoinedRoomRef for synchronous check instead of async React state
      if (!isDoctor) return
      if (webrtcRef.current && hasJoinedRoomRef.current && !inCall) {
        if (isCreatingOfferRef.current) return
        isCreatingOfferRef.current = true
        try {
          setCallStatus('connecting')
          setErrorMessage(null)
          const offer = await webrtcRef.current.createOffer()
          if (!currentAppointmentId) return
          emit('consultation:ringing', { appointmentId: currentAppointmentId, isRinging: true })
          emit('consultation:offer', { appointmentId: currentAppointmentId, offer })
          console.log('Auto-initiated offer to joining participant')
        } catch (error: any) {
          console.error('Failed to auto-initiate call on participant join:', error)
          setCallStatus('ready')
          setErrorMessage(error.message || 'Failed to start call automatically. Please click Start Call.')
        } finally {
          isCreatingOfferRef.current = false
        }
      }
    }
  })

  useSocketEvent<{ appointmentId: string; fromUserId: string }>('consultation:screenShareStarted', (payload) => {
    if (payload?.appointmentId === currentAppointmentId) {
      setRemoteScreenSharing(true)
      // Force the video element to re-bind to the stream so it picks up the
      // replaced track. Setting srcObject to the same object reference is a
      // no-op in browsers, so we must null it first.
      const remoteStream = webrtcRef.current?.getRemoteStream()
      if (remoteStream && remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null
        remoteVideoRef.current.srcObject = remoteStream
        remoteVideoRef.current.play().catch(() => {})
      }
    }
  })

  useSocketEvent<{ appointmentId: string; fromUserId: string }>('consultation:screenShareStopped', (payload) => {
    if (payload?.appointmentId === currentAppointmentId) {
      setRemoteScreenSharing(false)
      // Force re-bind so the restored camera track is rendered
      const remoteStream = webrtcRef.current?.getRemoteStream()
      if (remoteStream && remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null
        remoteVideoRef.current.srcObject = remoteStream
        remoteVideoRef.current.play().catch(() => {})
      }
    }
  })

  const toggleMic = () => {
    const localStream = webrtcRef.current?.getLocalStream()
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled
      })
      setMicEnabled((prev) => !prev)
    }
  }

  const toggleCamera = () => {
    const localStream = webrtcRef.current?.getLocalStream()
    if (localStream) {
      localStream.getVideoTracks().forEach((track) => {
        track.enabled = !track.enabled
      })
      setCameraEnabled((prev) => !prev)
    }
  }

  // Helper functions
  const formatDuration = (seconds: number) => {
    const duration = dayjs.duration(seconds, 'seconds')
    const hours = duration.hours()
    const minutes = duration.minutes()
    const secs = duration.seconds()

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  const getStatusMessage = () => {
    switch (callStatus) {
      case 'idle':
        return 'Connecting to consultation room...'
      case 'ready':
        return 'Ready. Both participants can start the call.'
      case 'connecting':
        return 'Establishing video connection...'
      case 'connected':
        const connectionType = useScreenShare ? 'Screen Sharing' : 'Video Call'
        return `${connectionType} Active - Duration: ${formatDuration(callDuration)}`
      case 'ended':
        return 'Call ended'
      case 'error':
        return errorMessage || 'Connection error'
      default:
        return 'Unknown status'
    }
  }

  const showStartCallButton = callStatus === 'ready' || callStatus === 'ended' || callStatus === 'error'
  const showEndCallButton = callStatus === 'connected'

  // Get available media devices
  const getAvailableDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      const cameras = devices.filter(device => device.kind === 'videoinput')
      const microphones = devices.filter(device => device.kind === 'audioinput')
      setAvailableDevices({ cameras, microphones })
      return { cameras, microphones }
    } catch (error) {
      console.error('Failed to enumerate devices:', error)
      return { cameras: [], microphones: [] }
    }
  }

  // Resolve the video RTCRtpSender from the peer connection.
  // Uses transceivers first because receiver.track.kind is derived from SDP and
  // never goes null, making it reliable even when the sender's current track is null
  // (e.g. audio-only fallback, or after a prior replaceTrack call).
  const getVideoSender = (): RTCRtpSender | null => {
    const peer = webrtcRef.current?.getPeer()
    if (!peer) return null
    const transceiver = peer
      .getTransceivers()
      .find(t => t.receiver.track?.kind === 'video' || t.sender.track?.kind === 'video')
    return transceiver?.sender ?? peer.getSenders().find(s => s.track?.kind === 'video') ?? null
  }

  // Start screen sharing instead of camera (mid-call track replacement)
  const startScreenShare = async () => {
    if (callStatus !== 'connected' || isCreatingOfferRef.current) return
    try {
      setErrorMessage(null)

      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
      })

      screenShareStreamRef.current = screenStream

      const videoTrack = screenStream.getVideoTracks()[0]

      // Auto-revert when user clicks the browser's native "Stop sharing" button
      videoTrack.onended = () => {
        stopScreenShare()
      }

      const sender = getVideoSender()
      if (!sender) {
        setErrorMessage('No video channel available for screen sharing.')
        screenStream.getTracks().forEach(t => t.stop())
        screenShareStreamRef.current = null
        return
      }

      await sender.replaceTrack(videoTrack)

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = screenStream
      }

      setUseScreenShare(true)
      emit('consultation:screenShareStarted', { appointmentId })
    } catch (error: any) {
      console.error('Screen sharing failed:', error)
      setErrorMessage('Screen sharing cancelled or failed.')
    }
  }

  // Stop screen sharing and revert to camera
  const stopScreenShare = async () => {
    try {
      if (screenShareStreamRef.current) {
        screenShareStreamRef.current.getTracks().forEach(track => track.stop())
        screenShareStreamRef.current = null
      }

      const cameraStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      const cameraVideoTrack = cameraStream.getVideoTracks()[0]

      const sender = getVideoSender()
      if (sender) {
        await sender.replaceTrack(cameraVideoTrack)
      }

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = cameraStream
      }

      setUseScreenShare(false)
      emit('consultation:screenShareStopped', { appointmentId })
    } catch (error: any) {
      console.error('Failed to stop screen share:', error)
      setErrorMessage('Failed to revert to camera after screen sharing.')
    }
  }

  // Start a new call using a screen-share stream instead of the camera.
  // Used when the camera is unavailable (e.g. NotReadableError) before a call has been established.
  const startCallWithScreenShare = async () => {
    if (isCreatingOfferRef.current) return
    isCreatingOfferRef.current = true
    try {
      setCallStatus('connecting')
      setErrorMessage(null)

      if (!webrtcRef.current || !webrtcRef.current.getPeer()) {
        await initializeWebRTC()
      }

      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })

      if (!webrtcRef.current) {
        screenStream.getTracks().forEach((track) => track.stop())
        setCallStatus('error')
        setErrorMessage('Failed to initialize video connection for screen sharing.')
        return
      }

      webrtcRef.current.setLocalStream(screenStream)
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = screenStream
      }
      setUseScreenShare(true)
      setAudioOnly(false)

      if (!currentAppointmentId) return
      const offer = await webrtcRef.current.createOffer()
      emit('consultation:offer', { appointmentId: currentAppointmentId, offer })
      setCallStatus('connecting')
    } catch (error: any) {
      console.error('Screen share call failed:', error)
      setCallStatus('error')
      setErrorMessage(error.message || 'Screen sharing failed')
    } finally {
      isCreatingOfferRef.current = false
    }
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Video Consultation
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Secure video consultation using WebRTC. Either participant can start the call once both are on this page.
      </Typography>

      {/* Status Banner */}
      <Paper
        sx={{
          p: 2,
          mb: 2,
          backgroundColor: callStatus === 'error' ? '#ffebee' : callStatus === 'connected' ? '#e8f5e8' : '#f5f5f5',
          border: callStatus === 'connected' ? '1px solid #4caf50' : 'none'
        }}
      >
        <Stack direction="row" alignItems="center" spacing={2}>
          {callStatus === 'connecting' && <CircularProgress size={20} />}
          {callStatus === 'connected' && <CheckCircleIcon color="success" />}
          {callStatus === 'idle' && <CircularProgress size={20} />}
          <Typography variant="body1" sx={{ fontWeight: 500 }}>
            {getStatusMessage()}
          </Typography>
          {callStatus === 'ready' && (
            <Typography variant="body2" color="text.secondary">
              Both participants can now start the video call.
            </Typography>
          )}
          {callStatus === 'ready' && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Make sure no other applications are using your camera/microphone.
            </Typography>
          )}
          {audioOnly && (
            <Chip label="Audio Only – Camera Unavailable" color="warning" size="small" />
          )}
          {!isConnected() && callStatus !== 'error' && (
            <Typography variant="body2" color="warning.main" sx={{ fontStyle: 'italic' }}>
              Reconnecting to server...
            </Typography>
          )}
          {callStatus === 'error' && (
            <Box sx={{ mt: 1 }}>
              {errorMessage?.includes('busy') || errorMessage?.includes('already in use') ? (
                <>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Camera/microphone busy. Choose different devices or share screen!
                  </Typography>
                  <Stack direction="row" spacing={1}>
                    <Button
                      size="small"
                      variant="contained"
                      color="primary"
                      onClick={() => setShowDeviceDialog(true)}
                      disabled={availableDevices.cameras.length === 0 && availableDevices.microphones.length === 0}
                    >
                      Select Devices
                    </Button>
                    <Button
                      size="small"
                      variant="contained"
                      color="secondary"
                      onClick={inCall ? startScreenShare : startCallWithScreenShare}
                    >
                      Share Screen
                    </Button>
                  </Stack>
                </>
              ) : (
                <>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {errorMessage}
                  </Typography>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => window.location.reload()}
                  >
                    Refresh Page
                  </Button>
                </>
              )}
            </Box>
          )}
        </Stack>
      </Paper>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Box
            sx={{
              position: 'relative',
              backgroundColor: 'black',
              borderRadius: 2,
              overflow: 'hidden',
              minHeight: 320,
            }}
          >
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            {remoteScreenSharing && (
              <Chip
                icon={<ScreenShareIcon />}
                label="Screen Sharing"
                size="small"
                color="secondary"
                sx={{ position: 'absolute', top: 8, left: 8 }}
              />
            )}
            <Box
              sx={{
                position: 'absolute',
                bottom: 16,
                right: 16,
                width: 160,
                height: 120,
                borderRadius: 1,
                overflow: 'hidden',
                border: (theme) => `2px solid ${theme.palette.background.paper}`,
                backgroundColor: 'black',
              }}
            >
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </Box>
          </Box>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Stack spacing={2}>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                justifyContent: 'space-between',
              }}
            >
              <Box>
                <Typography variant="h6" gutterBottom>
                  Call Controls
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Use the controls below to start, end, or adjust your call.
                </Typography>
              </Box>

              <Stack direction="row" spacing={2} justifyContent="center" sx={{ my: 2 }}>
                {showStartCallButton ? (
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<CallIcon />}
                    onClick={handleStartCall}
                    disabled={!socket}
                  >
                    {callStatus === 'ended' ? (
                      'Start New Call'
                    ) : (
                      'Start Call'
                    )}
                  </Button>
                ) : showEndCallButton ? (
                  <Button
                    variant="contained"
                    color="error"
                    startIcon={<CallEndIcon />}
                    onClick={handleEndCall}
                  >
                    End Call
                  </Button>
                ) : null}
              </Stack>

              <Stack direction="row" spacing={2} justifyContent="center" sx={{ mb: 2 }}>
                <IconButton
                  color={micEnabled ? 'primary' : 'default'}
                  onClick={toggleMic}
                  disabled={callStatus !== 'connected'}
                  title="Toggle Microphone"
                >
                  {micEnabled ? <MicIcon /> : <MicOffIcon />}
                </IconButton>
                <IconButton
                  color={cameraEnabled ? 'primary' : 'default'}
                  onClick={toggleCamera}
                  disabled={callStatus !== 'connected' || useScreenShare}
                  title={useScreenShare ? "Screen sharing active" : "Toggle Camera"}
                >
                  {cameraEnabled ? <VideocamIcon /> : <VideocamOffIcon />}
                </IconButton>
                <IconButton
                  color={useScreenShare ? 'secondary' : 'default'}
                  onClick={useScreenShare ? stopScreenShare : startScreenShare}
                  disabled={callStatus !== 'connected'}
                  title={useScreenShare ? 'Stop Screen Share' : 'Share Screen'}
                >
                  {useScreenShare ? <StopScreenShareIcon /> : <ScreenShareIcon />}
                </IconButton>
                <IconButton
                  color="default"
                  onClick={() => setShowDeviceDialog(true)}
                  disabled={callStatus === 'connecting'}
                  title="Select Camera/Microphone"
                >
                  <SettingsIcon />
                </IconButton>
              </Stack>
            </Box>

            {/* Notes Panel for Doctors */}
            {isDoctor && (
              <>
                <Paper sx={{ p: 2 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      mb: 1,
                      cursor: 'pointer',
                    }}
                    onClick={() => setNotesPanelOpen(!notesPanelOpen)}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <NotesIcon />
                      <Typography variant="h6">Consultation Notes</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {saveStatus === 'saving' && <CircularProgress size={16} />}
                      {saveStatus === 'saved' && (
                        <Chip
                          icon={<CheckCircleIcon />}
                          label="Saved"
                          size="small"
                          color="success"
                          sx={{ height: 24 }}
                        />
                      )}
                      {notesPanelOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </Box>
                  </Box>
                  <Collapse in={notesPanelOpen}>
                    <TextField
                      multiline
                      rows={10}
                      maxRows={20}
                      fullWidth
                      placeholder="Enter consultation notes here..."
                      value={notes}
                      onChange={(e) => handleNotesChange(e.target.value)}
                      disabled={updatingNotes}
                      inputProps={{ maxLength: 2000 }}
                      helperText={`${notes.length}/2000 characters`}
                      sx={{ mt: 1 }}
                    />
                  </Collapse>
                </Paper>

                {/* Create Prescription Button */}
                <Paper sx={{ p: 2 }}>
                  <Button
                    variant="contained"
                    fullWidth
                    startIcon={<AddIcon />}
                    onClick={() => setPrescriptionDialogOpen(true)}
                  >
                    Create Prescription
                  </Button>
                </Paper>
              </>
            )}
          </Stack>
        </Grid>
      </Grid>

      {/* Create Prescription Dialog */}
      {isDoctor && currentConsultation && (
        <CreatePrescriptionForm
          open={prescriptionDialogOpen}
          onClose={() => setPrescriptionDialogOpen(false)}
          patientId={
            typeof currentConsultation.patientId === 'object'
              ? currentConsultation.patientId?._id || currentConsultation.patientId?.id
              : currentConsultation.patientId
          }
          appointmentId={currentAppointmentId || undefined}
          consultationId={consultationId || undefined}
          onSuccess={() => {
            setPrescriptionDialogOpen(false)
          }}
        />
      )}

      {/* Snackbar for error messages */}
      <Snackbar
        open={!!errorMessage}
        autoHideDuration={6000}
        onClose={() => setErrorMessage(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={() => setErrorMessage(null)} severity="error" sx={{ width: '100%' }}>
          {errorMessage}
        </Alert>
      </Snackbar>

      {/* Incoming Call Dialog */}
      <MuiDialog open={isIncomingCall} maxWidth="xs" fullWidth>
        <MuiDialogTitle sx={{ textAlign: 'center', pt: 4 }}>
          <VideocamIcon color="primary" sx={{ fontSize: 64, mb: 2 }} />
          <Typography variant="h5">Incoming Video Call</Typography>
        </MuiDialogTitle>
        <MuiDialogContent sx={{ textAlign: 'center' }}>
          <Typography variant="body1">
            {isDoctor ? 'The patient' : 'The doctor'} is calling you for the consultation.
          </Typography>
        </MuiDialogContent>
        <MuiDialogActions sx={{ justifyContent: 'center', pb: 4, px: 4, gap: 2 }}>
          <Button
            variant="contained"
            color="error"
            startIcon={<CallEndIcon />}
            onClick={handleRejectCall}
            fullWidth
            sx={{ borderRadius: 8 }}
          >
            Reject
          </Button>
          <Button
            variant="contained"
            color="success"
            startIcon={<CallIcon />}
            onClick={handleAnswerCall}
            fullWidth
            sx={{ borderRadius: 8 }}
          >
            Answer
          </Button>
        </MuiDialogActions>
      </MuiDialog>

      {/* Device Selection Dialog */}
      <MuiDialog open={showDeviceDialog} onClose={() => setShowDeviceDialog(false)} maxWidth="sm" fullWidth>
        <MuiDialogTitle>Select Camera & Microphone</MuiDialogTitle>
        <MuiDialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Camera</InputLabel>
              <Select
                value={selectedCamera}
                onChange={(e) => setSelectedCamera(e.target.value)}
                label="Camera"
              >
                {availableDevices.cameras.map((camera) => (
                  <MenuItem key={camera.deviceId} value={camera.deviceId}>
                    {camera.label || `Camera ${camera.deviceId.slice(0, 8)}`}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Microphone</InputLabel>
              <Select
                value={selectedMicrophone}
                onChange={(e) => setSelectedMicrophone(e.target.value)}
                label="Microphone"
              >
                {availableDevices.microphones.map((mic) => (
                  <MenuItem key={mic.deviceId} value={mic.deviceId}>
                    {mic.label || `Microphone ${mic.deviceId.slice(0, 8)}`}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Typography variant="body2" color="text.secondary">
              If your preferred camera/microphone is busy, try selecting a different device.
            </Typography>
          </Stack>
        </MuiDialogContent>
        <MuiDialogActions>
          <Button onClick={() => setShowDeviceDialog(false)}>Cancel</Button>
          <Button
            onClick={() => {
              setShowDeviceDialog(false)
              handleRetryMediaAccess()
            }}
            variant="contained"
          >
            Use Selected Devices
          </Button>
        </MuiDialogActions>
      </MuiDialog>
    </Container>
  )
}

export default ConsultationPage
