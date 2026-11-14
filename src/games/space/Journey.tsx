import { useEffect, useRef, useState, type CSSProperties } from "react";
import { ObjectArt } from "./art/ObjectArt";
import { cameraScale, clamp, compareSizes, formatSize, objects, screenSize, stopCount } from "./scale";
import "./space.css";

function lerp(from: number, to: number, mix: number) {
  return from + (to - from) * mix;
}

function useCamera() {
  const scroller = useRef<HTMLDivElement>(null);
  const scene = useRef<HTMLDivElement>(null);
  const layers = useRef<(HTMLDivElement | null)[]>([]);
  const target = useRef(0);
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (!scroller.current || !scene.current) return;
    const viewport: HTMLDivElement = scroller.current;
    const stage: HTMLDivElement = scene.current;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    let current = 0;
    let shown = 0;
    let pending = 0;
    let lastTime: number | undefined;
    let width = 0;
    let height = 0;
    let distance = 0;
    let visibleLayers: number[] = [];

    function draw(time: number) {
      pending = 0;
      const delta = lastTime === undefined ? 16.7 : time - lastTime;
      const destination = preference.matches ? Math.round(target.current) : target.current;
      current = Math.abs(destination - current) < .002 || preference.matches
        ? destination
        : lerp(current, destination, 1 - Math.exp(-delta / 90));
      const active = Math.round(current);
      if (active !== shown) {
        shown = active;
        setActive(active);
      }

      const from = Math.floor(current);
      const into = current - from;
      const smooth = into * into * (3 - 2 * into);
      const viewportPx = Math.min(width, height);
      const focus = Math.min(viewportPx * .81, width * .64, 245);
      const kmPerPixel = cameraScale(current / stopCount, focus);
      const placements = [
        { index: from - 1, x: .16, y: .66, opacity: 1 - smooth, reveal: 1 },
        { index: from, x: lerp(.57, .16, smooth), y: lerp(.48, .66, smooth), opacity: 1, reveal: 1 },
        { index: from + 1, x: lerp(.82, .57, smooth), y: lerp(.37, .48, smooth), opacity: smooth, reveal: smooth },
      ];
      const visible = placements.filter(({ index, opacity }) => index >= 0 && index <= stopCount && opacity > 0);
      for (const index of visibleLayers) {
        if (!visible.some((object) => object.index === index)) layers.current[index]?.style.setProperty("opacity", "0");
      }
      visibleLayers = visible.map(({ index, x, y, opacity, reveal }) => {
        const layer = layers.current[index];
        if (layer) {
          const diameter = screenSize(objects[index].diameterKm, kmPerPixel, viewportPx);
          const size = Math.max(2, Math.min(diameter, focus * reveal));
          layer.style.transform = `translate3d(${x * width}px, ${y * height}px, 0) translate(-50%, -50%) scale(${size / 100})`;
          layer.style.opacity = String(opacity);
        }
        return index;
      });

      if (current !== destination) {
        lastTime = time;
        pending = requestAnimationFrame(draw);
      } else {
        lastTime = undefined;
      }
    }

    function update() {
      target.current = distance ? clamp(viewport.scrollTop / distance, 0, 1) * stopCount : 0;
      if (!pending) pending = requestAnimationFrame(draw);
    }

    function resize() {
      const position = target.current;
      width = stage.clientWidth;
      height = stage.clientHeight;
      distance = viewport.scrollHeight - viewport.clientHeight;
      viewport.scrollTop = (position / stopCount) * distance;
      update();
    }

    const observer = new ResizeObserver(resize);
    observer.observe(viewport);
    observer.observe(stage);
    viewport.addEventListener("scroll", update, { passive: true });
    preference.addEventListener("change", update);
    resize();
    return () => {
      cancelAnimationFrame(pending);
      observer.disconnect();
      viewport.removeEventListener("scroll", update);
      preference.removeEventListener("change", update);
    };
  }, []);

  function goTo(index: number) {
    const viewport = scroller.current;
    if (!viewport) return;
    const distance = viewport.scrollHeight - viewport.clientHeight;
    const next = clamp(index, 0, stopCount);
    target.current = next;
    viewport.scrollTop = next / stopCount * distance;
  }

  const step = (direction: number) => goTo(Math.round(target.current) + direction);
  return { scroller, scene, layers, active, goTo, step };
}

