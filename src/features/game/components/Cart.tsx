import { ITEMS_BY_ID } from '../content';
import { amountLabel, cartTotal, lineCost, needAmount } from '../logic/pricing';
import type { GameState } from '../state/types';

export function needLabel(n: GameState['needs'][number]) {
  const item = ITEMS_BY_ID[n.itemId];
  return `${item.icon} ${typeof needAmount(n) === 'number' ? needAmount(n) : needAmount(n)} ${item.id}`;
}

/** Shopping list + cart, wallet and total (always visible: decision O2). */
export default function Cart({ state, onClose }: { state: GameState; onClose: () => void }) {
  const total = cartTotal(state.cart, ITEMS_BY_ID);
  const over = total > state.wallet;
  return (
    <div className="fixed inset-0 z-30 flex items-end bg-black/50" onClick={onClose}>
      <div className="max-h-[85%] w-full overflow-auto rounded-t-3xl bg-white p-4" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-bold">🛒 Shopping list</h2>
        <ul className="mt-2 space-y-1">
          {state.needs.map((n) => {
            const got = state.cart.some((l) => l.itemId === n.itemId);
            return (
              <li key={n.itemId} className={got ? 'text-green-700' : ''}>
                {got ? '✅' : '⬜'} {needLabel(n)}
              </li>
            );
          })}
        </ul>
        <h2 className="mt-4 text-xl font-bold">In your cart</h2>
        {state.cart.length === 0 && <p className="text-slate-500">Nothing yet.</p>}
        <ul className="mt-2 space-y-1">
          {state.cart.map((l, i) => (
            <li key={i} className="flex justify-between">
              <span>
                {ITEMS_BY_ID[l.itemId].icon} {amountLabel(ITEMS_BY_ID[l.itemId], l.amount)}
              </span>
              <span>R$ {lineCost(ITEMS_BY_ID[l.itemId], l.amount)}</span>
            </li>
          ))}
        </ul>
        <div className={`mt-4 flex justify-between rounded-xl p-3 text-lg font-bold ${over ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-800'}`}>
          <span>Total R$ {total}</span>
          <span>Wallet R$ {state.wallet}</span>
        </div>
        <p className="mt-2 text-xs text-slate-500">No returns: the shop does not accept items back.</p>
        <button onClick={onClose} className="mt-3 w-full rounded-xl bg-slate-800 py-3 text-white">
          Close
        </button>
      </div>
    </div>
  );
}
