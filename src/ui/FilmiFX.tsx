import { useEffect, useState } from 'react';
import { onFilmi, type FilmiEvent } from '../game/filmi';

/** Comic word bursts, a reveal vignette and the blast flash, laid over the 3D view. */
export function FilmiFX() {
  const [fx, setFx] = useState<FilmiEvent | null>(null);
  useEffect(
    () =>
      onFilmi((e) => {
        setFx(e);
        window.setTimeout(() => setFx((cur) => (cur?.id === e.id ? null : cur)), e.kind === 'reveal' ? 1600 : 1100);
      }),
    [],
  );
  if (!fx) return null;
  return (
    <div className={`filmi filmi-${fx.kind}`} key={fx.id} aria-hidden>
      {fx.kind === 'blast' && <div className="filmi-flash" />}
      {fx.kind === 'reveal' && <div className="filmi-vignette" />}
      {fx.word && (
        <div className="filmi-burst" style={{ ['--r' as string]: `${(fx.id % 2 ? -1 : 1) * (6 + (fx.id % 5))}deg` }}>
          <svg viewBox="0 0 200 120" className="filmi-star">
            <polygon points="100,2 118,34 160,10 144,46 198,48 152,66 186,100 134,84 120,118 100,88 80,118 66,84 14,100 48,66 2,48 56,46 40,10 82,34" />
          </svg>
          <span>{fx.word}</span>
        </div>
      )}
    </div>
  );
}
