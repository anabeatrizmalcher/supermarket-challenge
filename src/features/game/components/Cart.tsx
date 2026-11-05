import { useLang } from '../../../lib/lang';
import { ITEMS_BY_ID } from '../content';
import { amountLabel, cartTotal, lineCost, needAmount } from '../logic/pricing';
import { PORTION_PT, numberPt } from '../content';
import type { Amount, GameState } from '../state/types';

const amountPt = (a: Amount) => (typeof a === 'number' ? numberPt(a) : PORTION_PT[a]);

/** "🍎 3 apples" (+ "(maçãs)" when the translation switch is on) */
export function NeedText({ n }: { n: GameState['needs'][number] }) {
  const showPt = useLang((s) => s.showPt);
  const item = ITEMS_BY_ID[n.itemId];
  return (
    <>
      {item.icon} {needAmount(n)} {item.id}
      {showPt && <span className="text-sm italic text-slate-500"> ({amountPt(needAmount(n))} {item.pt})</span>}
    </>
  );
}

/** Shopping list + cart, wallet and total (always visible). */
export default function Cart({ state, onClose }: { state: GameState; onClose: () => void }) {
  const total = cartTotal(state.cart, ITEMS_BY_ID);
  const over = total > state.wallet;
  const showPt = useLang((s) => s.showPt);
  return (
    <div className="fixed inset-0 z-30 flex items-end bg-black/50" onClick={onClose}>
      <div className="max-h-[85%] w-full overflow-auto rounded-t-3xl bg-white p-4" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-bold">🛒 Lista de compras <span className="text-base font-normal text-slate-500">(Shopping list)</span></h2>
        <ul className="mt-2 space-y-1 text-lg">
          {state.needs.map((n) => {
            const got = state.cart.some((l) => l.itemId === n.itemId);
            return (
              <li key={n.itemId} className={got ? 'text-green-700' : ''}>
                {got ? '✅' : '⬜'} <NeedText n={n} />
              </li>
            );
          })}
        </ul>
        <h2 className="mt-4 text-xl font-bold">No seu carrinho <span className="text-base font-normal text-slate-500">(In your cart)</span></h2>
        {state.cart.length === 0 && <p className="text-slate-500">Nada ainda.</p>}
        <ul className="mt-2 space-y-1">
          {state.cart.map((l, i) => (
            <li key={i} className="flex justify-between gap-2">
              <span>
                {ITEMS_BY_ID[l.itemId].icon} {amountLabel(ITEMS_BY_ID[l.itemId], l.amount)}
                {showPt && <span className="text-sm italic text-slate-500"> ({amountPt(l.amount)} {ITEMS_BY_ID[l.itemId].pt})</span>}
              </span>
              <span className="whitespace-nowrap">R$ {lineCost(ITEMS_BY_ID[l.itemId], l.amount)}</span>
            </li>
          ))}
        </ul>
        <div className={`mt-4 flex justify-between rounded-xl p-3 text-lg font-bold ${over ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-800'}`}>
          <span>Total R$ {total}</span>
          <span>Carteira R$ {state.wallet}</span>
        </div>
        {over && <p className="mt-1 text-sm text-red-700">Cuidado: o total passou do dinheiro que você tem.</p>}
        <p className="mt-2 text-sm text-slate-500">Atenção: a loja não aceita devolução.</p>
        <button onClick={onClose} className="mt-3 w-full rounded-xl bg-slate-800 py-3 text-white">
          Fechar
        </button>
      </div>
    </div>
  );
}
