import React, { useRef, useState } from "react";
import { Mic, MicOff, Sparkles } from "lucide-react";

export default function DescribeMeal({ onAnalyze, analyzing }) {
  const [text, setText] = useState("");
  const [listening, setListening] = useState(false);
  const recRef = useRef(null);
  const SR = typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition);
  const supported = !!SR;

  const toggleMic = () => {
    if (listening) {
      recRef.current?.stop();
      return;
    }
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = false;
    rec.onresult = (e) => {
      const last = e.results[e.results.length - 1];
      const chunk = last[0].transcript.trim();
      if (chunk) setText((t) => (t ? `${t} ${chunk}` : chunk));
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recRef.current = rec;
    setListening(true);
    rec.start();
  };

  const submit = () => {
    if (!text.trim() || analyzing) return;
    onAnalyze(text.trim());
  };

  return (
    <div className="rounded-[24px] bg-white border border-[#E2E8F0] p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-1">
        <Sparkles className="w-4 h-4 text-emerald-500" />
        <h3 className="font-heading font-bold text-[#0F172A]">Describe your meal</h3>
      </div>
      <p className="text-xs text-[#64748B] mb-3">
        Type or speak naturally — "two eggs, toast with butter, and a protein shake".
      </p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={4}
        placeholder="What did you eat?"
        className="w-full rounded-2xl border border-[#E2E8F0] p-4 text-sm text-[#0F172A] font-medium focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none"
      />
      <div className="flex items-center justify-between mt-3">
        <button
          onClick={toggleMic}
          disabled={!supported}
          className={`h-11 px-4 rounded-full text-sm font-semibold border transition flex items-center gap-2 disabled:opacity-50 ${
            listening
              ? "bg-rose-50 text-rose-600 border-rose-200 animate-pulse"
              : "bg-white text-[#64748B] border-[#E2E8F0] hover:bg-slate-50"
          }`}
        >
          {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          {listening ? "Tap to stop" : "Dictate"}
        </button>
        <button
          onClick={submit}
          disabled={analyzing || !text.trim()}
          className="h-11 px-6 rounded-full bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 disabled:opacity-50 transition"
        >
          {analyzing ? "Analyzing…" : "Analyze"}
        </button>
      </div>
      {!supported && (
        <p className="text-[11px] text-[#64748B] mt-2">
          Voice dictation isn't available in this browser — typing works everywhere.
        </p>
      )}
    </div>
  );
}
