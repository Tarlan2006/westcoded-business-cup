import { t } from "../i18n/index";
import { useEffect, useRef } from "react";

type Player = { destroy: () => void };
type YouTubeAPI = { Player: new (element: HTMLIFrameElement, options: {
  events: { onError: () => void; onReady: () => void; onStateChange: (event: { data: number }) => void };
}) => Player };
type YouTubeWindow = Window & { YT?: YouTubeAPI; onYouTubeIframeAPIReady?: () => void };
let apiPromise: Promise<YouTubeAPI> | undefined;

function loadAPI() {
  const host = window as YouTubeWindow;
  if (host.YT?.Player) return Promise.resolve(host.YT);
  return apiPromise ??= new Promise<YouTubeAPI>((resolve, reject) => {
    const previous = host.onYouTubeIframeAPIReady;
    host.onYouTubeIframeAPIReady = () => {
      previous?.();
      if (host.YT) resolve(host.YT);
    };
    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.onerror = () => { apiPromise = undefined; script.remove(); reject(new Error(t("youTubeVideo.playerApiUnavailable"))); };
    document.head.append(script);
  });
}

export function YouTubeVideo({ id, title, autoplay = false, onEnded, onPlaying, onPaused, onError }: {
  id: string; title: string; autoplay?: boolean; onEnded: () => void; onPlaying?: () => void; onPaused?: () => void; onError: () => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const callbacks = useRef({ onEnded, onPlaying, onPaused, onError });
  callbacks.current = { onEnded, onPlaying, onPaused, onError };
  useEffect(() => {
    let disposed = false;
    let player: Player | undefined;
    let ended = false;
    const failed = () => { if (!disposed) callbacks.current.onError(); };
    const timer = window.setTimeout(failed, 15000);
    const frame = document.createElement("iframe");
    frame.title = title;
    frame.className = "video-player absolute inset-0 w-full h-full";
    frame.src = `https://www.youtube-nocookie.com/embed/${id}?rel=0&playsinline=1&enablejsapi=1&autoplay=${autoplay ? 1 : 0}&origin=${encodeURIComponent(window.location.origin)}`;
    frame.allow = "autoplay; encrypted-media; picture-in-picture";
    frame.allowFullscreen = true;
    frame.referrerPolicy = "strict-origin-when-cross-origin";
    container.current?.append(frame);
    void loadAPI().then(api => {
      if (disposed) return;
      player = new api.Player(frame, { events: { onError: failed, onReady: () => window.clearTimeout(timer), onStateChange: ({ data }) => {
        if (disposed) return;
        if (data === 1) { window.clearTimeout(timer); ended = false; callbacks.current.onPlaying?.(); }
        if (data === 2) callbacks.current.onPaused?.();
        if (data === 0 && !ended) { ended = true; callbacks.current.onEnded(); }
      } } });
    }).catch(() => { /* The ordinary iframe and manual navigation still work. */ });
    return () => { disposed = true; window.clearTimeout(timer); player?.destroy(); frame.remove(); };
  }, [id, title, autoplay]);

  return <div ref={container} className="absolute inset-0" />;
}
