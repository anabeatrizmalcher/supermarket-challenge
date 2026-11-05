import { useLang } from '../lib/lang';

export default function LangToggle({ className = '' }: { className?: string }) {
  const { showPt, toggle } = useLang();
  return (
    <button
      onClick={toggle}
      aria-pressed={showPt}
      className={`rounded-lg px-3 py-1 text-sm font-semibold ${showPt ? 'bg-green-500 text-white' : 'bg-slate-200 text-slate-700'} ${className}`}
    >
      🇧🇷 {showPt ? 'Tradução: ligada' : 'Tradução: desligada'}
    </button>
  );
}
