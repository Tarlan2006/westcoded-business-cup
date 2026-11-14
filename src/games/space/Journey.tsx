import { useEffect, useRef, useState, type CSSProperties } from "react";
import { ObjectArt } from "./art/ObjectArt";
import { cameraScale, clamp, objects, screenSize, stopCount } from "./scale";
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

export function Journey() {
  const { scroller, scene, layers, active } = useCamera();
  const object = objects[active];

  return (
    <div className="sp-scroll" ref={scroller} role="region" tabIndex={0} aria-label="Space journey">
      <div className="sp-track" style={{ "--sp-track-distance": `${stopCount * 390}px` } as CSSProperties}>
        <section className="sp-sticky" aria-label="Scale viewer">
          <div className="sp-scene" ref={scene} aria-hidden="true">
            {objects.map(({ id, art }, index) => <div key={id} className="sp-layer"
              ref={(element) => { layers.current[index] = element; }}>
              <ObjectArt art={art} />
            </div>)}
          </div>
          <h2 aria-live="polite">{object.name}</h2>
        </section>
      </div>
    </div>
  );
}
