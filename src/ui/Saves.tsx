import { useState } from 'react';
import { listSlots, saveToSlot, loadSlot, deleteSlot, timeAgo } from '../game/saves';
import { stopRhythm, sfx } from '../game/audio';
import { toast } from '../game/store';

/** Three manual save slots. `canSave` is false on the title screen. */
export function SlotList({ canSave }: { canSave: boolean }) {
  const [, refresh] = useState(0);
  const [confirmDel, setConfirmDel] = useState<number | null>(null);
  const slots = listSlots();
  return (
    <ul className="slots">
      {slots.map(({ n, slot }) => (
        <li key={n} className={`slot ${slot ? '' : 'is-empty'}`}>
          <div className="slot-info">
            <span className="slot-n">Slot {n}</span>
            {slot ? (
              <>
                <span className="slot-mission">{slot.meta.mission}</span>
                <span className="slot-meta">
                  Part {slot.meta.part} · {slot.meta.scene} · {timeAgo(slot.meta.savedAt)}
                </span>
              </>
            ) : (
              <span className="slot-meta">Empty</span>
            )}
          </div>
          <div className="slot-actions">
            {canSave && (
              <button
                className="btn"
                onClick={() => {
                  if (saveToSlot(n)) {
                    sfx('success');
                    toast(`Saved to slot ${n}`, 'objective');
                  } else toast('Could not save: this browser is blocking storage', 'fail');
                  refresh((x) => x + 1);
                }}
              >
                {slot ? 'Overwrite' : 'Save here'}
              </button>
            )}
            {slot && (
              <button
                className={canSave ? 'btn ghost' : 'btn'}
                onClick={() => {
                  stopRhythm();
                  sfx('select');
                  loadSlot(n);
                }}
              >
                Load
              </button>
            )}
            {slot && (
              <button
                className="btn ghost danger"
                onClick={() => {
                  if (confirmDel !== n) return setConfirmDel(n);
                  deleteSlot(n);
                  setConfirmDel(null);
                  refresh((x) => x + 1);
                }}
              >
                {confirmDel === n ? 'Sure?' : 'Delete'}
              </button>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
