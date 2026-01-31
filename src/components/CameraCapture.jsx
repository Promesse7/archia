import React, { useRef, useState, useEffect } from "react";
import { classifyFragment } from "../ai/classifier";
import { getMiDaSDepthEstimator } from "../ai/midasDepthEstimator";

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
    <div style={{
      display: "flex",
      flexDirection: "column",
      height: "100%",
      gap: "12px",
      position: "relative"
    }}>
      {/* Preview */}
      <div style={{
        position: "relative",
        flex: 1,
        background: "#000",
        borderRadius: "10px",
        overflow: "hidden",
        aspectRatio: isMobile ? "9/16" : "4/3",
        maxHeight: isMobile ? "65vh" : "none",
        margin: "0 auto",
        width: "100%"
      }}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transform: "scaleX(-1)", // mirror — common for selfie-style UX
            display: stream ? "block" : "none"
          }}
        />

        {!stream && !error && (
          <div style={{
            position: "absolute",
            inset: 0,
            color: "#aaa",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            padding: "1rem"
          }}>
            Camera off — click "Start Camera"
          </div>
        )}

        {error && (
          <div style={{
            position: "absolute",
            inset: 0,
            color: "#ff6b6b",
            background: "rgba(0,0,0,0.7)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "1.5rem",
            textAlign: "center"
          }}>
            <strong>Camera Error</strong>
            <div style={{ marginTop: "8px" }}>{error}</div>
          </div>
        )}

        <canvas ref={canvasRef} style={{ display: "none" }} />
      </div>

      {/* Controls */}
      <div style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "10px",
        justifyContent: "center"
      }}>
        {!stream ? (
          <button
            onClick={startCamera}
            disabled={!modelsReady || processing}
            style={{
              padding: "12px 24px",
              background: modelsReady ? "#2e7d32" : "#555",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "1rem",
              minWidth: "160px"
            }}
          >
            📷 Start Camera
          </button>
        ) : (
          <>
            <button
              onClick={captureFromCamera}
              disabled={processing || isMobile} // mobile uses overlay button
              style={{
                padding: "12px 24px",
                background: processing ? "#666" : "#1976d2",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontSize: "1rem",
                minWidth: "160px"
              }}
            >
              {processing ? "⏳ Processing…" : "📸 Capture"}
            </button>

            <button
              onClick={stopCamera}
              style={{
                padding: "12px 24px",
                background: "#c62828",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontSize: "1rem",
                minWidth: "140px"
              }}
            >
              🛑 Stop
            </button>
          </>
        )}

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={processing}
          style={{
            padding: "12px 20px",
            background: "#424242",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontSize: "1rem"
          }}
        >
          📁 Upload
        </button>

        <input
          type="file"
          ref={fileInputRef}
          accept="image/jpeg,image/png"
          onChange={captureFromFile}
          style={{ display: "none" }}
        />
      </div>

      {/* Status line */}
      <div style={{
        textAlign: "center",
        color: "#bbb",
        fontSize: "0.9rem",
        padding: "6px",
        background: "rgba(0,0,0,0.3)",
        borderRadius: "6px"
      }}>
        {status}
      </div>

      {/* Floating capture button on mobile when camera is live */}
      {isMobile && stream && !processing && (
        <button
          onClick={captureFromCamera}
          style={{
            position: "absolute",
            bottom: "24px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "72px",
            height: "72px",
            borderRadius: "50%",
            background: "rgba(255,255,255,0.9)",
            border: "5px solid #fff",
            boxShadow: "0 6px 20px rgba(0,0,0,0.4)",
            zIndex: 10
          }}
        >
          <div style={{
            width: "100%",
            height: "100%",
            borderRadius: "50%",
            background: "#d32f2f"
          }} />
        </button>
      )}
    </div>
  );
}