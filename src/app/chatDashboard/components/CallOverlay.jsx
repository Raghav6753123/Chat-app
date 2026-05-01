import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Phone, PhoneOff, Video, VideoOff, Mic, MicOff, Maximize, Minimize } from 'lucide-react';
import { getPusherClient } from '@/lib/pusher-client';

export default function CallOverlay({
  currentUser,
  activeCall,
  incomingCall,
  onAccept,
  onReject,
  onEndCall,
}) {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);

  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [callState, setCallState] = useState('connecting'); // calling, connecting, connected
  const durationIntervalRef = useRef(null);
  const pendingCandidatesRef = useRef([]);

  const sendSignal = async (payload) => {
    const targetConversationId = activeCall?.conversationId || incomingCall?.conversationId;
    await fetch('/api/calls/signal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conversationId: targetConversationId,
        targetUserId: null, // broadcast to conversation
        callId: activeCall?.callId || incomingCall?.callId,
        ...payload
      }),
    });
  };

  const setupWebRTC = useCallback(async (isInitiator) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: (activeCall?.callType || incomingCall?.callType) === 'video',
        audio: true,
      });
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
      });
      peerConnectionRef.current = pc;

      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      pc.ontrack = (event) => {
        setCallState('connected');
        if (remoteVideoRef.current && event.streams[0]) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          sendSignal({ signalType: 'ice-candidate', candidate: event.candidate });
        }
      };

      if (isInitiator) {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        await sendSignal({ signalType: 'offer', sdp: offer, callType: activeCall?.callType });
      } else if (incomingCall?.sdp || activeCall?.sdp) {
        const remoteSdp = incomingCall?.sdp || activeCall?.sdp;
        await pc.setRemoteDescription(new RTCSessionDescription(remoteSdp));
        
        // Add any pending ice candidates that arrived before we were ready
        while (pendingCandidatesRef.current.length) {
          const candidate = pendingCandidatesRef.current.shift();
          await pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(console.error);
        }

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        await sendSignal({ signalType: 'answer', sdp: answer });
      }
    } catch (err) {
      console.error('WebRTC Setup Error:', err);
      // handle error...
      cleanupCall();
      onEndCall?.('failed');
    }
  }, [activeCall, incomingCall]);

  useEffect(() => {
    if (activeCall?.type === 'outgoing') {
      setCallState('calling');
      setupWebRTC(true);
    }
  }, [activeCall?.type, setupWebRTC]);

  useEffect(() => {
    if (callState === 'connected') {
      durationIntervalRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(durationIntervalRef.current);
    }
    return () => clearInterval(durationIntervalRef.current);
  }, [callState]);

  // Handle incoming signals
  useEffect(() => {
    if (!currentUser?.id) return;
    const pusher = getPusherClient();
    if (!pusher) return;
    const conversationId = activeCall?.conversationId || incomingCall?.conversationId;
    if (!conversationId) return;

    const channelName = `private-conversation-${conversationId}`;
    let channel = pusher.channel(channelName);
    if (!channel) return;

    const handleSignal = async (data) => {
      if (data.senderId === currentUser.id) return; // ignore own signals
      
      const pc = peerConnectionRef.current;
      
      if (data.signalType === 'answer' && pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(data.sdp)).catch(console.error);
      } else if (data.signalType === 'ice-candidate') {
        if (pc && pc.remoteDescription) {
          await pc.addIceCandidate(new RTCIceCandidate(data.candidate)).catch(console.error);
        } else {
          // Queue candidates if PC isn't ready or remote desc isn't set
          pendingCandidatesRef.current.push(data.candidate);
        }
      } else if (data.signalType === 'reject') {
        cleanupCall();
        onEndCall?.('rejected');
      } else if (data.signalType === 'end') {
        cleanupCall();
        onEndCall?.('completed', callDuration);
      }
    };

    channel.bind('call-signal', handleSignal);
    return () => {
      channel.unbind('call-signal', handleSignal);
    };
  }, [activeCall, incomingCall, currentUser?.id, callDuration]);

  const cleanupCall = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
      localStreamRef.current = null;
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    clearInterval(durationIntervalRef.current);
  };

  const handleEndCall = () => {
    sendSignal({ signalType: 'end' });
    cleanupCall();
    onEndCall?.(callState === 'connected' ? 'completed' : 'cancelled', callDuration);
  };

  const handleAccept = async () => {
    setCallState('connecting');
    await setupWebRTC(false);
    onAccept?.();
  };

  const handleReject = () => {
    sendSignal({ signalType: 'reject' });
    cleanupCall();
    onReject?.();
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  if (incomingCall && !activeCall) {
    // Incoming call small notification
    return (
      <div className="fixed top-4 right-4 z-50 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 w-72 flex flex-col gap-3 animate-in slide-in-from-top-4 fade-in duration-300">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-sky-100 flex items-center justify-center overflow-hidden shrink-0 text-sky-600">
            {incomingCall.senderAvatar ? (
              <img src={incomingCall.senderAvatar} alt={incomingCall.senderName} className="w-full h-full object-cover" />
            ) : (
              incomingCall.callType === 'video' ? <Video size={20} /> : <Phone size={20} />
            )}
          </div>
          <div>
            <h4 className="font-semibold text-gray-800">{incomingCall.senderName}</h4>
            <p className="text-xs text-gray-500">Incoming {incomingCall.callType} call...</p>
          </div>
        </div>
        <div className="flex gap-2 w-full mt-1">
          <button onClick={handleReject} className="flex-1 py-1.5 bg-red-100 text-red-600 hover:bg-red-200 rounded-lg text-sm font-semibold transition-colors">
            Decline
          </button>
          <button onClick={handleAccept} className="flex-1 py-1.5 bg-emerald-500 text-white hover:bg-emerald-600 rounded-lg text-sm font-semibold transition-colors">
            Accept
          </button>
        </div>
      </div>
    );
  }

  if (!activeCall) return null;

  const isVideo = (activeCall.callType || incomingCall?.callType) === 'video';

  // Active call UI
  return (
    <div className="fixed inset-0 z-50 bg-gray-900/95 backdrop-blur-sm flex flex-col items-center justify-center p-4">
      {/* Remote Video / Avatar */}
      <div className="relative w-full max-w-4xl aspect-[16/9] bg-gray-800 rounded-2xl overflow-hidden shadow-2xl flex items-center justify-center">
        {isVideo ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center gap-4 text-white">
            <audio ref={remoteVideoRef} autoPlay playsInline className="hidden" />
            <div className="w-32 h-32 rounded-full bg-gray-700 flex items-center justify-center text-4xl">
              <Phone size={48} className="text-gray-400" />
            </div>
            <h2 className="text-2xl font-semibold">{incomingCall?.senderName || 'Calling...'}</h2>
            <p className="text-gray-400">{callState === 'connected' ? formatTime(callDuration) : callState}</p>
          </div>
        )}

        {/* Local Video Thumbnail */}
        {isVideo && (
          <div className="absolute bottom-4 right-4 w-32 md:w-48 aspect-video bg-gray-950 rounded-xl overflow-hidden shadow-lg border border-gray-700/50">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover transform scale-x-[-1]"
            />
          </div>
        )}

        {isVideo && callState === 'connected' && (
          <div className="absolute top-4 left-4 bg-black/50 px-3 py-1 rounded-full text-white text-sm font-medium backdrop-blur-md">
            {formatTime(callDuration)}
          </div>
        )}
      </div>

      {/* Call Controls */}
      <div className="mt-8 flex items-center gap-4">
        <button
          onClick={toggleMute}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
            isMuted ? 'bg-gray-700 text-white' : 'bg-white/10 text-white hover:bg-white/20'
          }`}
        >
          {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
        </button>

        {isVideo && (
          <button
            onClick={toggleVideo}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
              isVideoOff ? 'bg-gray-700 text-white' : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            {isVideoOff ? <VideoOff size={24} /> : <Video size={24} />}
          </button>
        )}

        <button
          onClick={handleEndCall}
          className="w-16 h-16 rounded-full flex items-center justify-center bg-red-500 text-white hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20 ml-4"
        >
          <PhoneOff size={28} />
        </button>
      </div>
    </div>
  );
}
