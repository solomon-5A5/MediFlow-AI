import React from 'react';
import { JitsiMeeting } from '@jitsi/react-sdk';
import { X, ShieldCheck } from 'lucide-react';

const VideoConsultation = ({ meetLink, userName, onEndCall }) => {
    // 1. Extract just the room name (e.g., "MediFlow_Consultation_12345") from the full URL
    const roomName = meetLink ? meetLink.split('/').pop() : '';

    if (!roomName) return null;

    return (
        <div className="fixed inset-0 z-[100] bg-[#100e1b] flex flex-col animate-in fade-in duration-300">
            
            {/* 🟢 CUSTOM MEDIFLOW HEADER */}
            <div className="h-16 bg-[#1a1625] border-b border-white/10 flex items-center justify-between px-6 shadow-md z-10">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#5747e6]/20 flex items-center justify-center text-[#5747e6]">
                        <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-white font-bold font-display text-sm flex items-center gap-2">
                            MediFlow Secure Telehealth
                            <span className="flex h-2 w-2 relative">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                            </span>
                        </h2>
                        <p className="text-xs text-slate-400 font-mono">End-to-End Encrypted</p>
                    </div>
                </div>

                {/* Snap back to the dashboard when clicked */}
                <button 
                    onClick={onEndCall}
                    className="px-4 py-2 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-lg font-bold text-sm transition-colors flex items-center gap-2 border border-red-500/20 hover:border-red-500">
                    <X className="w-4 h-4" /> Leave Session
                </button>
            </div>

            {/* 🟢 THE EMBEDDED JITSI PLAYER */}
            <div className="flex-1 bg-black">
                <JitsiMeeting
                    domain="meet.jit.si"
                    roomName={roomName}
                    configOverwrite={{
                        startWithAudioMuted: true,
                        startWithVideoMuted: false,
                        disableModeratorIndicator: true,
                        prejoinPageEnabled: false, // Drops them right into the call without the middle screen
                    }}
                    interfaceConfigOverwrite={{
                        DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
                        SHOW_CHROME_EXTENSION_BANNER: false,
                    }}
                    userInfo={{
                        displayName: userName // Automatically sets their name in the video call
                    }}
                    onApiReady={(externalApi) => {
                        // Optional: Listen for when they click the red hangup phone icon inside Jitsi itself
                        externalApi.addListener('videoConferenceLeft', onEndCall);
                    }}
                    getIFrameRef={(iframeRef) => {
                        // Forces the iframe to perfectly fill the container we gave it
                        iframeRef.style.height = '100%';
                        iframeRef.style.width = '100%';
                    }}
                />
            </div>
        </div>
    );
};

export default VideoConsultation;