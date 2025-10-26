"use client";
import { useRef, useState } from "react";

export default function BackgroundMusic() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);

  const toggle = () => {
    // lazily create the audio object on first click
    if (!audioRef.current) {
      audioRef.current = new Audio("/music/sexy-back.mp3");
      audioRef.current.loop = true;
    }

    if (playing) {
      audioRef.current.pause();
    } else {
      audioRef.current
        .play()
        .then(() => console.log("✅ Audio started"))
        .catch((err) => console.warn("⚠️ Audio play error:", err));
    }

    setPlaying(!playing);
  };

  return (
    <button
        onClick={toggle}
        className="fixed top-6 left-6 z-[9999] bg-indigo-600 text-white px-4 py-2 rounded-full shadow-lg hover:bg-indigo-500 transition"
    >
        {playing ? "⏸ Pause Music" : "▶️ Play Music"}
    </button>
    );
}
