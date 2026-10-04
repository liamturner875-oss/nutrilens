import React, { useRef, useState, useEffect } from "react";
import { Camera, Upload, X, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ScannerDropzone({ onPhoto, analyzing, hint = "Point at your plate", analyzingText = "Analyzing your plate…" }) {
  const fileRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [mode, setMode] = useState("idle"); // idle | camera
  const [camError, setCamError] = useState("");
  const [preview, setPreview] = useState(null);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
  };

  useEffect(() => () => stopCamera(), []);

  const startCamera = async () => {
    setCamError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      streamRef.current = stream;
      setMode("camera");
      // wait for next tick to attach
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      }, 50);
    } catch (e) {
      setCamError("Camera unavailable — upload a photo instead.");
      setMode("idle");
    }
  };

  const capture = () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 1080;
    canvas.height = video.videoHeight || 1080;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], `capture-${Date.now()}.jpg`, { type: "image/jpeg" });
      setPreview(URL.createObjectURL(file));
      onPhoto(file);
      stopCamera();
      setMode("idle");
    }, "image/jpeg", 0.92);
  };

  const onFile = (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // so the same photo file can be picked again for the next meal
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    onPhoto(file);
  };

  const reset = () => {
    setPreview(null);
    setMode("idle");
  };

  return (
    <div className="relative w-full">
      {/* HUD camera / preview stage */}
      <div className="relative aspect-[4/3] sm:aspect-square w-full overflow-hidden rounded-[24px] bg-slate-900 border border-[#E2E8F0] shadow-sm">
        {mode === "camera" ? (
          <>
            <video ref={videoRef} playsInline muted className="absolute inset-0 w-full h-full object-cover" />
            <HUDGrid />
            <div className="absolute top-4 left-1/2 -translate-x-1/2 glass-dark text-white text-xs font-semibold px-3 py-1.5 rounded-full">
              {hint}
            </div>
            {analyzing && <ScanSweep />}
          </>
        ) : preview ? (
          <>
            <img src={preview} alt="capture" className="absolute inset-0 w-full h-full object-cover" />
            {analyzing && (
              <div className="absolute inset-0 glass flex flex-col items-center justify-center gap-3">
                <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin" />
                <p className="text-sm font-semibold text-[#0F172A]">{analyzingText}</p>
              </div>
            )}
          </>
        ) : (
          <button
            onClick={startCamera}
            className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white/90 hover:bg-slate-800/40 transition"
          >
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center">
              <Camera className="w-7 h-7 text-emerald-300" />
            </div>
            <span className="text-sm font-semibold">Tap to open camera</span>
            <span className="text-xs text-white/60">or use upload below</span>
          </button>
        )}
      </div>

      {camError && <p className="mt-2 text-xs text-rose-500">{camError}</p>}

      {/* Controls */}
      <div className="mt-4 flex items-center justify-center gap-4">
        {mode === "camera" ? (
          <>
            <button
              onClick={capture}
              disabled={analyzing}
              className="relative w-18 h-18 rounded-full bg-white border-4 border-emerald-500 shadow-lg flex items-center justify-center animate-pulse-ring disabled:opacity-50"
              style={{ width: 72, height: 72 }}
              aria-label="Capture"
            >
              <span className="w-12 h-12 rounded-full bg-emerald-500" />
            </button>
            <button
              onClick={() => { stopCamera(); setMode("idle"); }}
              className="w-11 h-11 rounded-full bg-white border border-[#E2E8F0] flex items-center justify-center text-slate-500"
              aria-label="Close camera"
            >
              <X className="w-5 h-5" />
            </button>
          </>
        ) : (
          <>
            <button
              onClick={startCamera}
              disabled={analyzing}
              className="flex items-center gap-2 px-5 h-12 rounded-full bg-[#0F172A] text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50"
            >
              <Camera className="w-4 h-4" /> Camera
            </button>
            <button
              onClick={() => fileRef.current?.click()}
              disabled={analyzing}
              className="flex items-center gap-2 px-5 h-12 rounded-full bg-white border border-[#E2E8F0] text-[#0F172A] text-sm font-semibold hover:bg-slate-50 disabled:opacity-50"
            >
              <Upload className="w-4 h-4" /> Upload
            </button>
            {preview && (
              <button
                onClick={reset}
                disabled={analyzing}
                className="w-11 h-11 rounded-full bg-white border border-[#E2E8F0] flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-50"
                aria-label="Clear"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </>
        )}
        <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={onFile} />
      </div>
    </div>
  );
}

function HUDGrid() {
  return (
    <div className="pointer-events-none absolute inset-0">
      <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="border border-emerald-400/20" />
        ))}
      </div>
      {/* corner brackets */}
      <div className="absolute top-6 left-6 w-8 h-8 border-l-2 border-t-2 border-emerald-400 rounded-tl-lg" />
      <div className="absolute top-6 right-6 w-8 h-8 border-r-2 border-t-2 border-emerald-400 rounded-tr-lg" />
      <div className="absolute bottom-6 left-6 w-8 h-8 border-l-2 border-b-2 border-emerald-400 rounded-bl-lg" />
      <div className="absolute bottom-6 right-6 w-8 h-8 border-r-2 border-b-2 border-emerald-400 rounded-br-lg" />
    </div>
  );
}

function ScanSweep() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute left-0 right-0 h-1 bg-emerald-400/80 shadow-[0_0_20px_4px_rgba(16,185,129,0.6)] animate-scan-sweep" />
    </div>
  );
}
