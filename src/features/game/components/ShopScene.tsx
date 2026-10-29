import { useState } from 'react';
import ShopInterior3D from './ShopInterior3D';
import { DIALOGS, EXTRAS, ITEMS, ITEMS_BY_ID, SHOP_NAMES, fill } from '../content';
import { needAmount, numberWord } from '../logic/pricing';
import type { Action } from '../state/reducer';
import type { GameState, Item } from '../state/types';
import BlankChoices from './BlankChoices';
import QuantityFocus from './QuantityFocus';
import { needLabel } from './Cart';

const Bubble = ({ children }: { children: React.ReactNode }) => (
  <div className="max-w-[90%] self-start rounded-2xl rounded-bl-none bg-white px-4 py-2 text-lg shadow">{children}</div>
);
const Btn = ({ onClick, children }: { onClick: () => void; children: React.ReactNode }) => (
  <button onClick={onClick} className="rounded-xl bg-indigo-600 px-4 py-3 text-lg font-semibold text-white active:scale-95">
    {children}
  </button>
);

export default function ShopScene({ state, dispatch }: { state: GameState; dispatch: (a: Action) => void }) {
  const [showList, setShowList] = useState(false);
  const p = state.phase;
  if (p.name !== 'shop') return null;
  const shopName = SHOP_NAMES[p.shop];
  const item = p.itemId ? ITEMS_BY_ID[p.itemId] : undefined;
  const vars = { shop: shopName, item: item?.id ?? '', singular: item?.singular ?? '' };
  const key = `${p.step}-${p.sub}-${p.itemId}-${state.cart.length}`;
  const answer = (weight: 'main' | 'chat') => (correct: boolean) => dispatch({ type: 'ANSWER_BLANK', correct, weight });

  const highlights = ITEMS.filter((i) => i.shop === p.shop && !state.needs.some((n) => n.itemId === i.id));

  let body: React.ReactNode = null;
  switch (p.step) {
    case 'enter':
      body = (
        <>
          <Bubble>{fill(DIALOGS.welcome, vars)}</Bubble>
          <Btn onClick={() => dispatch({ type: 'NEXT' })}>Next ▶</Btn>
          <button className="text-sm text-slate-500 underline" onClick={() => dispatch({ type: 'LEAVE_SHOP' })}>
            Back to the street
          </button>
        </>
      );
      break;
    case 'greet':
      body = (
        <BlankChoices key={key} seller={DIALOGS.greetSeller} player={DIALOGS.greet.player} options={DIALOGS.greet.options} correct={DIALOGS.greet.correct} hint={DIALOGS.greet.hint} onAnswer={answer('chat')} />
      );
      break;
    case 'pick': {
      const chip = (i: Item) => (
        <button key={i.id} onClick={() => { setShowList(false); dispatch({ type: 'PICK_ITEM', itemId: i.id }); }} className="flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-left active:scale-95">
          <span className="text-3xl">{i.icon}</span>
          <span className="text-sm leading-tight">
            <b>{i.id}</b>
            <br />R$ {i.price}
            {i.kind === 'uncountable' ? ' (a little)' : ' each'}
          </span>
        </button>
      );
      body = showList ? (
        <>
          <Bubble>{DIALOGS.greetAfter}</Bubble>
          <p className="text-sm font-bold text-slate-600">Ask the seller for…</p>
          <div className="grid grid-cols-2 gap-2">
            {state.needs.map((n) => {
              const got = state.cart.some((l) => l.itemId === n.itemId);
              return (
                <div key={n.itemId} className={got ? 'opacity-50' : ''}>
                  {chip(ITEMS_BY_ID[n.itemId])}
                  <p className="mt-0.5 text-xs text-slate-600">{got ? '✅ ' : ''}{needLabel(n)}</p>
                </div>
              );
            })}
          </div>
          {highlights.length > 0 && (
            <>
              <p className="text-sm font-bold text-slate-600">Also at the {shopName}</p>
              <div className="grid grid-cols-2 gap-2">{highlights.map(chip)}</div>
            </>
          )}
          <button className="text-sm text-slate-500 underline" onClick={() => setShowList(false)}>Back to the shop</button>
        </>
      ) : (
        <>
          <p className="text-center text-sm text-slate-600">{DIALOGS.greetAfter}</p>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => setShowList(true)} className="rounded-xl bg-indigo-600 px-3 py-3 font-semibold text-white active:scale-95">💬 Ask the seller</button>
            <button onClick={() => dispatch({ type: 'LEAVE_SHOP' })} className="rounded-xl bg-slate-200 px-3 py-3 font-semibold active:scale-95">🚪 Back to the street</button>
          </div>
        </>
      );
      break;
    }
    case 'wrongShop':
      body = (
        <>
          <Bubble>{fill(DIALOGS.wrongShop, vars)}</Bubble>
          {state.wrongShopStreak >= 2 && item && <Bubble>{fill(DIALOGS.tryShop, { shop: SHOP_NAMES[item.shop] })}</Bubble>}
          <Btn onClick={() => dispatch({ type: 'NEXT' })}>OK</Btn>
        </>
      );
      break;
    case 'ask': {
      const d = DIALOGS.ask[item!.kind];
      body = <BlankChoices key={key} seller={fill(d.seller, vars)} options={d.options} correct={d.correct} hint={fill(d.hint, vars)} onAnswer={answer('main')} />;
      break;
    }
    case 'quantity':
      body = <QuantityFocus key={key} item={item!} onChoose={(amount) => dispatch({ type: 'CHOOSE_AMOUNT', amount })} />;
      break;
    case 'confirm': {
      const last = state.cart[state.cart.length - 1];
      const need = state.needs.find((n) => n.itemId === last?.itemId);
      const mismatch = need && last && needAmount(need) !== last.amount;
      if (p.sub === 0 && state.extraId !== null) {
        const e = EXTRAS[state.extraId];
        const ev = { ...vars, item: last ? ITEMS_BY_ID[last.itemId].id : '', singular: last ? ITEMS_BY_ID[last.itemId].singular : '', qtyWord: typeof last?.amount === 'number' ? numberWord(last.amount) : '' };
        body = (
          <BlankChoices key={key} seller={e.seller ? fill(e.seller, ev) : undefined} player={e.player ? fill(e.player, ev) : undefined} options={e.options.map((o) => fill(o, ev))} correct={fill(e.correct, ev)} hint={e.hint} onAnswer={answer('chat')} />
        );
      } else {
        body = (
          <>
            <Bubble>{DIALOGS.here}</Bubble>
            {mismatch && <p className="rounded-lg bg-amber-100 p-2 text-sm text-amber-900">💡 {DIALOGS.listHint}</p>}
            <Btn onClick={() => dispatch({ type: 'NEXT' })}>Next ▶</Btn>
          </>
        );
      }
      break;
    }
    case 'more':
      body = (
        <>
          <Bubble>{DIALOGS.more}</Bubble>
          <div className="grid grid-cols-2 gap-2">
            <Btn onClick={() => dispatch({ type: 'ASK_MORE', more: true })}>{DIALOGS.yes}</Btn>
            <Btn onClick={() => dispatch({ type: 'ASK_MORE', more: false })}>{DIALOGS.no}</Btn>
          </div>
        </>
      );
      break;
    case 'bye': {
      const d = DIALOGS.bye[p.sub] as { player?: string; seller?: string; options: string[]; correct: string; hint: string };
      body = <BlankChoices key={key} seller={d.seller} player={d.player} options={d.options} correct={d.correct} hint={d.hint} onAnswer={answer('chat')} />;
      break;
    }
  }

  const held = p.step === 'ask' || p.step === 'quantity' ? p.itemId : undefined;
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ShopInterior3D
        place={p.shop}
        interactive={p.step === 'pick' && !showList}
        heldId={held}
        onPick={(id) => dispatch({ type: 'PICK_ITEM', itemId: id })}
        onExit={() => dispatch({ type: 'LEAVE_SHOP' })}
      />
      <div className="flex max-h-[55%] flex-col gap-2 overflow-auto rounded-t-3xl bg-white p-3 shadow-[0_-4px_12px_rgba(0,0,0,.2)]">{body}</div>
    </div>
  );
}
