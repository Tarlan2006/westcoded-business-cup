import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";

interface Point { x: number; y: number }
interface Stroke { color: string; width: number; points: Point[] }
export interface SketchSnapshot {
  pixels: ImageData;
  previewUrl: string;
  strokeCount: number;
}
export interface SketchCanvasHandle { snapshot: () => SketchSnapshot | null }

const colors = [
  ["Green", "#73bc79"], ["Yellow", "#ffd45b"], ["Blue", "#629ed9"], ["Pink", "#e68caf"],
  ["Purple", "#9c85cc"], ["Orange", "#ec9a59"], ["Brown", "#9a735e"], ["Ink", "#344457"],
] as const;
const widths = [5, 11, 22];

function paint(context: CanvasRenderingContext2D, stroke: Stroke) {
  const points = stroke.points;
  if (!points.length) return;
  context.fillStyle = context.strokeStyle = stroke.color;
  context.lineWidth = stroke.width;
  context.lineCap = context.lineJoin = "round";
  if (points.length === 1) {
    context.beginPath();
    context.arc(points[0].x, points[0].y, stroke.width / 2, 0, Math.PI * 2);
    context.fill();
    return;
  }
  context.beginPath();
  context.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length - 1; i++) {
    const point = points[i], next = points[i + 1];
    context.quadraticCurveTo(point.x, point.y, (point.x + next.x) / 2, (point.y + next.y) / 2);
  }
  const last = points[points.length - 1];
  context.lineTo(last.x, last.y);
  context.stroke();
}

