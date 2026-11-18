import { t, contentText } from "../../i18n/index";
import { Mascot } from "../../components/Mascot";
import { useEffect, useRef, useState } from "react";
import type { SketchGameProps } from "./index";
import { SketchCanvas } from "./SketchCanvas";
import type { SketchCanvasHandle, SketchSnapshot } from "./SketchCanvas";
import { sketchArt } from "./art";
import cases from "./cases.json";
import { drawingStats, scoreSketch, sketchEncouragement, sketchResult } from "./scoreSketch";
import "./sketch.css";

type Stage = "intro" | "draw" | "comparing" | "reveal";
type CaseFile = typeof cases[number];

function chooseCase(previous?: string): CaseFile {
  const alternatives = cases.filter((entry) => entry.id !== previous);
  const pool = alternatives.length ? alternatives : cases;
  return pool[Math.floor(Math.random() * pool.length)];
}

/** Rasterize our own inline SVG only. No server or remote image is involved. */
async function referencePixels(svg: SVGSVGElement | null, width: number, height: number): Promise<ImageData | null> {
  if (!svg) return null;
  return new Promise((resolve) => {
    const image = new Image();
    let settled = false;
    const finish = (pixels: ImageData | null) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      image.onload = image.onerror = null;
      resolve(pixels);
    };
    const timeout = window.setTimeout(() => finish(null), 1200);
    image.onerror = () => finish(null);
    image.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = width; canvas.height = height;
        const context = canvas.getContext("2d");
        if (!context) { finish(null); return; }
        context.fillStyle = "#fff";
        context.fillRect(0, 0, width, height);
        context.drawImage(image, 0, 0, width, height);
        finish(context.getImageData(0, 0, width, height));
      } catch { finish(null); }
    };
    try {
      const clone = svg.cloneNode(true) as SVGSVGElement;
      clone.setAttribute("width", String(width));
      clone.setAttribute("height", String(height));
      image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(new XMLSerializer().serializeToString(clone))}`;
    } catch { finish(null); }
  });
}

export function SketchGame({ onComplete, onBack, speak, header }: SketchGameProps) {
  const [original, setCaseFile] = useState<CaseFile>(() => chooseCase());
  const caseFile = { ...original, title: contentText("sketch." + original.id + ".title"),
    clues: original.clues.map(clue => ({ ...clue, text: contentText("sketch.clue." + clue.id) })),
    checklist: original.checklist.map((_, i) => contentText("sketch.check." + i)) };
  const [stage, setStage] = useState<Stage>("intro");
  const [clueIndex, setClueIndex] = useState(0);
  const [checked, setChecked] = useState<boolean[]>(() => caseFile.checklist.map(() => false));
  const [snapshot, setSnapshot] = useState<SketchSnapshot | null>(null);
  const [automatic, setAutomatic] = useState<number | null>(null);
  const [stats, setStats] = useState({ empty: true, flooded: false });
  const [speechStatus, setSpeechStatus] = useState("");
  const [speaking, setSpeaking] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const canvasRef = useRef<SketchCanvasHandle>(null);
  const artRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const operation = useRef(0);
  const utterance = useRef(0);
  const submitting = useRef(false);
  const downloadUrls = useRef(new Set<string>());
  const delayTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const delayResolve = useRef<(() => void) | null>(null);
  const Art = sketchArt[caseFile.id];
  const clue = caseFile.clues[clueIndex];
  const lastClue = clueIndex === caseFile.clues.length - 1;
  const result = sketchResult(automatic, checked, snapshot?.strokeCount ?? 0, stats);

  useEffect(() => { headingRef.current?.focus({ preventScroll: true }); }, [stage]);
  useEffect(() => () => {
    operation.current++;
    utterance.current++;
    if (delayTimer.current !== null) clearTimeout(delayTimer.current);
    delayResolve.current?.();
    downloadUrls.current.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  async function readClue() {
    if (!speak) return;
    const id = ++utterance.current;
    setSpeaking(true); setSpeechStatus("");
    try { await speak(clue.text); }
    catch { if (id === utterance.current) setSpeechStatus(t("sketchGame.audioIsnTAvailableRightNowYou")); }
    finally { if (id === utterance.current) setSpeaking(false); }
  }
  useEffect(() => {
    if (stage === "draw" && speak) void readClue();
    return () => { utterance.current++; };
    // Each newly displayed clue is read once. The host supplies a stable callback.
  }, [stage, clueIndex, caseFile.id, speak]);

  function back() { operation.current++; utterance.current++; onBack(); }

  async function compare() {
    if (stage !== "draw" || submitting.current) return;
    submitting.current = true;
    const picture = canvasRef.current?.snapshot();
    if (!picture) { submitting.current = false; setSpeechStatus(t("sketchGame.theCanvasIsnTReadyPleaseTry")); return; }
    const id = ++operation.current;
    setSnapshot(picture);
    setStats(drawingStats(picture.pixels));
    const reference = referencePixels(artRef.current?.querySelector("svg") ?? null, picture.pixels.width, picture.pixels.height);
    setStage("comparing");
    const wait = new Promise<void>((resolve) => {
      delayResolve.current = resolve;
      delayTimer.current = setTimeout(() => { delayResolve.current = null; delayTimer.current = null; resolve(); }, 1250);
    });
    const [pixels] = await Promise.all([reference, wait]);
    if (operation.current !== id) return;
    try { setAutomatic(pixels ? scoreSketch(picture.pixels, pixels).colorsAndShape : null); }
    catch { setAutomatic(null); }
    submitting.current = false;
    setStage("reveal");
  }

  function replay() {
    operation.current++; utterance.current++;
    const next = chooseCase(caseFile.id);
    setCaseFile(next); setChecked(next.checklist.map(() => false)); setClueIndex(0);
    setSnapshot(null); setAutomatic(null); setStats({ empty: true, flooded: false });
    setSaveStatus(""); setSpeechStatus(""); setSpeaking(false); setSaving(false); setSubmitted(false);
    submitting.current = false; setStage("intro");
  }

  function savePicture() {
    if (!snapshot || saving) return;
    setSaving(true); setSaveStatus("");
    const id = operation.current;
    try {
      const canvas = document.createElement("canvas");
      canvas.width = snapshot.pixels.width; canvas.height = snapshot.pixels.height;
      const context = canvas.getContext("2d");
      if (!context) throw new Error(t("sketchGame.canvasUnavailable"));
      context.putImageData(snapshot.pixels, 0, 0);
      canvas.toBlob((blob) => {
        if (id !== operation.current) return;
        setSaving(false);
        if (!blob) { setSaveStatus(t("sketchGame.couldnTSaveThePicturePleaseTry")); return; }
        const url = URL.createObjectURL(blob);
        downloadUrls.current.add(url);
        const link = document.createElement("a");
        link.href = url; link.download = `my-sketch-${caseFile.id}.png`;
        document.body.appendChild(link); link.click(); link.remove();
        // Older Safari needs the URL to remain alive until it consumes the download.
        setTimeout(() => { URL.revokeObjectURL(url); downloadUrls.current.delete(url); }, 60_000);
        setSaveStatus(t("sketchGame.yourPngIsReadyInYourDownloads"));
      }, "image/png");
    } catch { setSaving(false); setSaveStatus(t("sketchGame.couldnTSaveThePicturePleaseTry")); }
  }

  return (
    <section className="sk-game" aria-label={t("sketchGame.sketchArtist")}>
      {header === undefined ? <header className="sk-topbar">
        <button type="button" className="sk-back" onClick={back}><span aria-hidden="true">←</span> {t("activityHeader.back")}</button>
        <span className="sk-wordmark"><span className="sk-mark" aria-hidden="true">✎</span> {t("sketchGame.sketchArtist")}</span>
        <span className="sk-age">{t("sketchGame.ages68")}</span>
      </header> : header}
      {stage === "intro" && <div className="sk-intro">
        <div className="sk-intro-copy">
          <Mascot pose="point" size={64} />
          <p className="sk-eyebrow">{t("sketchGame.littleArtistsBigMysteries")}</p>
          <span className="sk-case-tag">{t("sketchGame.case")} {String(cases.findIndex((entry) => entry.id === caseFile.id) + 1).padStart(2, "0")} <span aria-hidden="true">/</span> {t("sketchGame.artDivision")}</span>
          <h1 className="sk-title" ref={headingRef} tabIndex={-1}><span className="sk-title-prefix">{t("sketchGame.caseFile")}</span> {caseFile.title}</h1>
          <p className="sk-lead">{t("sketchGame.aWitnessSawAMysteryHeroListen")}</p>
          <div className="sk-intro-facts"><span><b>{caseFile.clues.length}</b> {t("sketchGame.curiousClues")}</span><span><b>1</b> {t("sketchGame.mysteryHero")}</span><span><b>∞</b> {t("sketchGame.waysToDraw")}</span></div>
          <button type="button" className="sk-button sk-start" onClick={() => setStage("draw")}>{t("sketchGame.startTheCase")} <span aria-hidden="true">→</span></button>
          <p className="sk-small">{t("sketchGame.noPerfectDrawingsNeededJustYourImagination")}</p>
        </div>
        <div className="sk-case-cover" aria-hidden="true">
          <div className="sk-folder-tab">{t("sketchGame.topSecretIsh")}</div>
          <div className="sk-case-sheet">
            <div className="sk-evidence-heading"><span>{t("sketchGame.witnessNotes")}</span><span>01 / 06</span></div>
            <svg className="sk-mystery" viewBox="0 0 320 300" fill="none">
              <circle cx="156" cy="143" r="109" fill="#ece8f7" />
              <path d="M80 231q-7-84 77-86 83 2 81 86" fill="#c9c0e4" />
              <circle cx="158" cy="112" r="60" fill="#c9c0e4" />
              <path d="M141 94q0-20 20-19 29 3 11 27l-14 14v12" stroke="#fff" strokeWidth="12" strokeLinecap="round" />
              <circle cx="158" cy="150" r="7" fill="#fff" />
              <path d="m49 71 5-13 5 13 13 5-13 5-5 13-5-13-13-5Z" fill="#ecc45e" />
              <path d="m258 173 3-10 4 10 10 4-10 4-4 10-3-10-10-4Z" fill="#ecc45e" />
              <path d="M232 49l10-10m-3 27 15-1M61 202l-16 7" stroke="#9283be" strokeWidth="4" strokeLinecap="round" />
            </svg>
            <p className="sk-mystery-caption">{t("sketchGame.whoCouldItBe")}</p>
            <div className="sk-note-lines"><span /><span /><span /></div>
          </div>
          <span className="sk-case-stamp">{t("sketchGame.yourPencil")}<br />{t("sketchGame.yourHunch")}</span>
        </div>
        <div className="sk-how"><span><b>01</b> {t("sketchGame.listenToTheClues")}</span><span><b>02</b> {t("sketchGame.sketchYourHero")}</span><span><b>03</b> {t("sketchGame.revealTheMystery")}</span></div>
      </div>}
      {stage === "draw" && <>
        <div className="sk-page-heading"><div><p className="sk-eyebrow">{t("sketchGame.theInvestigation")}</p><h1 className="sk-section-title" ref={headingRef} tabIndex={-1}>{caseFile.title}</h1></div><span className="sk-case-tag">{t("sketchGame.caseInProgress")}</span></div>
        <div className="sk-workspace">
          <aside className="sk-clue-panel" aria-label={t("sketchGame.witnessClues")}>
            <div className="sk-clue-card">
              <Mascot pose="point" size={64} />
              <div className="sk-clue-heading"><span className="sk-eyebrow">{t("sketchGame.witnessSays")}</span><span className="sk-clue-count">{clueIndex + 1} / {caseFile.clues.length}</span></div>
              <div className="sk-progress" aria-label={t("sketchGame.clueOf", { value1: clueIndex + 1, value2: caseFile.clues.length })}>{caseFile.clues.map((entry, i) => <span key={entry.id} className={`sk-progress-dot${i <= clueIndex ? " sk-progress-read" : ""}`} />)}</div>
              <p className="sk-clue-text" aria-live="polite" aria-atomic="true">“{clue.text}”</p>
              <div className="sk-button-row">
                <button type="button" className="sk-button sk-secondary" onClick={() => void readClue()} disabled={!speak || speaking}><span aria-hidden="true">♫</span> {speaking ? t("sketchGame.reading") : t("sketchGame.hearIt")}</button>
                <button type="button" className="sk-button" disabled={lastClue} onClick={() => { setSpeaking(false); setClueIndex((index) => index + 1); }}>{lastClue ? t("sketchGame.allCluesRead") : t("sketchGame.nextClue")}<span aria-hidden="true"> →</span></button>
              </div>
              {!speak && <p className="sk-small">{t("sketchGame.textOnlyModeEveryClueIsHere")}</p>}
              {speechStatus && <p className="sk-notice" role="status">{speechStatus}</p>}
            </div>
            {clueIndex > 0 && <div className="sk-previous"><h2 className="sk-eyebrow">{t("sketchGame.yourClueNotes")}</h2><ol className="sk-clue-list">{caseFile.clues.slice(0, clueIndex).map((entry) => <li key={entry.id}>{entry.text}</li>)}</ol></div>}
            <div className="sk-tip"><span aria-hidden="true">✦</span><p>{t("sketchGame.everyArtistSeesThingsALittleDifferently")}</p></div>
          </aside>
          <div className="sk-canvas-column">
            <SketchCanvas ref={canvasRef} />
            <button type="button" className={`sk-button sk-done-drawing${lastClue ? " sk-ready" : ""}`} onClick={() => void compare()}>{t("sketchGame.iMDone")} <span aria-hidden="true">✓</span></button>
          </div>
        </div>
        <div className="sk-reference-source" ref={artRef} hidden>{Art && <Art />}</div>
      </>}
      {stage === "comparing" && <div className="sk-comparing" role="status" aria-live="polite">
        <span className="sk-compare-icon" aria-hidden="true">✦</span>
        <h1 className="sk-section-title" ref={headingRef} tabIndex={-1}>{t("sketchGame.comparing")}</h1>
        <p>{t("sketchGame.openingTheMysteryFileYourHeroIs")}</p>
        <div className="sk-compare-track"><span /></div>
      </div>}
      {stage === "reveal" && snapshot && <div className="sk-reveal">
        <Mascot pose="jump" size={72} />
        <div className="sk-result-heading"><p className="sk-eyebrow">{t("sketchGame.mysteryRevealed")}</p><h1 className="sk-title sk-result-title" ref={headingRef} tabIndex={-1}>{t("sketchGame.meet")} {caseFile.id === "gecko_hero" ? t("sketchGame.geckoHero") : caseFile.title}!</h1><p className="sk-lead">{t("sketchGame.twoPicturesOneBrilliantImagination")}</p></div>
        <div className="sk-pictures">
          <figure className="sk-picture"><figcaption><span>{t("sketchGame.yourMasterpiece")}</span><span className="sk-picture-tag">{t("sketchGame.theArtistYou")}</span></figcaption><img className="sk-result-image" src={snapshot.previewUrl} alt={t("sketchGame.yourDrawingOfTheMysteryHero")} /></figure>
          <figure className="sk-picture sk-original"><figcaption><span>{t("sketchGame.theMysteryHero")}</span><span className="sk-picture-tag">{t("sketchGame.caseSolved")}</span></figcaption>{Art ? <Art /> : <div className="sk-art-unavailable">{t("sketchGame.theOriginalIsTakingABreakCheck")}</div>}</figure>
        </div>
        <div className="sk-results-grid">
          <div className="sk-score-card">
            <p className="sk-eyebrow">{t("sketchGame.yourDetectiveReport")}</p>
            <p className="sk-match" aria-live="polite">{t("sketchGame.match")} <strong>{result.match}%</strong></p>
            <p className="sk-breakdown">{automatic === null ? t("sketchGame.clues", { value1: result.clues }) : t("sketchGame.colorsShapeClues", { automatic, value2: result.clues })}</p>
            <p className="sk-encouragement">{sketchEncouragement(result.match)}</p>
            <span className="sk-xp">✦ {result.points} XP</span>
            <p className="sk-small">{t("sketchGame.checkAllCluesFor4BonusXp", { value1: caseFile.checklist.length })}</p>
            {automatic === null && <p className="sk-notice">{t("sketchGame.weReUsingYourClueChecklistFor")}</p>}
            {stats.flooded && <p className="sk-small">{t("sketchGame.trySeparateShapesNextTimeAPage")}</p>}
            <p className="sk-small">{t("sketchGame.aPlayfulComparisonNotAGradeFor")}</p>
          </div>
          <fieldset className="sk-checklist"><legend>{t("sketchGame.didYouDraw")}</legend><p className="sk-small">{t("sketchGame.youKnowYourPictureBestTickThe")}</p>{caseFile.checklist.map((item, i) => <label key={item} className="sk-check-row"><input type="checkbox" checked={checked[i]} disabled={submitted} onChange={() => setChecked((previous) => previous.map((value, index) => index === i ? !value : value))} /><span>{item}</span></label>)}</fieldset>
        </div>
        <div className="sk-result-actions">
          <button type="button" className="sk-button sk-secondary" onClick={savePicture} disabled={saving}>{saving ? t("sketchGame.saving") : t("sketchGame.saveMyPicture")} <span aria-hidden="true">↓</span></button>
          <button type="button" className="sk-button sk-secondary" onClick={replay}>{t("balloonsGame.playAgain")} <span aria-hidden="true">↻</span></button>
          <button type="button" className="sk-button" disabled={submitted} onClick={() => { if (submitting.current) return; submitting.current = true; setSubmitted(true); onComplete(result.points); }}>{t("sketchGame.done")} <span aria-hidden="true">✓</span></button>
        </div>
        {saveStatus && <p className="sk-save-status" role="status">{saveStatus}</p>}
        <p className="sk-privacy">{t("sketchCanvas.yourDrawingStaysOnThisDevice")}</p>
      </div>}
    </section>
  );
}
