"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import Webcam from "react-webcam";
import { X, Check, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PushupDetectorProps = {
    onFinish: (reps: number) => void;
    onClose: () => void;
};

type PushupState = "UP" | "DOWN" | "TRANSITION" | "INVALID";

// MediaPipe landmark connections for pose skeleton
const POSE_CONNECTIONS: [number, number][] = [
    [11, 12], [11, 13], [13, 15], [12, 14], [14, 16], // Arms
    [11, 23], [12, 24], [23, 24], // Torso
    [23, 25], [24, 26], [25, 27], [26, 28], // Legs
];

// Landmark indices
const LANDMARKS = {
    LEFT_SHOULDER: 11,
    RIGHT_SHOULDER: 12,
    LEFT_ELBOW: 13,
    RIGHT_ELBOW: 14,
    LEFT_WRIST: 15,
    RIGHT_WRIST: 16,
    LEFT_HIP: 23,
    RIGHT_HIP: 24,
    LEFT_KNEE: 25,
    RIGHT_KNEE: 26,
} as const;

// Detection thresholds - relaxed for better usability
const THRESHOLDS = {
    ELBOW_UP: 145,      // Adjusted from 155 to allow slight bends
    ELBOW_DOWN: 110,    // Adjusted from 95 to allow not going all the way down
    MIN_VISIBILITY: 0.5, // Lowered from 0.6 for better low-light support
    BODY_ANGLE_MIN: 150,
    BODY_ANGLE_MAX: 200,
    COOLDOWN_MS: 500,    // Increased cooldown to prevent double counting
};

type Landmark = { x: number; y: number; visibility: number };

/** Calculate angle between three points (in degrees) */
function calculateAngle(a: Landmark, b: Landmark, c: Landmark): number {
    const radians =
        Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
    let angle = Math.abs((radians * 180.0) / Math.PI);
    if (angle > 180.0) angle = 360 - angle;
    return angle;
}

/** Check if landmark is visible enough */
function isVisible(lm: Landmark | undefined): lm is Landmark {
    return !!lm && lm.visibility > THRESHOLDS.MIN_VISIBILITY;
}

/** Draw skeleton connections on canvas */
function drawSkeleton(
    ctx: CanvasRenderingContext2D,
    landmarks: Landmark[],
    width: number,
    height: number,
    state: PushupState
) {
    if (!landmarks) return;

    // Color based on state
    const lineColor = state === "DOWN" ? "#22c55e" : state === "UP" ? "#3b82f6" : "#6b7280";

    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 4;
    for (const [startIdx, endIdx] of POSE_CONNECTIONS) {
        const start = landmarks[startIdx];
        const end = landmarks[endIdx];
        if (isVisible(start) && isVisible(end)) {
            ctx.beginPath();
            ctx.moveTo(start.x * width, start.y * height);
            ctx.lineTo(end.x * width, end.y * height);
            ctx.stroke();
        }
    }

    // Draw key landmarks (shoulders, elbows, wrists)
    const keyLandmarks = [11, 12, 13, 14, 15, 16, 23, 24];
    ctx.fillStyle = state === "DOWN" ? "#22c55e" : state === "UP" ? "#3b82f6" : "#f59e0b";
    for (const idx of keyLandmarks) {
        const lm = landmarks[idx];
        if (isVisible(lm)) {
            ctx.beginPath();
            ctx.arc(lm.x * width, lm.y * height, 8, 0, 2 * Math.PI);
            ctx.fill();
        }
    }
}

/**
 * AI Push-up Counter with improved accuracy.
 * Uses multiple validation checks to prevent false counts.
 */
export function PushupDetector({ onFinish, onClose }: PushupDetectorProps) {
    const webcamRef = useRef<Webcam>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const poseRef = useRef<any>(null);
    const cameraRef = useRef<any>(null);
    const checkWebcamIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const [count, setCount] = useState(0);
    const [state, setState] = useState<PushupState>("INVALID");
    const [feedback, setFeedback] = useState("Get in push-up position");
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [debugInfo, setDebugInfo] = useState("");

    // Track state for counting logic
    const prevStateRef = useRef<PushupState>("INVALID");
    const lastCountTimeRef = useRef<number>(0);
    const consecutiveDownRef = useRef<number>(0);
    const consecutiveUpRef = useRef<number>(0);

    const processResults = useCallback(
        (results: { poseLandmarks?: Landmark[] }) => {
            const canvas = canvasRef.current;
            if (!canvas) return;

            const ctx = canvas.getContext("2d");
            if (!ctx) return;

            const width = canvas.width;
            const height = canvas.height;
            ctx.clearRect(0, 0, width, height);

            if (!results.poseLandmarks) {
                setFeedback("📷 No pose detected");
                setState("INVALID");
                setDebugInfo("");
                return;
            }

            const lm = results.poseLandmarks;

            // Get key landmarks
            const leftShoulder = lm[LANDMARKS.LEFT_SHOULDER];
            const rightShoulder = lm[LANDMARKS.RIGHT_SHOULDER];
            const leftElbow = lm[LANDMARKS.LEFT_ELBOW];
            const rightElbow = lm[LANDMARKS.RIGHT_ELBOW];
            const leftWrist = lm[LANDMARKS.LEFT_WRIST];
            const rightWrist = lm[LANDMARKS.RIGHT_WRIST];
            const leftHip = lm[LANDMARKS.LEFT_HIP];
            const rightHip = lm[LANDMARKS.RIGHT_HIP];

            // Calculate elbow angles for both arms
            let leftElbowAngle = 0;
            let rightElbowAngle = 0;
            let validArms = 0;

            if (isVisible(leftShoulder) && isVisible(leftElbow) && isVisible(leftWrist)) {
                leftElbowAngle = calculateAngle(leftShoulder, leftElbow, leftWrist);
                validArms++;
            }
            if (isVisible(rightShoulder) && isVisible(rightElbow) && isVisible(rightWrist)) {
                rightElbowAngle = calculateAngle(rightShoulder, rightElbow, rightWrist);
                validArms++;
            }

            // Need at least one arm visible
            if (validArms === 0) {
                drawSkeleton(ctx, lm, width, height, "INVALID");
                setFeedback("👋 Show your arms to camera");
                setState("INVALID");
                setDebugInfo("");
                return;
            }

            // Use average of visible arms, or single arm if only one visible
            const elbowAngle = validArms === 2
                ? (leftElbowAngle + rightElbowAngle) / 2
                : (leftElbowAngle || rightElbowAngle);

            // Check body alignment (Disabled for robustness against different camera angles)
            /* 
            let isValidBodyPosition = true;
            if (isVisible(leftShoulder) && isVisible(leftHip) && isVisible(rightShoulder) && isVisible(rightHip)) {
                const shoulderMidY = (leftShoulder.y + rightShoulder.y) / 2;
                const hipMidY = (leftHip.y + rightHip.y) / 2;
                const verticalDiff = Math.abs(shoulderMidY - hipMidY);
                isValidBodyPosition = verticalDiff < 0.3; 
            }
            */

            // Determine state with hysteresis
            let newState: PushupState = "TRANSITION";
            let newFeedback = "";

            // Simplified state logic (trust elbow angle primarily)
            if (elbowAngle > THRESHOLDS.ELBOW_UP) {
                consecutiveUpRef.current++;
                consecutiveDownRef.current = 0;
                if (consecutiveUpRef.current >= 2) {
                    newState = "UP";
                    newFeedback = "⬇️ GO DOWN";
                }
            } else if (elbowAngle < THRESHOLDS.ELBOW_DOWN) {
                consecutiveDownRef.current++;
                consecutiveUpRef.current = 0;
                if (consecutiveDownRef.current >= 2) {
                    newState = "DOWN";
                    newFeedback = "⬆️ PUSH UP!";
                }
            } else {
                consecutiveUpRef.current = 0;
                consecutiveDownRef.current = 0;
                if (prevStateRef.current === "UP") {
                    newFeedback = "Go lower...";
                } else if (prevStateRef.current === "DOWN") {
                    newFeedback = "Push up fully...";
                } else {
                    newFeedback = "Adjust position...";
                }
            }

            // Count logic: DOWN -> UP transition = 1 rep (with cooldown)
            const now = Date.now();
            if (
                prevStateRef.current === "DOWN" &&
                newState === "UP" &&
                now - lastCountTimeRef.current > THRESHOLDS.COOLDOWN_MS
            ) {
                setCount((c) => c + 1);
                newFeedback = "🎉 GOOD REP!";
                lastCountTimeRef.current = now;
            }

            // Draw skeleton with state color
            drawSkeleton(ctx, lm, width, height, newState);

            // Update state
            if (newState !== "TRANSITION") {
                prevStateRef.current = newState;
            }
            setState(newState);
            setFeedback(newFeedback || "Hold position...");
            setDebugInfo(Math.round(elbowAngle).toString());
        },
        []
    );

    const cleanup = useCallback(() => {
        try {
            if (webcamRef.current?.video?.srcObject) {
                const stream = webcamRef.current.video.srcObject as MediaStream;
                stream.getTracks().forEach((track) => track.stop());
            }
        } catch (e) {
            console.warn("Error stopping video tracks", e);
        }

        try {
            if (cameraRef.current) {
                cameraRef.current.stop();
                cameraRef.current = null;
            }
        } catch (e) {
            console.warn("Error stopping camera", e);
        }

        try {
            if (poseRef.current) {
                poseRef.current.close();
                poseRef.current = null;
            }
        } catch (e) {
            console.warn("Error closing pose", e);
        }
    }, []);

    useEffect(() => {
        let mounted = true;

        const loadScripts = async () => {
            if ((window as any).Pose) return true;

            const loadScript = (src: string): Promise<void> =>
                new Promise((resolve, reject) => {
                    const script = document.createElement("script");
                    script.src = src;
                    script.async = true;
                    script.crossOrigin = "anonymous";
                    script.onload = () => resolve();
                    script.onerror = () => reject(new Error(`Failed to load ${src}`));
                    document.head.appendChild(script);

                    // Timeout after 15 seconds
                    setTimeout(() => reject(new Error("Script load timeout")), 15000);
                });

            await loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js");
            await loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js");

            return true;
        };

        const initPose = async () => {
            try {
                await loadScripts();
                if (!mounted) return;

                const PoseClass = (window as any).Pose;
                const CameraClass = (window as any).Camera;

                if (!PoseClass || !CameraClass) {
                    throw new Error("MediaPipe not loaded");
                }

                const pose = new PoseClass({
                    locateFile: (file: string) =>
                        `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
                });

                pose.setOptions({
                    modelComplexity: 1,
                    smoothLandmarks: true,
                    enableSegmentation: false,
                    minDetectionConfidence: 0.6,
                    minTrackingConfidence: 0.6,
                });

                pose.onResults((results: any) => {
                    if (mounted) processResults(results);
                });

                await pose.initialize();
                if (!mounted) return;

                poseRef.current = pose;

                checkWebcamIntervalRef.current = setInterval(() => {
                    if (webcamRef.current?.video?.readyState === 4) {
                        if (checkWebcamIntervalRef.current) {
                            clearInterval(checkWebcamIntervalRef.current);
                            checkWebcamIntervalRef.current = null;
                        }
                        const video = webcamRef.current.video;
                        if (!video || !mounted) return;

                        if (canvasRef.current) {
                            canvasRef.current.width = video.videoWidth;
                            canvasRef.current.height = video.videoHeight;
                        }

                        const camera = new CameraClass(video, {
                            onFrame: async () => {
                                if (poseRef.current && webcamRef.current?.video) {
                                    await poseRef.current.send({ image: webcamRef.current.video });
                                }
                            },
                            width: video.videoWidth,
                            height: video.videoHeight,
                        });

                        camera.start();
                        cameraRef.current = camera;
                        setIsLoading(false);
                    }
                }, 100);
            } catch (err) {
                if (mounted) {
                    setError(err instanceof Error ? err.message : "Failed to initialize");
                    setIsLoading(false);
                }
            }
        };

        initPose();

        return () => {
            mounted = false;
            if (checkWebcamIntervalRef.current) {
                clearInterval(checkWebcamIntervalRef.current);
                checkWebcamIntervalRef.current = null;
            }
            cleanup();
        };
    }, [processResults, cleanup]);


    const handleFinish = () => {
        cleanup();
        onFinish(count);
    };

    const handleCancel = () => {
        cleanup();
        onClose();
    };

    const handleReset = () => {
        setCount(0);
        prevStateRef.current = "INVALID";
        lastCountTimeRef.current = 0;
    };

    if (error) {
        return (
            <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/95 p-6">
                <div className="max-w-sm text-center">
                    <div className="mb-4 text-6xl">📷</div>
                    <h2 className="mb-2 text-xl font-bold text-white">Camera Error</h2>
                    <p className="mb-6 text-gray-400">{error}</p>
                    <Button onClick={handleCancel} variant="outline" className="min-w-32">
                        Close
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex flex-col bg-black">
            {/* Header: Cancel + Counter + Reset */}
            <div className="absolute inset-x-0 top-0 z-10 flex items-start justify-between p-4">
                <Button
                    onClick={handleCancel}
                    variant="ghost"
                    size="icon"
                    className="size-12 rounded-full bg-black/50 text-white hover:bg-red-500/80"
                    aria-label="Cancel"
                >
                    <X className="size-6" />
                </Button>

                <div className="flex flex-col items-center gap-2">
                    <div className="rounded-2xl bg-black/70 px-8 py-4 backdrop-blur-sm shadow-xl border border-white/10">
                        <div className="text-center text-6xl font-bold tabular-nums text-white">
                            {count}
                        </div>
                        <div className="text-center text-sm font-medium uppercase tracking-wider text-gray-400">
                            Push-ups
                        </div>
                    </div>

                    {/* Enhanced Debug UI: Angle Meter */}
                    {debugInfo && (
                        <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
                            <div className={cn(
                                "flex items-center justify-center rounded-xl px-4 py-2 backdrop-blur-md border-2 shadow-lg transition-colors duration-300",
                                Number(debugInfo) > THRESHOLDS.ELBOW_UP ? "bg-blue-500/20 border-blue-500/50 text-blue-200" :
                                    Number(debugInfo) < THRESHOLDS.ELBOW_DOWN ? "bg-green-500/20 border-green-500/50 text-green-200" :
                                        "bg-red-500/20 border-red-500/50 text-red-200"
                            )}>
                                <span className="text-2xl font-bold tabular-nums">{debugInfo}°</span>
                            </div>
                            <span className="text-[10px] text-white/50 font-medium uppercase tracking-wider mt-1 bg-black/40 px-2 py-0.5 rounded-full">
                                Elbow Angle
                            </span>
                        </div>
                    )}
                </div>

                <Button
                    onClick={handleReset}
                    variant="ghost"
                    size="icon"
                    className="size-12 rounded-full bg-black/50 text-white hover:bg-yellow-500/80"
                    aria-label="Reset"
                >
                    <RotateCcw className="size-5" />
                </Button>
            </div>

            {/* Feedback message */}
            <div className="absolute inset-x-0 top-1/2 z-10 -translate-y-1/2 text-center pointer-events-none">
                <div
                    className={`inline-block rounded-xl px-6 py-3 text-xl sm:text-2xl font-bold backdrop-blur-sm transition-colors ${state === "UP"
                        ? "bg-blue-500/80 text-white"
                        : state === "DOWN"
                            ? "bg-green-500/80 text-white"
                            : state === "INVALID"
                                ? "bg-yellow-500/80 text-white"
                                : "bg-black/60 text-gray-200"
                        }`}
                >
                    {feedback}
                </div>
            </div>

            {/* Video and canvas */}
            <div className="relative h-full w-full">
                <Webcam
                    ref={webcamRef}
                    audio={false}
                    mirrored
                    videoConstraints={{
                        facingMode: "user",
                        width: { ideal: 1280 },
                        height: { ideal: 720 },
                    }}
                    onUserMediaError={(err) => {
                        setError(
                            err instanceof Error
                                ? err.message
                                : "Camera access denied. Please enable camera permissions."
                        );
                    }}
                    className="absolute inset-0 h-full w-full object-cover"
                />
                <canvas
                    ref={canvasRef}
                    className="absolute inset-0 h-full w-full object-cover"
                    style={{ transform: "scaleX(-1)" }}
                />

                {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                        <div className="text-center">
                            <div className="mb-4 mx-auto h-12 w-12 animate-spin rounded-full border-4 border-white/20 border-t-white" />
                            <p className="text-white">Loading AI model...</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer: Finish button */}
            <div className="absolute inset-x-4 bottom-8 z-10 flex gap-3">
                <Button
                    onClick={handleFinish}
                    disabled={count === 0}
                    className="h-14 flex-1 gap-2 rounded-2xl bg-green-500 text-lg font-semibold text-white hover:bg-green-600 disabled:bg-gray-600 disabled:opacity-50"
                >
                    <Check className="size-5" />
                    Save {count > 0 ? `(${count} reps)` : ""}
                </Button>
            </div>

            {/* Instructions overlay for first time */}
            {count === 0 && state === "INVALID" && !isLoading && (
                <div className="absolute inset-x-4 bottom-28 z-10 text-center">
                    <div className="inline-block rounded-xl bg-black/70 px-4 py-3 text-sm text-gray-300 backdrop-blur-sm">
                        <p>📍 Position yourself so camera can see your full upper body</p>
                        <p className="mt-1 font-bold text-yellow-400">Ensure good lighting!</p>
                        <p className="mt-1 text-gray-500">Get in push-up position to start counting</p>
                    </div>
                </div>
            )}
        </div>
    );
}
