import { useEffect, useRef, useState } from 'react';
import Tr from '../../../ui/Tr';
import { CONFIG } from '../content/config';
import { DIALOGS, PORTION_PT, PT, fill } from '../content';
import type { Amount, Item } from '../state/types';

const PORTIONS = ['a few', 'a little', 'some', 'a lot of'] as const;

export default function QuantityFocus({
  item,
  onChoose,
}: {
  item: Item;
  onChoose: (a: Amount | 'a few') => void;
}) {
  const [hint, setHint] = useState(false);
  const [chosen, setChosen] = useState<string | number | null>(null);
  const [locked, setLocked] = useState(false); // after a valid choice, ignore further taps
  const timer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => () => clearTimeout(timer.current), []);
  const sentence = fill(DIALOGS.quantityPlayer, { item: item.id }).split('___');

  const choose = (a: Amount | 'a few') => {
    if (locked) return;
    setChosen(a);
    if (a === 'a few') {
      setHint(true);
      onChoose(a);
      return;
    }
    setLocked(true);
    timer.current = setTimeout(() => onChoose(a), 500);
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="text-7xl" aria-hidden>
        {item.kind === 'countable' ? '🧺' : ''}
        {item.icon}
      </div>
      <p className="rounded-2xl bg-sky-100 px-4 py-2 text-center text-lg shadow">
        {sentence[0]}
        <b className="inline-block min-w-12 border-b-2 border-slate-500 text-center">{chosen ?? '\u00A0'}</b>
        {sentence[1]}
        <Tr text={fill(PT.quantityPlayer, { itemPt: item.pt })} />
      </p>
      {item.kind === 'countable' ? (
        <div className="grid grid-cols-4 gap-2">
          {Array.from({ length: CONFIG.maxQty }, (_, i) => i + 1).map((n) => (
            <button key={n} disabled={locked} onClick={() => choose(n)} className={`h-14 w-14 rounded-xl text-2xl font-bold text-white active:scale-95 ${chosen === n ? 'bg-green-600' : 'bg-indigo-600'} disabled:opacity-60`}>
              {n}
            </button>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {PORTIONS.map((p) => (
            <button key={p} disabled={locked} onClick={() => choose(p)} className={`rounded-xl px-4 py-3 text-lg font-semibold text-white active:scale-95 ${chosen === p ? 'bg-green-600' : 'bg-indigo-600'} disabled:opacity-60`}>
              {p}
              <Tr text={PORTION_PT[p]} className="!text-white/80 !not-italic" />
            </button>
          ))}
        </div>
      )}
      {hint && <p className="rounded-lg bg-amber-100 p-2 text-sm text-amber-900">💡 {fill(DIALOGS.quantityHintFew, { item: item.id })}</p>}
    </div>
  );
}
