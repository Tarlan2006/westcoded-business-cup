import { t } from "../i18n/index";
import { useEffect, useImperativeHandle, useRef, type Ref } from "react";

export type VideoStatus = "loading" | "playing" | "paused" | "blocked" | "error";
export interface PlayerControls {
  playVideo(): void;
  pauseVideo(): void;
  mute(): void;
  unMute(): void;
  destroy(): void;
}
interface PlayerEvent { target: PlayerControls; data: number }
interface YouTubeAPI {
  Player: new (element: HTMLElement, options: {
    host: string; videoId: string; width: string; height: string;
    playerVars: Record<string, string | number>;
    events: {
      onReady(event: PlayerEvent): void;
      onStateChange(event: PlayerEvent): void;
      onError(): void;
      onAutoplayBlocked(event: PlayerEvent): void;
    };
  }) => PlayerControls;
}
const youtubeWindow = window as Window & { YT?: YouTubeAPI; onYouTubeIframeAPIReady?: () => void };
let api: Promise<YouTubeAPI> | undefined;

function loadYouTube() {
  if (youtubeWindow.YT?.Player) return Promise.resolve(youtubeWindow.YT);
  api ??= new Promise<YouTubeAPI>((resolve, reject) => {
    const timeout = window.setTimeout(() => reject(new Error(t("toddlerPlayer.videoPlayerUnavailable"))), 10_000);
    const previous = youtubeWindow.onYouTubeIframeAPIReady;
    youtubeWindow.onYouTubeIframeAPIReady = () => {
      window.clearTimeout(timeout);
      previous?.();
      if (youtubeWindow.YT?.Player) resolve(youtubeWindow.YT);
      else reject(new Error(t("toddlerPlayer.videoPlayerUnavailable")));
    };
    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.async = true;
    script.onerror = () => {
      window.clearTimeout(timeout);
      script.remove();
      reject(new Error(t("toddlerPlayer.videoPlayerUnavailable")));
    };
    document.head.append(script);
  }).catch((error) => { api = undefined; throw error; });
  return api;
}

/** YouTube's own controls stay accessible inside the toddler cinema. */
export function ToddlerPlayer({ videoId, title, muted, onStatus, onEnded, onMuted, ref }: {
  videoId: string; title: string; muted: boolean; ref: Ref<PlayerControls | null>;
  onStatus: (status: VideoStatus) => void; onEnded: () => void; onMuted: () => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const player = useRef<PlayerControls | null>(null);
  const callbacks = useRef({ onStatus, onEnded, onMuted, muted });
  callbacks.current = { onStatus, onEnded, onMuted, muted };
  useImperativeHandle(ref, () => ({
    playVideo: () => player.current?.playVideo(), pauseVideo: () => player.current?.pauseVideo(),
    mute: () => player.current?.mute(), unMute: () => player.current?.unMute(),
    destroy: () => player.current?.destroy(),
  }), []);

  useEffect(() => {
    if (muted) player.current?.mute();
    else player.current?.unMute();
  }, [muted]);

  useEffect(() => {
    let active = true;
    let instance: PlayerControls | undefined;
    let retriedMuted = false;
    callbacks.current.onStatus("loading");
    const timeout = window.setTimeout(() => { if (active) callbacks.current.onStatus("error"); }, 30_000);
    const failed = () => {
      window.clearTimeout(timeout);
      if (active) callbacks.current.onStatus("error");
    };
    void loadYouTube().then((youtube) => {
      if (!active || !container.current) return;
      const slot = document.createElement("div");
      container.current.replaceChildren(slot);
      instance = new youtube.Player(slot, {
        host: "https://www.youtube.com", videoId, width: "100%", height: "100%",
        playerVars: { autoplay: 1, playsinline: 1, controls: 1, rel: 0, origin: window.location.origin,
          mute: callbacks.current.muted ? 1 : 0 },
        events: {
          onReady: ({ target }) => {
            if (!active) return;
            player.current = target;
            const iframe = container.current?.querySelector("iframe");
            if (iframe) {
              iframe.title = title;
              iframe.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
              iframe.referrerPolicy = "strict-origin-when-cross-origin";
            }
            if (callbacks.current.muted) target.mute();
            target.playVideo();
          },
          onStateChange: ({ data }) => {
            if (!active) return;
            if (data === 1 || data === 2 || data === 0) window.clearTimeout(timeout);
            if (data === 1) callbacks.current.onStatus("playing");
            else if (data === 2) callbacks.current.onStatus("paused");
            else if (data === 0) callbacks.current.onEnded();
          },
          onError: failed,
          onAutoplayBlocked: ({ target }) => {
            if (!active) return;
            if (!retriedMuted) {
              retriedMuted = true;
              target.mute();
              callbacks.current.onMuted();
              target.playVideo();
            } else {
              window.clearTimeout(timeout);
              callbacks.current.onStatus("blocked");
            }
          },
        },
      });
    }).catch(failed);
    const hide = () => { if (document.hidden) player.current?.pauseVideo(); };
    document.addEventListener("visibilitychange", hide);
    return () => {
      active = false;
      window.clearTimeout(timeout);
      document.removeEventListener("visibilitychange", hide);
      player.current = null;
      instance?.destroy();
    };
  }, [videoId, title]);

  return <div className="toddler-player" ref={container} />;
}
