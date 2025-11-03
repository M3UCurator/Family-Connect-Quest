import React, { useState, useRef } from 'react';

interface AudioRecorderProps {
  onRecordingComplete: (audioDataUrl: string) => void;
  currentRecording?: string;
  turnIndex: number;
  disabled: boolean;
}

const MicIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm5 4a1 1 0 10-2 0v1.586l-1.293-1.293a1 1 0 00-1.414 1.414L8.586 11H7a1 1 0 100 2h6a1 1 0 100-2h-1.586l1.293-1.293a1 1 0 10-1.414-1.414L12 9.586V8zM4 9a1 1 0 011-1h.5a5.002 5.002 0 014.5 5v.5a1 1 0 11-2 0v-.5a3 3 0 00-3-3H5a1 1 0 01-1-1z" clipRule="evenodd" />
    </svg>
);

const StopIcon = () => (
     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1zm4 0a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
);

const PlayIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
    </svg>
);

const PauseIcon = () => (
     <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1zm4 0a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
);


export const AudioRecorder: React.FC<AudioRecorderProps> = ({ onRecordingComplete, currentRecording, turnIndex, disabled }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [permissionBlocked, setPermissionBlocked] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    
    // Custom Player State
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);

    const audioKey = `${turnIndex}-${currentRecording?.length || 0}`;

    const handleStartRecording = async () => {
        if (isRecording || disabled) return;
        
        // Stop any currently playing audio before starting a new recording
        if (audioRef.current && isPlaying) {
             audioRef.current.pause();
             setIsPlaying(false);
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            setPermissionBlocked(false);
            const recorder = new MediaRecorder(stream);
            mediaRecorderRef.current = recorder;
            audioChunksRef.current = [];

            recorder.ondataavailable = (event) => {
                audioChunksRef.current.push(event.data);
            };

            recorder.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                const reader = new FileReader();
                reader.readAsDataURL(audioBlob);
                reader.onloadend = () => {
                    const base64data = reader.result as string;
                    onRecordingComplete(base64data);
                };
                stream.getTracks().forEach(track => track.stop()); // Release microphone
            };

            recorder.start();
            setIsRecording(true);
        } catch (err) {
            console.error("Error accessing microphone:", err);
            setPermissionBlocked(true);
        }
    };

    const handleStopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    // Custom Player Logic
    const onLoadedMetadata = () => {
        if (audioRef.current) {
            setDuration(audioRef.current.duration);
        }
    };
    
    const onTimeUpdate = () => {
        if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
        }
    };

    const onEnded = () => {
        setIsPlaying(false);
        setCurrentTime(0); // Reset to beginning for re-play
    };

    const togglePlayPause = () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
                setIsPlaying(false);
            } else {
                audioRef.current.play();
                setIsPlaying(true);
            }
        }
    };
    
    const formatTime = (timeInSeconds: number) => {
        if (isNaN(timeInSeconds) || timeInSeconds === 0) return "00:00";
        const minutes = Math.floor(timeInSeconds / 60);
        const seconds = Math.floor(timeInSeconds % 60);
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

    return (
        <div className="w-full bg-white/80 p-4 rounded-lg shadow-inner space-y-3">
            {permissionBlocked && (
                <p className="text-sm text-center text-red-600 font-bold">
                    Microphone access was denied. Please enable it in your browser settings to record audio.
                </p>
            )}
            {currentRecording ? (
                <div className="flex flex-col items-center w-full">
                    <p className="text-sm font-bold text-brand-dark mb-2">Listen to the answer:</p>
                    <audio
                        key={audioKey}
                        ref={audioRef}
                        src={currentRecording}
                        onLoadedMetadata={onLoadedMetadata}
                        onTimeUpdate={onTimeUpdate}
                        onEnded={onEnded}
                        controlsList="nodownload" 
                    />
                    <div className="flex items-center w-full gap-3">
                        <button onClick={togglePlayPause} className="text-brand-secondary hover:text-brand-primary transition-colors focus:outline-none">
                            {isPlaying ? <PauseIcon /> : <PlayIcon />}
                        </button>
                        <div className="flex-grow bg-gray-300 rounded-full h-2.5">
                            <div
                                className="bg-brand-secondary h-2.5 rounded-full"
                                style={{ width: `${progress}%` }}
                            ></div>
                        </div>
                        <span className="text-sm font-semibold text-brand-dark tabular-nums w-24 text-center">
                            {formatTime(currentTime)} / {formatTime(duration)}
                        </span>
                    </div>
                </div>
            ) : <p className="text-sm text-center text-gray-600">Record your answer below!</p>}

            <div className="flex justify-center">
                {!isRecording ? (
                     <button
                        onClick={handleStartRecording}
                        disabled={disabled}
                        className="flex items-center justify-center w-full max-w-xs bg-brand-primary text-white font-bold py-3 px-4 rounded-lg hover:bg-opacity-90 transition transform hover:scale-105 disabled:bg-red-300 disabled:scale-100 shadow-md"
                    >
                        <MicIcon /> {currentRecording ? 'Record Again' : 'Record Answer'}
                    </button>
                ) : (
                    <button
                        onClick={handleStopRecording}
                        className="flex items-center justify-center w-full max-w-xs bg-red-500 text-white font-bold py-3 px-4 rounded-lg animate-pulse shadow-md"
                    >
                        <StopIcon /> Stop Recording
                    </button>
                )}
            </div>
        </div>
    );
};