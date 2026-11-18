import { t, subscribe } from "../../i18n/index";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { ObjectArt } from "./art/ObjectArt";
import { cameraScale, clamp, compareSizes, formatSize, objects, stopCount } from "./scale";
import "./space.css";

function lerp(from: number, to: number, mix: number) {
  return from + (to - from) * mix;
}

function Chevron({ back = false }: { back?: boolean }) {
  return <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor"
    strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={back ? "m12 5-5 5 5 5" : "m8 5 5 5-5 5"} />
  </svg>;
}

function makeTypes(): Record<string, string> { return {
  child: t("journey.person"), whale: t("journey.animal"), mountain: t("journey.mountain"), moon: t("journey.naturalSatellite"),
  earth: t("journey.planet"), jupiter: t("journey.gasGiant"), sun: t("journey.star"), star: t("journey.redSupergiant"),
}; }
let types = makeTypes();
subscribe(() => { types = makeTypes(); });
const artSize = 640;

function useCamera() {
  const scroller = useRef<HTMLDivElement>(null);
  const scene = useRef<HTMLDivElement>(null);
  const layers = useRef<(HTMLDivElement | null)[]>([]);
  const captions = useRef<(HTMLSpanElement | null)[]>([]);
  const target = useRef(0);
  const jumpTo = useRef<(index: number) => void>(() => {});
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
    let jump: { from: number; start?: number } | undefined;

    function draw(time: number) {
      pending = 0;
      const delta = lastTime === undefined ? 16.7 : time - lastTime;
      const destination = preference.matches ? Math.round(target.current) : target.current;
      if (jump && !preference.matches) {
        jump.start ??= time;
        const elapsed = clamp((time - jump.start) / 520, 0, 1);
        current = lerp(jump.from, destination, elapsed * elapsed * (3 - 2 * elapsed));
        if (elapsed === 1) jump = undefined;
      } else {
        current = Math.abs(destination - current) < .002 || preference.matches
          ? destination
          : lerp(current, destination, 1 - Math.exp(-delta / 90));
        jump = undefined;
      }
      const active = Math.round(current);
      if (active !== shown) {
        shown = active;
        setActive(active);
      }

      const from = Math.floor(current);
      const into = current - from;
      const smooth = into * into * (3 - 2 * into);
      const mobile = width < 580;
      const baseline = height * .855;
      const focus = Math.min(height * (mobile ? .82 : .8), width * (mobile ? .76 : .62));
      const kmPerPixel = cameraScale(current / stopCount, focus);
      const placements = [
        { index: from - 1, x: lerp(.145, .02, smooth), opacity: 1 - smooth, incoming: false },
        { index: from, x: lerp(from === 0 ? .5 : .59, .145, smooth), opacity: 1, incoming: false },
        { index: from + 1, x: lerp(.84, .59, smooth), opacity: smooth, incoming: true },
      ];
      const visible = placements.filter(({ index, opacity }) => index >= 0 && index <= stopCount && opacity > 0);
      for (const index of visibleLayers) {
        if (visible.some((object) => object.index === index)) continue;
        layers.current[index]?.style.setProperty("opacity", "0");
        captions.current[index]?.style.setProperty("opacity", "0");
      }
      visibleLayers = visible.map(({ index, x, opacity, incoming }) => {
        const layer = layers.current[index];
        const caption = captions.current[index];
        const object = objects[index];
        const naturalSize = object.diameterKm / kmPerPixel;
        const tinySun = object.id === "sun" && naturalSize < 6;
        const size = tinySun ? 4 : clamp(naturalSize, 11, focus * (incoming ? smooth : 1));
        const horizontal = clamp(x * width, size / 2 + 8, width - size / 2 - 8);
        if (layer) {
          layer.style.transform = `translate3d(${horizontal}px, ${baseline}px, 0) translate(-50%, -100%) scale(${tinySun ? 1 : size / artSize})`;
          layer.style.opacity = String(opacity);
          layer.toggleAttribute("data-tiny-sun", tinySun);
        }
        if (caption) {
          const callout = mobile && size < 45;
          const labelX = clamp(horizontal, tinySun ? 60 : 52, width - 52);
          caption.style.setProperty("--sp-callout-offset", `${horizontal - labelX}px`);
          caption.style.transform = `translate3d(${labelX}px, ${baseline - (callout ? size + 16 : -7)}px, 0) translate(-50%, ${callout ? "-100%" : "0"})`;
          caption.style.opacity = opacity >= .76 ? String((opacity - .76) / .24) : "0";
          caption.toggleAttribute("data-callout", callout);
          caption.toggleAttribute("data-tiny-sun", tinySun);
        }
        return index;
      });

      if (jump || current !== destination) {
        lastTime = time;
        pending = requestAnimationFrame(draw);
      } else {
        lastTime = undefined;
      }
    }

    function enqueue() {
      if (!pending) pending = requestAnimationFrame(draw);
    }

    function update() {
      const next = distance ? clamp(viewport.scrollTop / distance, 0, 1) * stopCount : 0;
      if (!jump || Math.abs(target.current - next) > .01) {
        jump = undefined;
        target.current = next;
      }
      enqueue();
    }

    jumpTo.current = (index) => {
      target.current = clamp(index, 0, stopCount);
      jump = { from: current };
      viewport.scrollTop = target.current / stopCount * distance;
      enqueue();
    };

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
      jumpTo.current = () => {};
    };
  }, []);

  const goTo = (index: number) => jumpTo.current(index);
  const step = (direction: number) => goTo(Math.round(target.current) + direction);
  return { scroller, scene, layers, captions, active, goTo, step };
}

