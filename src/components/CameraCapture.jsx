import React, { useRef, useState, useEffect } from "react";
import { classifyFragment } from "../ai/classifier";
import { getMiDaSDepthEstimator } from "../ai/midasDepthEstimator";
import { Button, StatusPill } from "./ui";

export default function CameraCapture({ onResult, modelsReady }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  const [stream, setStream] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState("Ready");
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

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

  const startCamera = async () => {
    if (!modelsReady) {
      setError("Models still loading...");
      return;
    }
    if (!videoRef.current) return;

    setError(null);
    setStatus("Requesting camera...");

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

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
      let msg = err.message;
      if (err.name === "NotAllowedError") msg = "Camera permission denied";
      if (err.name === "NotFoundError")    msg = "No camera available";
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
    <div className="flex flex-col h-full space-y-3 relative">
      {/* Preview */}
      <div className="relative flex-1 bg-black rounded-xl overflow-hidden aspect-video lg:aspect-[4/3] max-h-[65vh] lg:max-h-none mx-auto w-full">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover transform scale-x-[-1]"
          style={{ display: stream ? "block" : "none" }}
        />

        {!stream && !error && (
          <div className="absolute inset-0 flex items-center justify-center text-zinc-400 text-center p-4">
            Camera off — click "Start Camera"
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-black/80">
            <div className="text-red-500 font-semibold">Camera Error</div>
            <div className="mt-2 text-sm text-zinc-300">{error}</div>
          </div>
        )}

        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-3 justify-center">
        {!stream ? (
          <Button
            onClick={startCamera}
            disabled={!modelsReady || processing}
            className="min-w-[160px]"
          >
            Start Camera
          </Button>
        ) : (
          <>
            <Button
              onClick={captureFromCamera}
              disabled={processing || isMobile}
              variant="secondary"
              className="min-w-[160px]"
            >
              {processing ? "Processing…" : "Capture"}
            </Button>

            <Button
              onClick={stopCamera}
              variant="destructive"
              className="min-w-[140px]"
            >
              Stop
            </Button>
          </>
        )}

        <Button
          onClick={() => fileInputRef.current?.click()}
          disabled={processing}
          variant="outline"
        >
          Upload
        </Button>

        <input
          type="file"
          ref={fileInputRef}
          accept="image/jpeg,image/png"
          onChange={captureFromFile}
          className="hidden"
        />
      </div>

      {/* Status line */}
      <div className="text-center text-sm text-zinc-500 py-2 px-3 bg-zinc-100 rounded-lg">
        <StatusPill status={status} />
      </div>

      {/* Floating capture button on mobile when camera is live */}
      {isMobile && stream && !processing && (
        <button
          onClick={captureFromCamera}
          className="absolute bottom-6 left-1/2 transform -translate-x-1/2 w-16 h-16 rounded-full bg-white/90 border-4 border-white shadow-lg z-10"
        >
          <div className="w-full h-full rounded-full bg-red-600" />
        </button>
      )}
    </div>
  );
}