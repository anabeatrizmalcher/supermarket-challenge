import { useLang } from '../lib/lang';

/** Portuguese translation line, shown only when the 🇧🇷 switch is on. */
export default function Tr({ text, className = '' }: { text?: string; className?: string }) {
  const on = useLang((s) => s.showPt);
  if (!on || !text) return null;
  return <span className={`mt-0.5 block text-sm italic text-slate-500 ${className}`}>🇧🇷 {text}</span>;
}
