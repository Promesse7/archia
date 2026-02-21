import React, { useRef, useState, useEffect } from "react";
import { classifyFragment } from "../ai/classifier";
import { getMiDaSDepthEstimator } from "../ai/midasDepthEstimator";
import { Button, StatusPill } from "./ui";

export default function CameraCapture({
  onResult,
  modelsReady,
  cameraStatus,
  capturedFragment,
  onRetake,
  onAddToSession
}) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  const [stream, setStream] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState("Ready");
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [aiStatus, setAiStatus] = useState("INITIALIZING...");

  // Interactive processing states
  const [processingStage, setProcessingStage] = useState("ANALYZING");
  const [processingProgress, setProcessingProgress] = useState(0);
  const [interactiveMode, setInteractiveMode] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const [processingComplete, setProcessingComplete] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }
    };
  }, [stream]);

  useEffect(() => {
    // Update AI status based on camera state
    if (!modelsReady) {
      setAiStatus("INITIALIZING...");
    } else if (!stream) {
      setAiStatus("CAMERA OFFLINE");
    } else if (processing) {
      setAiStatus("ANALYZING SURFACE GEOMETRY");
    } else {
      setAiStatus("SCANNING FOR ARTIFACTS");
    }
  }, [modelsReady, stream, processing]);

  const startCamera = async () => {
    if (!modelsReady) {
      setError("Models still loading...");
      return;
    }
    if (!videoRef.current) return;

    setError(null);
    setStatus("Requesting camera...");

    try {
      // Try different camera configurations
      let mediaStream;

      // First try: Environment camera (back camera on mobile)
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "environment",
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        });
      } catch (envErr) {
        console.log("Environment camera failed, trying user camera:", envErr);

        // Second try: User camera (front camera on mobile)
        try {
          mediaStream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: "user",
              width: { ideal: 1280 },
              height: { ideal: 720 }
            }
          });
        } catch (userErr) {
          console.log("User camera failed, trying basic constraints:", userErr);

          // Third try: Basic constraints
          mediaStream = await navigator.mediaDevices.getUserMedia({
            video: true
          });
        }
      }

      videoRef.current.srcObject = mediaStream;
      setStream(mediaStream);

      await new Promise((resolve, reject) => {
        const vid = videoRef.current;
        if (!vid) return reject(new Error("Video ref lost"));

        const onMeta = () => {
          vid.removeEventListener("loadedmetadata", onMeta);
          resolve();
        };
        const onErr = e => {
          vid.removeEventListener("error", onErr);
          reject(e);
        };

        vid.addEventListener("loadedmetadata", onMeta, { once: true });
        vid.addEventListener("error", onErr, { once: true });

        setTimeout(() => reject(new Error("Metadata timeout")), 12000);
      });

      await videoRef.current.play();
      setStatus("Camera active");
    } catch (err) {
      console.error("Camera initialization failed:", err);
      let msg = err.message;
      if (err.name === "NotAllowedError") msg = "Camera permission denied - please allow camera access";
      if (err.name === "NotFoundError") msg = "No camera available - please connect a camera";
      if (err.name === "NotReadableError") msg = "Camera is already in use by another application";
      if (err.name === "OverconstrainedError") msg = "Camera constraints not supported";
      setError(msg);
      setStatus("Camera error");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
      if (videoRef.current) videoRef.current.srcObject = null;
      setStream(null);
      setStatus("Camera stopped");
    }
  };

  const capture = async (source) => {  // source = video or img element
    if (processing || !modelsReady) return;

    setProcessing(true);
    setError(null);
    setStatus("Processing...");

    try {
      const canvas = canvasRef.current;
      canvas.width = source.videoWidth || source.naturalWidth || source.width;
      canvas.height = source.videoHeight || source.naturalHeight || source.height;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(source, 0, 0, canvas.width, canvas.height);

      const img = new Image();
      img.src = canvas.toDataURL("image/jpeg", 0.92);
      await new Promise(r => { img.onload = r; });

      const depthEstimator = await getMiDaSDepthEstimator();
      const depthTensor = await depthEstimator.estimateDepth(img);

      const classification = await classifyFragment(img);

      const pointCloud = depthEstimator.depthAndRgbToPointCloud?.(
        depthTensor,
        img,
        { downsample: isMobile ? 3 : 2, filterNoise: true }
      ) || [];

      const data = {
        image: img.src,
        classification,
        depthMap: await depthTensor.array(),
        pointCloud,
        width: canvas.width,
        height: canvas.height,
        timestamp: Date.now()
      };

      onResult(data);
      setStatus(`Done — ${pointCloud.length.toLocaleString()} points`);

      depthTensor.dispose();
    } catch (err) {
      console.error(err);
      setError(err.message || "Processing failed");
      onResult({ error: err.message, timestamp: Date.now() });
    } finally {
      setProcessing(false);
    }
  };

  const captureFromCamera = () => {
    if (!videoRef.current || !videoRef.current.videoWidth) {
      setError("Camera not ready");
      return;
    }
    capture(videoRef.current);
  };

  const captureFromFile = e => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = ev => {
      const img = new Image();
      img.src = ev.target.result;
      img.onload = () => capture(img);
      img.onerror = () => setError("Cannot load image");
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black">
      {/* Fullscreen Video Background */}
      <div className="absolute inset-0">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover transform scale-x-[-1] ${stream ? "block" : "hidden"}`}
        />

        {/* Captured Fragment Display */}
        {capturedFragment && (
          <div className="relative w-full h-full">
            {/* Fragment Image */}
            <img
              src={capturedFragment.image}
              alt="Captured fragment"
              className="w-full h-full object-cover"
            />

            {/* Fragment Analysis Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent">
              {/* Top Analysis Bar */}
              <div className="absolute top-0 left-0 right-0 p-6">
                <div className="flex items-start justify-between">
                  {/* Classification Badge */}
                  <div className="bg-stone-900/90 backdrop-blur-md border border-amber-500/30 rounded-lg px-4 py-2">
                    <div className="text-xs text-amber-400 font-medium tracking-wider mb-1">FRAGMENT TYPE</div>
                    <div className="text-lg font-bold text-white capitalize">
                      {capturedFragment.classification?.fragmentType || 'Unknown'}
                    </div>
                    <div className="text-xs text-stone-400 mt-1">
                      {Math.round((capturedFragment.classification?.confidence || 0) * 100)}% confidence
                    </div>
                  </div>

                  {/* Processing Stats */}
                  <div className="bg-stone-900/90 backdrop-blur-md border border-stone-700/30 rounded-lg px-4 py-2 text-right">
                    <div className="text-xs text-stone-400 font-medium tracking-wider mb-1">ANALYSIS RESULTS</div>
                    <div className="text-sm text-white">
                      {capturedFragment.pointCloud?.length?.toLocaleString() || '0'} points
                    </div>
                    <div className="text-xs text-stone-400 mt-1">
                      {capturedFragment.processingTime ? `${(capturedFragment.processingTime / 1000).toFixed(1)}s` : ''}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Details */}
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <div className="grid grid-cols-3 gap-4 mb-4">
                  {/* Material Analysis */}
                  <div className="bg-stone-900/90 backdrop-blur-md border border-stone-700/30 rounded-lg p-3">
                    <div className="text-xs text-stone-400 font-medium tracking-wider mb-1">MATERIAL</div>
                    <div className="text-sm text-white">Ceramic</div>
                    <div className="text-xs text-amber-400">Ancient pottery</div>
                  </div>

                  {/* Dimensions */}
                  <div className="bg-stone-900/90 backdrop-blur-md border border-stone-700/30 rounded-lg p-3">
                    <div className="text-xs text-stone-400 font-medium tracking-wider mb-1">ESTIMATED SIZE</div>
                    <div className="text-sm text-white">
                      {capturedFragment.width && capturedFragment.height
                        ? `${capturedFragment.width}×${capturedFragment.height}px`
                        : 'Unknown'
                      }
                    </div>
                    <div className="text-xs text-amber-400">Fragment dimensions</div>
                  </div>

                  {/* Timestamp */}
                  <div className="bg-stone-900/90 backdrop-blur-md border border-stone-700/30 rounded-lg p-3">
                    <div className="text-xs text-stone-400 font-medium tracking-wider mb-1">CAPTURED</div>
                    <div className="text-sm text-white">
                      {new Date(capturedFragment.timestamp || Date.now()).toLocaleTimeString()}
                    </div>
                    <div className="text-xs text-amber-400">Ready for analysis</div>
                  </div>
                </div>

                {/* Success Indicator */}
                <div className="flex items-center justify-center">
                  <div className="bg-green-500/20 border border-green-500/30 rounded-full px-4 py-2 flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-green-400 text-sm font-medium">Fragment processed successfully</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* HUD Overlay Effects */}
      <div className="pointer-events-none absolute inset-0">
        {/* Subtle scan lines */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:100%_4px]" />

        {/* Radial focus glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(217,119,6,0.08),transparent_70%)]" />
      </div>

      {/* Capture Frame Guide */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="relative w-72 h-72 md:w-96 md:h-96">
          {/* Main frame */}
          <div className="absolute inset-0 border border-amber-500/30 rounded-2xl" />

          {/* Corner accents */}
          <div className="absolute top-0 left-0 w-10 h-10 border-t border-l border-amber-500" />
          <div className="absolute top-0 right-0 w-10 h-10 border-t border-r border-amber-500" />
          <div className="absolute bottom-0 left-0 w-10 h-10 border-b border-l border-amber-500" />
          <div className="absolute bottom-0 right-0 w-10 h-10 border-b border-r border-amber-500" />
        </div>
      </div>

      {/* Live AI Feedback */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 pointer-events-none">
        <div className="px-6 py-3 bg-stone-900/80 border border-amber-500/20 rounded-2xl text-center shadow-xl">
          <div className="text-xs text-amber-400 font-medium tracking-wider mb-1">AI VISUAL INTELLIGENCE</div>
          <div className="text-sm text-white font-semibold">{aiStatus}</div>

          {/* AI Capabilities Indicators */}
          <div className="flex items-center justify-center gap-4 mt-2">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-green-400">Depth Estimation</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-blue-400">Fragment Classification</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-purple-400">3D Reconstruction</span>
            </div>
          </div>
        </div>
      </div>

      {/* AI Capabilities Showcase - Only when camera is active and no fragment captured */}
      {stream && !capturedFragment && (
        <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none">
          <div className="bg-stone-900/80 border border-amber-500/20 rounded-2xl p-4 shadow-xl backdrop-blur-sm max-w-xs">
            <div className="text-xs text-amber-400 font-medium tracking-wider mb-3">AI CAPABILITIES</div>

            <div className="space-y-3">
              {/* Depth Estimation */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <div className="text-xs text-green-400 font-medium">Depth Estimation</div>
                  <div className="text-xs text-stone-400">MiDaS-inspired 3D depth mapping</div>
                </div>
              </div>

              {/* Fragment Classification */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <div className="text-xs text-blue-400 font-medium">Fragment Classification</div>
                  <div className="text-xs text-stone-400">CNN-based pottery fragment analysis</div>
                </div>
              </div>

              {/* 3D Reconstruction */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
                  </svg>
                </div>
                <div>
                  <div className="text-xs text-purple-400 font-medium">3D Reconstruction</div>
                  <div className="text-xs text-stone-400">Point cloud generation & surface modeling</div>
                </div>
              </div>
            </div>

            {/* Processing Power */}
            <div className="mt-4 pt-3 border-t border-stone-700">
              <div className="flex items-center justify-between">
                <div className="text-xs text-stone-400">Processing Power</div>
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 bg-amber-500 rounded-full"></div>
                  <div className="w-1.5 h-1.5 bg-amber-500 rounded-full"></div>
                  <div className="w-1.5 h-1.5 bg-amber-500 rounded-full"></div>
                  <div className="w-1.5 h-1.5 bg-amber-500 rounded-full"></div>
                  <div className="w-1.5 h-1.5 bg-stone-600 rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error State Overlay */}
      {error && !capturedFragment && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-black/80">
          <div className="text-red-500 font-semibold text-lg mb-2">Camera Error</div>
          <div className="text-sm text-stone-300 mb-6">{error}</div>
          <button
            onClick={startCamera}
            className="px-6 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Initial State - Camera Off */}
      {!stream && !error && !capturedFragment && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <div className="text-stone-400 text-lg mb-8">Camera Offline</div>
          <button
            onClick={startCamera}
            disabled={!modelsReady}
            className="px-8 py-3 bg-amber-500 hover:bg-amber-600 disabled:bg-stone-700 disabled:text-stone-500 text-white rounded-full transition-all duration-200 hover:scale-105 active:scale-95"
          >
            {modelsReady ? "Start Camera" : "Initializing..."}
          </button>
        </div>
      )}

      {/* Floating Bottom Controls */}
      {!capturedFragment ? (
        <div className="absolute bottom-[14vh] left-0 right-0 flex justify-center">
          <div className="flex items-center gap-8 bg-stone-900/70 backdrop-blur-xl px-8 py-4 rounded-full border border-stone-700 shadow-2xl">
            {/* Gallery Button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-10 h-10 flex items-center justify-center text-stone-300 hover:text-white transition-colors"
              disabled={processing}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </button>

            {/* Capture Button */}
            {stream && (
              <button
                onClick={captureFromCamera}
                disabled={processing || isMobile}
                className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
              >
                <div className="w-full h-full rounded-full bg-white/20" />
              </button>
            )}

            {/* Flash/AI Toggle */}
            <button className="w-10 h-10 flex items-center justify-center text-stone-300 hover:text-white transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </button>
          </div>
        </div>
      ) : (
        /* Captured Fragment Controls */
        <div className="absolute bottom-[14vh] left-0 right-0 flex justify-center">
          <div className="flex items-center gap-4 bg-stone-900/70 backdrop-blur-xl px-8 py-4 rounded-full border border-stone-700 shadow-2xl">
            <button
              onClick={onRetake}
              className="px-6 py-2 bg-stone-700 hover:bg-stone-600 text-stone-300 rounded-full transition-colors"
            >
              Retake
            </button>
            <button
              onClick={onAddToSession}
              className="px-6 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-full transition-colors"
            >
              Add to Session
            </button>
          </div>
        </div>
      )}

      {/* Hidden canvas and file input */}
      <canvas ref={canvasRef} className="hidden" />
      <input
        type="file"
        ref={fileInputRef}
        accept="image/jpeg,image/png"
        onChange={captureFromFile}
        className="hidden"
      />
    </div>
  );
}
