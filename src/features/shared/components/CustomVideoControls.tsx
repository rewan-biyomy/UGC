import { useEffect, useState, type RefObject } from "react";
import { Maximize, Pause, Play, Volume2, VolumeX } from "lucide-react";

interface CustomVideoControlsProps {
  videoRef: RefObject<HTMLVideoElement | null>;
  containerRef: RefObject<HTMLDivElement | null>;
}

export function CustomVideoControls({ videoRef, containerRef }: CustomVideoControlsProps) {
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const update = () => {
      setProgress(video.currentTime);
      setDuration(Number.isFinite(video.duration) ? video.duration : 0);
      setPlaying(!video.paused);
    };
    video.addEventListener("timeupdate", update);
    video.addEventListener("play", update);
    video.addEventListener("pause", update);
    video.addEventListener("loadedmetadata", update);
    return () => {
      video.removeEventListener("timeupdate", update);
      video.removeEventListener("play", update);
      video.removeEventListener("pause", update);
      video.removeEventListener("loadedmetadata", update);
    };
  }, [videoRef]);

  const togglePlayback = async () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) await video.play();
    else video.pause();
  };
  const formatTime = (seconds: number) => {
    const safe = Number.isFinite(seconds) ? seconds : 0;
    return `${Math.floor(safe / 60)}:${Math.floor(safe % 60).toString().padStart(2, "0")}`;
  };

  return (
    <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/60 to-transparent p-3 opacity-0 transition-opacity hover:opacity-100 focus-within:opacity-100">
      <button type="button" onClick={() => void togglePlayback()} aria-label={playing ? "Pause video" : "Play video"} className="absolute inset-0 m-auto grid h-12 w-12 place-items-center rounded-full bg-black/60 text-white">
        {playing ? <Pause size={20} /> : <Play size={20} />}
      </button>
      <input type="range" aria-label="Seek video" min={0} max={duration || 0} step={0.1} value={Math.min(progress, duration)} onChange={(event) => {
        if (videoRef.current) videoRef.current.currentTime = Number(event.target.value);
      }} className="relative z-10 w-full accent-fuchsia-500" />
      <div className="relative z-10 flex items-center justify-between text-xs text-white">
        <span>{formatTime(progress)} / {formatTime(duration)}</span>
        <div className="flex gap-3">
          <button type="button" aria-label={muted ? "Unmute video" : "Mute video"} onClick={() => {
            if (!videoRef.current) return;
            videoRef.current.muted = !videoRef.current.muted;
            setMuted(videoRef.current.muted);
          }}>{muted ? <VolumeX size={16} /> : <Volume2 size={16} />}</button>
          <button type="button" aria-label="Fullscreen" onClick={() => void containerRef.current?.requestFullscreen?.()}><Maximize size={16} /></button>
        </div>
      </div>
    </div>
  );
}