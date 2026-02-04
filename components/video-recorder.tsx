'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Video, StopCircle, RefreshCw, CheckCircle, Smartphone } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface VideoRecorderProps {
    onRecordingComplete: (videoBlob: Blob) => void;
}

export function VideoRecorder({ onRecordingComplete }: VideoRecorderProps) {
    const [isRecording, setIsRecording] = useState(false);
    const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
    const [countdown, setCountdown] = useState(30);
    const [error, setError] = useState<string | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        return () => {
            // Cleanup stream on unmount
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, [previewUrl]);

    const startCamera = async () => {
        try {
            setError(null);
            // Try to get both video and audio first
            const stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
            });
            streamRef.current = stream;

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err: any) {
            console.error("Camera/Audio Error:", err);

            // If the initial attempt fails, try video only
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: false
                });
                streamRef.current = stream;

                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
                // Inform user that audio is disabled
                setError("Microphone access denied or unavailable. Recording will be video only.");
            } catch (videoErr: any) {
                console.error("Camera Error:", videoErr);
                if (videoErr.name === 'NotAllowedError') {
                    setError("Permission denied. Please allow camera access in your browser settings.");
                } else if (videoErr.name === 'NotFoundError') {
                    setError("No camera device found.");
                } else {
                    setError("Unable to access camera. " + (videoErr.message || ""));
                }
            }
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
    };

    const startRecording = async () => {
        if (!streamRef.current) await startCamera();
        if (!streamRef.current) return;

        setRecordedBlob(null);
        setPreviewUrl(null);
        chunksRef.current = [];

        const mediaRecorder = new MediaRecorder(streamRef.current);
        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) {
                chunksRef.current.push(e.data);
            }
        };

        mediaRecorder.onstop = () => {
            const blob = new Blob(chunksRef.current, { type: 'video/mp4' });
            setRecordedBlob(blob);
            const url = URL.createObjectURL(blob);
            setPreviewUrl(url);
            onRecordingComplete(blob);
            stopCamera();
        };

        mediaRecorder.start();
        setIsRecording(true);
        setCountdown(30);

        // Clear any existing timer
        if (timerRef.current) clearInterval(timerRef.current);

        // Timer logic
        timerRef.current = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    stopRecording();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    };

    const resetRecording = () => {
        setRecordedBlob(null);
        setPreviewUrl(null);
        startCamera();
    };

    return (
        <div className="space-y-4">
            {error && (
                <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            <div className="relative rounded-2xl overflow-hidden bg-black aspect-video flex items-center justify-center border border-zinc-800">
                {!isRecording && !recordedBlob && (
                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-zinc-500">
                        {/* Preview Placeholder */}
                        {!streamRef.current && (
                            <Button variant="outline" onClick={startCamera} className="bg-zinc-800 border-zinc-700 text-zinc-300">
                                <Smartphone className="mr-2" /> Enable Camera
                            </Button>
                        )}
                    </div>
                )}

                {/* Live Preview */}
                <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    className={`w-full h-full object-cover ${recordedBlob ? 'hidden' : 'block'}`}
                />

                {/* Recorded Playback */}
                {previewUrl && (
                    <video
                        src={previewUrl}
                        controls
                        className="w-full h-full object-contain"
                    />
                )}

                {isRecording && (
                    <div className="absolute top-4 right-4 bg-red-600 px-3 py-1 rounded-full text-white font-mono font-bold animate-pulse flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-white" />
                        {countdown}s
                    </div>
                )}
            </div>

            <div className="flex justify-center gap-4">
                {!isRecording && !recordedBlob && (
                    <Button onClick={startRecording} disabled={!!error} className="bg-red-600 hover:bg-red-700 w-full">
                        <Video className="mr-2 h-4 w-4" /> Start Recording
                    </Button>
                )}

                {isRecording && (
                    <Button onClick={stopRecording} variant="destructive" className="w-full animate-pulse">
                        <StopCircle className="mr-2 h-4 w-4" /> Stop Recording
                    </Button>
                )}

                {recordedBlob && (
                    <Button onClick={resetRecording} variant="outline" className="w-full border-zinc-700 text-zinc-300 hover:bg-zinc-800">
                        <RefreshCw className="mr-2 h-4 w-4" /> Retake
                    </Button>
                )}
            </div>

            {recordedBlob && (
                <p className="text-center text-xs text-green-400 flex items-center justify-center gap-2">
                    <CheckCircle size={14} /> Video captured successfully
                </p>
            )}
        </div>
    );
}
