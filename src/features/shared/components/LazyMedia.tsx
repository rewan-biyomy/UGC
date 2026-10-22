import { useRef } from "react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useInViewLazy } from "../hooks/useInViewLazy";
import { CustomVideoControls } from "./CustomVideoControls";

export function LazyImage({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const { ref, inView } = useInViewLazy<HTMLDivElement>();
  return (
    <div ref={ref} className={cn("h-full w-full", className)}>
      {inView ? <img src={src} alt={alt} loading="lazy" decoding="async" className="h-full w-full object-cover" /> : <Skeleton className="h-full w-full" />}
    </div>
  );
}

export function LazyVideo({ src, poster, className }: { src: string; poster?: string; className?: string }) {
  const { ref, inView } = useInViewLazy<HTMLDivElement>("400px");
  const videoRef = useRef<HTMLVideoElement>(null);
  return (
    <div ref={ref} className={cn("group/video relative h-full w-full overflow-hidden bg-black", className)}>
      {inView ? <video ref={videoRef} src={src} poster={poster} preload="metadata" playsInline muted loop className="h-full w-full object-cover" /> : <Skeleton className="h-full w-full" />}
      {inView && <CustomVideoControls videoRef={videoRef} containerRef={ref} />}
    </div>
  );
}