export function Journey({ onFinish, speak, exploreOnly }: {
  onFinish: () => void;
  speak?: (text: string) => Promise<void> | void;
  exploreOnly: boolean;
}) {
  const { scroller, scene, layers, active, goTo, step } = useCamera();
  const [speaking, setSpeaking] = useState(false);
  const [speechStatus, setSpeechStatus] = useState("");
  const object = objects[active];
  const previous = objects[active - 1];
  const comparison = previous ? compareSizes(object, previous) : "Start here, then see what is bigger.";
  const measurement = `About ${formatSize(object.diameterKm)}`;

  useEffect(() => {
    scroller.current?.focus({ preventScroll: true });
  }, [scroller]);

  async function hearFact() {
    if (!speak || speaking) return;
    setSpeaking(true);
    setSpeechStatus("");
    try {
      await speak(`${object.name}. ${object.fact}`);
    } catch {
      setSpeechStatus("Audio is unavailable. You can read the fact here.");
    } finally {
      setSpeaking(false);
    }
  }

  return (
    <div className="sp-scroll" ref={scroller} role="region" tabIndex={0} aria-label="Space journey" onKeyDown={(event) => {
      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        step(event.key === "ArrowDown" ? 1 : -1);
      }
    }}>
      <div className="sp-track" style={{ "--sp-track-distance": `${stopCount * 390}px` } as CSSProperties}>
        <section className="sp-sticky" aria-label="Scale viewer">
          <header className="sp-journey-title">
            <div>
              <p className="sp-kicker">Stop {active + 1} of {objects.length}</p>
              <h2 aria-live="polite" aria-atomic="true">{object.name}</h2>
            </div>
            <p className="sp-measure"><strong>{measurement}</strong><span>{object.measure}</span></p>
          </header>
          <div className="sp-scene" ref={scene} aria-hidden="true">
            {objects.map(({ id, art }, index) => <div key={id} className="sp-layer"
              ref={(element) => { layers.current[index] = element; }}>
              <ObjectArt art={art} />
            </div>)}
            {previous && <div className="sp-previous-label"><span />{previous.name}</div>}
          </div>
          <div className="sp-discovery">
            <div>
              <p className="sp-comparison">{comparison}</p>
              <p>{object.fact}</p>
              {object.rangeKm && <p className="sp-range">
                Estimated range: {formatSize(object.rangeKm[0])} to {formatSize(object.rangeKm[1])}.
              </p>}
            </div>
            {speak && <button className="sp-button sp-button-soft sp-hear" type="button" aria-disabled={speaking}
              onClick={() => void hearFact()}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M4 9h4l5-4v14l-5-4H4zm12 0a4 4 0 0 1 0 6m3-9a8 8 0 0 1 0 12" />
              </svg>
              {speaking ? "Reading…" : "Hear it"}
            </button>}
            <p className="sp-sr-only" role="status">{speechStatus}</p>
          </div>
          <nav className="sp-stops" aria-label="Journey stops">
            {objects.map((stop, index) => (
              <button type="button" key={stop.id} className="sp-stop"
                aria-label={stop.name} aria-current={index === active ? "step" : undefined}
                onClick={() => goTo(index)}>
                <span className="sp-stop-icon"><ObjectArt art={stop.art} /></span>
                <span>{stop.name}</span>
              </button>
            ))}
          </nav>
          <div className="sp-journey-actions">
            <button className="sp-button sp-button-soft" type="button" aria-disabled={active === 0}
              onClick={() => step(-1)}><span aria-hidden="true">←</span> Previous stop</button>
            <p className="sp-scroll-hint">Scroll or use ↑ ↓</p>
            <button className="sp-button sp-button-primary" type="button" onClick={active === stopCount ? onFinish : () => step(1)}>
              {active === stopCount ? (exploreOnly ? "Finish journey" : "Start quiz") : "Next"} <span aria-hidden="true">→</span>
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