export function Journey({ onFinish, speak, exploreOnly }: {
  onFinish: () => void;
  speak?: (text: string) => Promise<void> | void;
  exploreOnly: boolean;
}) {
  const { scroller, scene, layers, captions, active, goTo, step } = useCamera();
  const [speaking, setSpeaking] = useState(false);
  const [speechStatus, setSpeechStatus] = useState("");
  const object = objects[active];
  const previous = objects[active - 1];
  const comparison = previous ? compareSizes(object, previous) : t("journey.startHereThenSeeWhatIsBigger");
  const dimension = { height: "tall", length: "long", "height above sea level": t("journey.aboveSeaLevel"), diameter: "wide" }[object.measure];
  const comparisonText = previous?.measure === "diameter" && object.measure === "diameter"
    ? comparison.replace(t("journey.timesAsBigAs"), t("journey.timesAsWideAs")) : comparison;

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
      setSpeechStatus(t("journey.audioIsUnavailableYouCanReadThe"));
    } finally {
      setSpeaking(false);
    }
  }

  return (
    <div className="sp-scroll" ref={scroller} role="region" tabIndex={0} aria-label={t("journey.spaceJourney")} onKeyDown={(event) => {
      if (event.target instanceof HTMLSelectElement || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        step(event.key === "ArrowDown" ? 1 : -1);
      }
    }}>
      <div className="sp-track" style={{ "--sp-track-distance": `${stopCount * 390}px` } as CSSProperties}>
        <section className="sp-sticky" aria-label={t("journey.scaleViewer")}>
          <header className="sp-journey-title">
            <h1 aria-live="polite" aria-atomic="true"><span key={object.id}>{object.name}</span></h1>
            <p className="sp-measure">{types[object.art]} {t("journey.about")} {formatSize(object.diameterKm)} {dimension}</p>
          </header>
          <div className="sp-scene" ref={scene} style={{ "--sp-art-size": `${artSize}px` } as CSSProperties} aria-hidden="true">
            <div className="sp-baseline" />
            {objects.map(({ id, name, art }, index) => (
              <div key={id}>
                <div className="sp-layer" ref={(element) => { layers.current[index] = element; }}>
                  <ObjectArt art={art} />
                  {id === "sun" && <i className="sp-sun-dot" />}
                </div>
                <span className="sp-object-caption" ref={(element) => { captions.current[index] = element; }}>
                  {name}{id === "sun" && <span className="sp-tiny-caption"> {t("journey.aTinyDot")}</span>}
                </span>
              </div>
            ))}
          </div>
          <p className="sp-comparison">{comparisonText}
            {object.rangeKm && <span className="sp-range">{t("journey.estimatedRangeTo", { value1: formatSize(object.rangeKm[0]), value2: formatSize(object.rangeKm[1]) })}</span>}
          </p>
          <div className="sp-discovery">
            <p>{object.fact}</p>
            {speak && <button className="sp-button sp-button-soft sp-hear" type="button" aria-disabled={speaking}
              onClick={() => void hearFact()}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M4 9h4l5-4v14l-5-4H4zm12 0a4 4 0 0 1 0 6m3-9a8 8 0 0 1 0 12" />
              </svg>
              {speaking ? t("sketchGame.reading") : t("sketchGame.hearIt")}
            </button>}
            <p className="sp-sr-only" role="status">{speechStatus}</p>
          </div>
          <div className="sp-journey-actions" data-final={active === stopCount || undefined}>
            <button className="sp-button sp-button-soft sp-chevron" type="button" aria-label={t("journey.previousStop")}
              aria-disabled={active === 0} onClick={() => step(-1)}><Chevron back /></button>
            <nav className="sp-stops" aria-label={t("journey.journeyStops")}>
              <div className="sp-stop-buttons">
                {objects.map((stop, index) => (
                  <button type="button" key={stop.id} className="sp-stop"
                    aria-label={stop.name} aria-current={index === active ? "step" : undefined}
                    onClick={() => goTo(index)}><span className="sp-dot" /></button>
                ))}
              </div>
              <div className="sp-stop-picker">
                <div className="sp-stop-dots" aria-hidden="true">
                  {objects.map(({ id }, index) => <span key={id} className="sp-dot" data-active={index === active || undefined} />)}
                </div>
                <select aria-label={t("journey.jumpToAStop")} value={active} onChange={(event) => goTo(Number(event.target.value))}>
                  {objects.map(({ id, name }, index) => <option key={id} value={index}>{index + 1}. {name}</option>)}
                </select>
              </div>
            </nav>
            {active === stopCount ? <button className="sp-button sp-button-primary sp-stage-next" type="button" onClick={onFinish}>
              {exploreOnly ? t("journey.finishJourney") : t("journey.startQuiz")}
            </button> : <button className="sp-button sp-button-soft sp-chevron sp-stage-next" type="button"
              aria-label={t("journey.next")} onClick={() => step(1)}><Chevron /></button>}
          </div>
        </section>
      </div>
    </div>
  );
}
