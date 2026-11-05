import { api } from '../features/match/api';
import { useMatchStore } from '../features/match/hooks';

/** Shows whether players are really connected in real time. */
export default function ConnectionBadge() {
  const { error, realtime, snap } = useMatchStore();
  let text = '🟡 Modo de teste local: só neste navegador (configure o Supabase para jogar em vários aparelhos)';
  let cls = 'bg-amber-100 text-amber-900';
  if (api.mode === 'supabase') {
    if (error && !snap) [text, cls] = [`🔴 Sem acesso ao Supabase: ${error}`, 'bg-red-100 text-red-800'];
    else if (realtime === 'SUBSCRIBED') [text, cls] = ['🟢 Ao vivo: tempo real conectado', 'bg-green-100 text-green-800'];
    else [text, cls] = [`🟠 Conectado; tempo real: ${realtime.toLowerCase()} (atualiza a cada 2 s)`, 'bg-orange-100 text-orange-800'];
  }
  return <p className={`mx-auto my-2 max-w-md rounded-lg px-3 py-1 text-center text-sm ${cls}`}>{text}</p>;
}
