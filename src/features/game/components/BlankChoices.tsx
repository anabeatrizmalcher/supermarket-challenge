import { useEffect, useMemo, useRef, useState } from 'react';
import { shuffle } from '../../../lib/prng';

interface Props {
  seller?: string;
  player?: string;
  options: string[];
  correct: string;
  hint: string;
  onAnswer: (correct: boolean) => void;
}

function Line({ text, filled, who }: { text: string; filled: string | null; who: 'seller' | 'player' }) {
  const [a, b] = text.split('___');
  const bubble = who === 'seller' ? 'bg-white self-start rounded-bl-none' : 'bg-sky-100 self-end rounded-br-none';
  return (
    <div className={`max-w-[90%] rounded-2xl px-4 py-2 text-lg shadow ${bubble}`}>
      {b === undefined ? (
        text
      ) : (
        <>
          {a}
          <span className={`inline-block min-w-14 border-b-2 border-slate-500 text-center font-bold ${filled ? 'text-green-700' : ''}`}>
            {filled ?? '\u00A0'}
          </span>
          {b}
        </>
      )}
    </div>
  );
}

/** A dialogue exchange with one blank: shuffled options, hint in Portuguese on a mistake. */
export default function BlankChoices({ seller, player, options, correct, hint, onAnswer }: Props) {
  const shuffled = useMemo(() => shuffle(options), [options.join('|')]); // eslint-disable-line
  const [wrong, setWrong] = useState<string[]>([]);
  const [done, setDone] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => () => clearTimeout(timer.current), []);

  const pick = (o: string) => {
    if (done) return;
    if (o === correct) {
      setDone(o);
      timer.current = setTimeout(() => onAnswer(true), 600);
    } else {
      setWrong((w) => [...w, o]);
      onAnswer(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {seller && <Line text={seller} who="seller" filled={done} />}
      {player && <Line text={player} who="player" filled={done} />}
      <div className="mt-2 grid grid-cols-2 gap-2">
        {shuffled.map((o) => (
          <button
            key={o}
            disabled={wrong.includes(o) || !!done}
            onClick={() => pick(o)}
            className={`rounded-xl px-3 py-3 text-lg font-semibold text-white active:scale-95 ${
              wrong.includes(o) ? 'bg-red-300' : done === o ? 'bg-green-600' : 'bg-indigo-600'
            }`}
          >
            {o}
          </button>
        ))}
      </div>
      {wrong.length > 0 && !done && (
        <p className="rounded-lg bg-amber-100 p-2 text-sm text-amber-900">💡 {hint}</p>
      )}
    </div>
  );
}
