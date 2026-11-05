import Tr from '../../../ui/Tr';
import { DIALOGS, ITEMS_BY_ID, PT, fill } from '../content';
import { cartTotal, numberToWords } from '../logic/pricing';
import type { Action } from '../state/reducer';
import type { GameState } from '../state/types';
import BlankChoices from './BlankChoices';
import ShopInterior3D from './ShopInterior3D';
import { serverNow } from '../../match/hooks';

export default function Checkout({ state, dispatch }: { state: GameState; dispatch: (a: Action) => void }) {
  const p = state.phase;
  if (p.name !== 'checkout') return null;
  const total = cartTotal(state.cart, ITEMS_BY_ID);
  const C = DIALOGS.checkout;
  const CP = PT.checkout;
  const answer = (weight: 'main' | 'chat') => (correct: boolean) => dispatch({ type: 'ANSWER_BLANK', correct, weight });

  let body: React.ReactNode;
  if (p.sub === 0)
    body = (
      <>
        <div className="max-w-[90%] rounded-2xl rounded-bl-none bg-white px-4 py-2 text-lg shadow">
          {C.hello}
          <Tr text={CP.hello} />
        </div>
        <button onClick={() => dispatch({ type: 'NEXT' })} className="rounded-xl bg-indigo-600 px-4 py-3 text-lg font-semibold text-white">Próximo ▶</button>
      </>
    );
  else if (p.sub === 1)
    body = <BlankChoices key="c1" player={C.how.player} playerPt={CP.how.player} options={C.how.options} correct={C.how.correct} hint={C.how.hint} onAnswer={answer('main')} />;
  else if (p.sub === 2)
    body = (
      <BlankChoices key="c2" seller={fill(C.price.seller, { totalWords: numberToWords(total) })} sellerPt={fill(CP.price.seller, { total })} player={C.price.player} playerPt={CP.price.player} options={C.price.options} correct={C.price.correct} hint={C.price.hint} onAnswer={answer('main')} />
    );
  else if (p.sub === 3)
    body = (
      <>
        <div className={`rounded-xl p-4 text-center text-xl font-bold ${total > state.wallet ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-800'}`}>
          Total R$ {total} · Carteira R$ {state.wallet}
        </div>
        <button onClick={() => dispatch({ type: 'PAY', now: serverNow() })} className="rounded-xl bg-green-600 px-4 py-4 text-xl font-bold text-white active:scale-95">
          💵 Pagar <span className="text-base font-normal">(Pay)</span>
        </button>
      </>
    );
  else
    body = <BlankChoices key="c4" seller={C.sorry.seller} sellerPt={CP.sorry.seller} options={C.sorry.options} correct={C.sorry.correct} hint={C.sorry.hint} onAnswer={answer('chat')} />;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ShopInterior3D place="checkout" interactive={false} cart={state.cart} />
      <div className="flex flex-col gap-2 rounded-t-3xl bg-white/95 p-3">{body}</div>
    </div>
  );
}
