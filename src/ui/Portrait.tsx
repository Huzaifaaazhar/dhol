import { useEffect, useState } from 'react';
import type { Look } from '../game/data/characters';
import { runtime } from '../game/runtime';

type Mood = 'neutral' | 'shock' | 'angry' | 'happy' | 'confused' | 'sad';

/**
 * A little painted face for whoever is speaking, drawn from the same Look the 3D
 * figure uses, so the portrait always matches the person in the street. The
 * expression follows the speaker's live mood (set by emotes), and the mouth
 * moves while the line is still being typed.
 */
export function Portrait({ id, look, color, talking }: { id: string; look: Look; color: string; talking: boolean }) {
  const [mood, setMood] = useState<Mood>('neutral');
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const t = window.setInterval(() => {
      const ex = runtime.expr.get(id);
      setMood(ex && ex.until > performance.now() ? ex.mood : 'neutral');
      setOpen((o) => (talking ? !o : false));
    }, 140);
    return () => window.clearInterval(t);
  }, [id, talking]);

  const x = look.extras ?? [];
  const browL = mood === 'angry' ? 'M30 38 L42 42' : mood === 'sad' ? 'M30 42 L42 38' : mood === 'shock' ? 'M30 34 L42 34' : mood === 'confused' ? 'M30 33 L42 36' : 'M30 39 L42 39';
  const browR = mood === 'angry' ? 'M70 38 L58 42' : mood === 'sad' ? 'M70 42 L58 38' : mood === 'shock' ? 'M70 34 L58 34' : mood === 'confused' ? 'M70 40 L58 40' : 'M70 39 L58 39';
  const eyeR = mood === 'shock' ? 5 : mood === 'happy' ? 3 : 4;
  let mouth: React.ReactNode;
  if (open) mouth = <ellipse cx="50" cy="70" rx="6" ry="5" fill="#5a1e22" />;
  else if (mood === 'shock') mouth = <ellipse cx="50" cy="71" rx="5" ry="6" fill="#5a1e22" />;
  else if (mood === 'happy') mouth = <path d="M38 66 Q50 78 62 66 Z" fill="#5a1e22" />;
  else if (mood === 'sad') mouth = <path d="M40 72 Q50 64 60 72" stroke="#5a1e22" strokeWidth="3" fill="none" strokeLinecap="round" />;
  else if (mood === 'angry') mouth = <path d="M41 70 L59 70" stroke="#5a1e22" strokeWidth="3.5" strokeLinecap="round" />;
  else mouth = <path d="M41 68 Q50 73 59 68" stroke="#5a1e22" strokeWidth="3" fill="none" strokeLinecap="round" />;

  const hair = () => {
    const h = look.hair;
    switch (look.hairStyle) {
      case 'bald':
        return <path d="M22 46 Q20 34 26 30 M78 46 Q80 34 74 30" stroke={h} strokeWidth="5" fill="none" />;
      case 'puff':
      case 'curly':
        return (
          <g fill={h}>
            {[22, 32, 42, 52, 62, 72, 78].map((cx, i) => (
              <circle key={i} cx={cx} cy={i % 2 ? 22 : 26} r="10" />
            ))}
          </g>
        );
      case 'cap':
        return <path d="M20 36 Q22 14 50 13 Q78 14 80 36 L92 38 L80 40 Z" fill="#c53a2a" />;
      case 'topi':
        return <path d="M28 28 L30 14 L70 14 L72 28 Z" fill="#f4efe2" stroke="#d7cfba" />;
      case 'bun':
        return (
          <g fill={h}>
            <path d="M20 42 Q20 16 50 16 Q80 16 80 42 Q70 26 50 26 Q30 26 20 42 Z" />
            <circle cx="50" cy="12" r="9" />
          </g>
        );
      case 'braid':
        return (
          <g fill={h}>
            <path d="M20 46 Q20 16 50 16 Q80 16 80 46 Q74 26 50 26 Q26 26 20 46 Z" />
            <rect x="74" y="40" width="7" height="40" rx="3.5" />
          </g>
        );
      default:
        return <path d="M20 42 Q18 15 50 15 Q82 15 80 42 Q72 24 46 26 Q30 27 20 42 Z" fill={h} />;
    }
  };

  return (
    <svg className="portrait" viewBox="0 0 100 100" aria-hidden style={{ ['--c' as string]: color }}>
      <circle cx="50" cy="50" r="48" fill={color} />
      <ellipse cx="50" cy="52" rx="30" ry="33" fill={look.skin} />
      <ellipse cx="20" cy="54" rx="5" ry="8" fill={look.skin} />
      <ellipse cx="80" cy="54" rx="5" ry="8" fill={look.skin} />
      {hair()}
      {x.includes('beard') && <path d="M24 58 Q26 88 50 88 Q74 88 76 58 Q70 76 50 76 Q30 76 24 58 Z" fill={look.hair} />}
      <path d={browL} stroke={look.hair === '#f1f1f1' ? '#ccc' : look.hair} strokeWidth="4" strokeLinecap="round" />
      <path d={browR} stroke={look.hair === '#f1f1f1' ? '#ccc' : look.hair} strokeWidth="4" strokeLinecap="round" />
      <circle cx="36" cy="49" r={eyeR + 3} fill="#fff" />
      <circle cx="64" cy="49" r={eyeR + 3} fill="#fff" />
      <circle cx="36" cy="49" r={eyeR} fill="#1b1310" />
      <circle cx="64" cy="49" r={eyeR} fill="#1b1310" />
      {x.includes('glasses') && (
        <g stroke="#2a2420" strokeWidth="2.5" fill="none">
          <circle cx="36" cy="49" r="10" />
          <circle cx="64" cy="49" r="10" />
          <path d="M46 49 L54 49" />
        </g>
      )}
      {x.includes('shades') && (
        <g fill="#14110f">
          <rect x="24" y="42" width="22" height="13" rx="4" />
          <rect x="54" y="42" width="22" height="13" rx="4" />
          <rect x="44" y="45" width="12" height="3" />
        </g>
      )}
      <path d="M50 52 Q46 62 51 62" stroke="#00000033" strokeWidth="3" fill="none" strokeLinecap="round" />
      {x.includes('moustache') && <path d="M36 64 Q50 58 64 64 Q50 63 36 64 Z" fill={look.hair} stroke={look.hair} strokeWidth="3" />}
      {mouth}
      {(mood === 'happy' || mood === 'shock') && <circle cx="28" cy="62" r="5" fill="#ff7a7a55" />}
      {(mood === 'happy' || mood === 'shock') && <circle cx="72" cy="62" r="5" fill="#ff7a7a55" />}
      {mood === 'sad' && <path d="M68 56 Q66 62 68 64 Q70 62 68 56 Z" fill="#7fd0ff" />}
    </svg>
  );
}
