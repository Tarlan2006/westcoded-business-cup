import { t } from "../i18n/index";
import { useEffect, useState, type ReactNode } from 'react';
import { ambienceThemes, type AmbienceTheme } from '../audio/ambienceThemes';
import { setMusic, unlock } from '../audio/engine';
import { useSoundEnabled } from '../audio/sfx';
import { useMusicPause } from '../audio/useMusicPause';
import './ambience.css';

export function PrototypeFrame({ children, theme = 'calm', music = false, paused = false }: {
  children: ReactNode; theme?: AmbienceTheme; music?: boolean; paused?: boolean;
}) {
  const sound = useSoundEnabled();
  const [enabled, setEnabled] = useState(() => {
    try { return localStorage.getItem('mypal.music') !== 'off'; } catch { return true; }
  });
  const [hidden, setHidden] = useState(() => document.hidden);
  useEffect(() => {
    const update = () => setHidden(document.hidden);
    document.addEventListener('visibilitychange', update);
    return () => document.removeEventListener('visibilitychange', update);
  }, []);
  useMusicPause(hidden || paused);
  useEffect(() => {
    setMusic(music && enabled && sound && !paused && !hidden, { theme, duck: true });
    return () => setMusic(false);
  }, [music, enabled, sound, theme, paused, hidden]);
  function toggle() {
    const next = !enabled;
    setEnabled(next);
    try { localStorage.setItem('mypal.music', next ? 'on' : 'off'); } catch { /* Tab-local preference still works. */ }
    if (next && sound) void unlock().catch(() => {});
  }
  return <div className="prototype min-h-svh" data-ambience={theme} data-ambience-paused={hidden || paused || undefined}>
    <div className="amb-scene" aria-hidden="true">
      {ambienceThemes[theme].marks.map((mark, i) => <span className={`amb-mark amb-mark-${i}`} key={`${theme}-${i}`}>{mark}</span>)}
    </div>
    {music && <div className="amb-controls"><button type="button" className="amb-music-button" aria-pressed={enabled && sound}
      disabled={!sound} title={sound ? t("prototypeFrame.backgroundMusic") : t("prototypeFrame.turnSoundOnToEnableBackgroundMusic")} onClick={toggle}>
      <span aria-hidden="true">♫</span> {t("prototypeFrame.music")} {enabled && sound ? 'on' : 'off'}
    </button></div>}
    {children}
  </div>;
}
