import { useEffect, useRef } from 'react';
import { pauseMusic } from './engine';

/** Each consumer owns its pause, so leaving a dialog cannot unmute a microphone. */
export function useMusicPause(paused: boolean) {
  const owner = useRef(Symbol('music-pause'));
  useEffect(() => {
    const key = owner.current;
    pauseMusic(key, paused);
    return () => pauseMusic(key, false);
  }, [paused]);
}
