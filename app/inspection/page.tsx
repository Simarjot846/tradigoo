"use client";

import { useEffect, useRef, useState } from "react";
import jsQR from "jsqr";
import CryptoJS from "crypto-js";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Camera, CheckCircle, AlertTriangle, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function InspectionScannerPage() {
    const router = useRouter();
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [scanning, setScanning] = useState(true);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    // Camera Logic
    // Camera Logic with Safety Checks
    useEffect(() => {
        let animationFrameId: number;
        let stream: MediaStream | null = null;
        let isMounted = true;

        const startCamera = async () => {
            // Double check ref existence before even asking for permissions if possible, 
            // but usually we need permission first.
            // Just ensure we don't crash if ref is gone after await.
            try {
                const constraints = { video: { facingMode: "environment" } };
                stream = await navigator.mediaDevices.getUserMedia(constraints);

                if (!isMounted) {
                    stream.getTracks().forEach(track => track.stop());
                    return;
                }

                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.setAttribute("playsinline", "true"); // required for iOS

                    // Wait for video to be ready
                    videoRef.current.onloadedmetadata = () => {
                        if (videoRef.current && isMounted) {
                            videoRef.current.play().catch(e => console.error("Play error:", e));
                            requestAnimationFrame(tick);
                        }
                    };
                }
            } catch (err) {
                console.error("Camera Error:", err);
                if (isMounted) {
                    setError("Camera access denied or unavailable. Please ensure you gave permission.");
                    setScanning(false);
                }
            }
        };

        const tick = () => {
            if (!isMounted || !scanning) return;

            if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
                if (canvasRef.current) {
                    const canvas = canvasRef.current;
                    const ctx = canvas.getContext("2d", { willReadFrequently: true }); // optimize for read
                    if (ctx) {
                        canvas.height = videoRef.current.videoHeight;
                        canvas.width = videoRef.current.videoWidth;
                        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

                        try {
                            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                            const code = jsQR(imageData.data, imageData.width, imageData.height, {
                                inversionAttempts: "dontInvert",
                            });

                            if (code) {
                                handleScan(code.data);
                                return;
                            }
                        } catch (e) {
                            console.warn("Frame read error", e);
                        }
                    }
                }
            }
            animationFrameId = requestAnimationFrame(tick);
        };

        if (scanning) {
            startCamera();
        }

        return () => {
            isMounted = false;
            cancelAnimationFrame(animationFrameId);
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
            if (videoRef.current) {
                videoRef.current.srcObject = null;
            }
        };
    }, [scanning]);

    const handleScan = (rawData: string) => {
        setScanning(false);
        try {
            // Check if it's a URL or raw data
            let encryptedString = rawData;
            if (rawData.includes("?data=")) {
                const url = new URL(rawData);
                encryptedString = decodeURIComponent(url.searchParams.get("data") || "");
            }

            // Decrypt
            const secretKey = "TRADIGOO_SECRET_KEY_PROD";
            const bytes = CryptoJS.AES.decrypt(encryptedString, secretKey);
            const decryptedString = bytes.toString(CryptoJS.enc.Utf8);

            if (!decryptedString) throw new Error("Invalid Tradigoo Encrypted QR");

            const data = JSON.parse(decryptedString);
            setResult(data);
            toast.success("Parcel Verified Successfully!");

        } catch (e) {
            setError("Invalid QR Code. This is not a Tradigoo Secure Parcel.");
        }
    };

    const reset = () => {
        setResult(null);
        setError(null);
        setScanning(true);
    };

    return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 relative">
            <Button variant="ghost" className="absolute top-4 left-4 text-white hover:bg-white/10" onClick={() => router.back()}>
                <ArrowLeft className="w-5 h-5 mr-2" /> Back
            </Button>

            <h1 className="text-2xl font-bold text-white mb-6">Scan Internal QR</h1>

            {error ? (
                <Card className="max-w-md w-full bg-red-900/10 border-red-500/50 p-6 text-center">
                    <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h3 className="text-white font-bold mb-2">Scan Failed</h3>
                    <p className="text-red-200 text-sm mb-6">{error}</p>
                    <Button onClick={reset} className="bg-red-600 hover:bg-red-500 text-white w-full">Try Again</Button>
                </Card>
            ) : result ? (
                <Card className="max-w-md w-full bg-zinc-900 border-emerald-500 p-6 text-center">
                    <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-[0_0_20px_rgba(16,185,129,0.4)]">
                        <CheckCircle className="w-8 h-8 text-black" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-1">Match Confirmed</h2>
                    <p className="text-zinc-400 text-sm mb-6">Parcel contents match order manifest.</p>

                    <div className="bg-black/40 rounded-lg p-4 mb-6 text-left border border-white/5">
                        <div className="mb-3">
                            <span className="text-xs text-zinc-500 uppercase font-bold">Product</span>
                            <div className="text-white font-semibold text-lg">{result.p}</div>
                        </div>
                        <div className="flex justify-between">
                            <div>
                                <span className="text-xs text-zinc-500 uppercase font-bold">Qty</span>
                                <div className="text-white">{result.q}</div>
                            </div>
                            <div className="text-right">
                                <span className="text-xs text-zinc-500 uppercase font-bold">Order</span>
                                <div className="text-white">#{result.id?.slice(0, 6)}</div>
                            </div>
                        </div>
                    </div>

                    <Button onClick={() => router.push('/dashboard')} className="w-full bg-emerald-600 hover:bg-emerald-500 font-bold">
                        Process Delivery
                    </Button>
                </Card>
            ) : (
                <div className="relative w-full max-w-sm aspect-square bg-zinc-900 rounded-3xl overflow-hidden border-2 border-zinc-800 shadow-2xl">
                    <video ref={videoRef} className="w-full h-full object-cover" />
                    <canvas ref={canvasRef} className="hidden" />

                    {/* Scanner Overlay UI */}
                    <div className="absolute inset-0 border-[30px] border-black/50 flex items-center justify-center pointer-events-none">
                        <div className="w-48 h-48 border-2 border-white/50 rounded-lg relative">
                            <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-emerald-500 -mt-1 -ml-1"></div>
                            <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-emerald-500 -mt-1 -mr-1"></div>
                            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-emerald-500 -mb-1 -ml-1"></div>
                            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-emerald-500 -mb-1 -mr-1"></div>

                            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-red-500 shadow-[0_0_10px_red] animate-pulse"></div>
                        </div>
                    </div>
                    <div className="absolute bottom-6 left-0 w-full text-center text-white/80 text-sm font-medium">
                        Align QR code within frame
                    </div>
                </div>
            )}

            {/* Mock Trigger for Dev without Camera */}
            {scanning && (
                <div className="mt-8">
                    <Button variant="ghost" className="text-zinc-600 text-xs" onClick={() => {
                        // Create a mock encrypted string for testing
                        const secretKey = "TRADIGOO_SECRET_KEY_PROD";
                        const payload = JSON.stringify({
                            id: "550e8400-e29b-41d4-a716-446655440000",
                            p: "iPhone 15 Pro Max",
                            q: 5,
                            t: new Date().toISOString()
                        });
                        const encrypted = CryptoJS.AES.encrypt(payload, secretKey).toString();
                        handleScan(encrypted);
                    }}>
                        Simulate Mock Scan (Dev Only)
                    </Button>
                </div>
            )}
            {/* Manual Verification */}
            <div className="mt-8 w-full max-w-sm">
                <div className="bg-zinc-900/80 border border-white/10 rounded-xl p-4">
                    <p className="text-sm text-zinc-400 mb-2 font-medium">Offline/Manual Verification</p>
                    <Textarea
                        placeholder="Paste scanned QR data here..."
                        className="bg-black/50 border-white/10 text-white min-h-[80px] mb-3 text-xs font-mono"
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                            if (e.target.value.length > 20) {
                                handleScan(e.target.value);
                            }
                        }}
                    />
                    <p className="text-[10px] text-zinc-600">
                        If camera fails, use a generic QR scanner app and copy-paste the code here.
                    </p>
                </div>
            </div>
        </div>
    );
}

// Helper to avoid import error if UI component missing
function Textarea(props: any) {
    return <textarea {...props} className={`flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${props.className}`} />
}