export const SketchCanvas = forwardRef<SketchCanvasHandle>(function SketchCanvas(_, ref) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const strokes = useRef<Stroke[]>([]);
  const current = useRef<Stroke | null>(null);
  const pointer = useRef<number | null>(null);
  const frame = useRef<number | null>(null);
  const [color, setColor] = useState<string>(colors[0][1]);
  const [width, setWidth] = useState(11);
  const [eraser, setEraser] = useState(false);
  const [count, setCount] = useState(0);
  const [confirmClear, setConfirmClear] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const clearButton = useRef<HTMLButtonElement>(null);
  const keepButton = useRef<HTMLButtonElement>(null);

  function redraw() {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.fillStyle = "#fff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.setTransform(canvas.width / 400, 0, 0, canvas.height / 500, 0, 0);
    strokes.current.forEach((stroke) => paint(context, stroke));
    if (current.current) paint(context, current.current);
  }

  function scheduleDraw() {
    if (frame.current !== null) return;
    frame.current = requestAnimationFrame(() => { frame.current = null; redraw(); });
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas?.getContext("2d")) { setUnavailable(true); return; }
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.max(1, Math.round(rect.width * dpr));
      canvas.height = Math.max(1, Math.round(rect.height * dpr));
      redraw();
    };
    resize();
    const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(resize) : null;
    observer?.observe(canvas);
    window.addEventListener("resize", resize);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", resize);
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    };
  }, []);

  useEffect(() => { if (confirmClear) keepButton.current?.focus(); }, [confirmClear]);

  useImperativeHandle(ref, () => ({
    snapshot() {
      const canvas = canvasRef.current, context = canvas?.getContext("2d");
      if (!canvas || !context) return null;
      redraw();
      return {
        pixels: context.getImageData(0, 0, canvas.width, canvas.height),
        previewUrl: canvas.toDataURL("image/png"),
        strokeCount: strokes.current.filter((stroke) => stroke.color !== "#ffffff").length,
      };
    },
  }));

  function position(event: ReactPointerEvent<HTMLCanvasElement>): Point {
    const bounds = event.currentTarget.getBoundingClientRect();
    return {
      x: Math.min(400, Math.max(0, (event.clientX - bounds.left) / bounds.width * 400)),
      y: Math.min(500, Math.max(0, (event.clientY - bounds.top) / bounds.height * 500)),
    };
  }
  function start(event: ReactPointerEvent<HTMLCanvasElement>) {
    if (!event.isPrimary || event.button !== 0 || pointer.current !== null || confirmClear) return;
    event.preventDefault();
    pointer.current = event.pointerId;
    current.current = { color: eraser ? "#ffffff" : color, width, points: [position(event)] };
    event.currentTarget.setPointerCapture(event.pointerId);
    scheduleDraw();
  }
  function move(event: ReactPointerEvent<HTMLCanvasElement>) {
    if (pointer.current !== event.pointerId || !current.current) return;
    event.preventDefault();
    current.current.points.push(position(event));
    scheduleDraw();
  }
  function finish(event: ReactPointerEvent<HTMLCanvasElement>) {
    if (pointer.current !== event.pointerId || !current.current) return;
    if (event.type === "pointerup") current.current.points.push(position(event));
    strokes.current.push(current.current);
    current.current = null;
    pointer.current = null;
    setCount(strokes.current.length);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    redraw();
  }
  function closeClear() { setConfirmClear(false); clearButton.current?.focus(); }

  return (
    <div className="sk-drawing">
      <div className="sk-paper-label"><span>Your sketch</span><span>Make it your own ✦</span></div>
      {unavailable && <p className="sk-notice" role="status">Drawing is unavailable in this browser. You can still read the clues.</p>}
      <canvas ref={canvasRef} className="sk-canvas" width="400" height="500"
        aria-label="Drawing canvas. Draw the mystery hero with your finger, mouse or pen."
        style={{ touchAction: "none", width: "100%", aspectRatio: "4 / 5", display: "block" }}
        onPointerDown={start} onPointerMove={move} onPointerUp={finish}
        onPointerCancel={finish} onLostPointerCapture={finish}>
        Your browser needs canvas support to draw. All clues are also available as text.
      </canvas>
      <div className="sk-toolbar" role="group" aria-label="Drawing tools">
        {colors.map(([name, value]) => <button type="button" key={name} className="sk-tool sk-color"
          aria-label={`${name} pencil`} aria-pressed={!eraser && color === value} title={name}
          onClick={() => { setColor(value); setEraser(false); }}>
          <span className="sk-swatch" style={{ backgroundColor: value }}>{!eraser && color === value ? "✓" : ""}</span>
        </button>)}
        {widths.map((value, i) => <button type="button" key={value} className="sk-tool"
          aria-label={`${["Thin", "Medium", "Thick"][i]} brush`} aria-pressed={width === value}
          title={`${["Thin", "Medium", "Thick"][i]} brush`} onClick={() => setWidth(value)}>
          <span className="sk-brush-dot" style={{ width: value, height: value }} />
        </button>)}
        <button type="button" className="sk-tool" aria-pressed={eraser} aria-label="Eraser" title="Eraser" onClick={() => setEraser(!eraser)}>
          <svg className="sk-tool-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="m4 15 9-11 8 7-9 10H8Z M8 11l8 7M11 21h10" /></svg>
        </button>
        <button type="button" className="sk-tool" aria-label="Undo" title="Undo last stroke" disabled={!count} onClick={() => { strokes.current.pop(); setCount(strokes.current.length); redraw(); }}>
          <svg className="sk-tool-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M8 5 3 10l5 5M3 10h10a6 6 0 0 1 0 12" /></svg>
        </button>
        <button type="button" ref={clearButton} className="sk-tool" aria-label="Clear" title="Clear drawing" disabled={!count} onClick={() => setConfirmClear(true)}>
          <svg className="sk-tool-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M3 6h18M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7m4-7v7" /></svg>
        </button>
      </div>
      {confirmClear && <div className="sk-clear-confirm" role="alertdialog" aria-label="Clear drawing?" onKeyDown={(event) => { if (event.key === "Escape") closeClear(); }}>
        <p>Clear drawing?</p><span>This removes all your strokes.</span>
        <div className="sk-button-row">
          <button type="button" className="sk-button sk-secondary" ref={keepButton} onClick={closeClear}>Keep drawing</button>
          <button type="button" className="sk-button" onClick={() => { strokes.current = []; setCount(0); redraw(); closeClear(); }}>Yes, clear</button>
        </div>
      </div>}
      <p className="sk-privacy">Your drawing stays on this device</p>
    </div>
  );
});
