import React, { useRef } from 'react';
import { JitsiMeeting } from '@jitsi/react-sdk';
import { X, PhoneOff } from 'lucide-react';

const VideoConsultation = ({ meetLink, userName, onEndCall }) => {
    const apiRef = useRef(null);

    // Jitsi requires just the "Room Name", not the full URL.
    // So if your link is "https://meet.jit.si/MediFlow_123", we extract "MediFlow_123"
    const roomName = meetLink ? meetLink.split('/').pop() : 'MediFlow_Emergency_Room';

    const handleReadyToClose = () => {
        onEndCall();
    };

    return (
        <div className="fixed inset-0 z-[100] bg-[#100e1b] flex flex-col animate-in fade-in duration-300">
            
            {/* Custom Header so they don't feel like they left MediFlow */}
            <div className="h-16 bg-[#1a172c] border-b border-white/10 flex items-center justify-between px-6 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                    <h2 className="text-white font-bold font-display tracking-wide">MediFlow Secure Telehealth</h2>
                </div>
                <button 
                    onClick={handleReadyToClose}
                    className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-lg font-bold transition-all"
                >
                    <PhoneOff className="w-4 h-4" /> End Consultation
                </button>
            </div>

            {/* The Actual Video Call */}
            <div className="flex-1 w-full bg-black">
                <JitsiMeeting
                    domain="meet.jit.si"
                    roomName={roomName}
                    configOverwrite={{
                        startWithAudioMuted: false,
                        startWithVideoMuted: false,
                        disableModeratorIndicator: true,
                        prejoinPageEnabled: false, // Skips the lobby, drops them right in!
                    }}
                    interfaceConfigOverwrite={{
                        DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
                        SHOW_CHROME_EXTENSION_BANNER: false
                    }}
                    userInfo={{
                        displayName: userName
                    }}
                    onApiReady={(externalApi) => {
                        apiRef.current = externalApi;
                        // Listen for when the user clicks the red "Hangup" button inside Jitsi
                        externalApi.addListener('videoConferenceLeft', handleReadyToClose);
                    }}
                    getIFrameRef={(iframeRef) => { 
                        iframeRef.style.height = '100%'; 
                        iframeRef.style.width = '100%'; 
                    }}
                />
            </div>
        </div>
    );
};

export default VideoConsultation;