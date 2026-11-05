import { useState } from 'react';
import Tr from '../../../ui/Tr';
import { DIALOGS, EXTRAS, ITEMS, ITEMS_BY_ID, PT, SHOP_NAMES, SHOP_PT, fill, howManyPt, numberPt } from '../content';
import { needAmount, numberWord } from '../logic/pricing';
import type { Action } from '../state/reducer';
import type { GameState, Item } from '../state/types';
import BlankChoices from './BlankChoices';
import { NeedText } from './Cart';
import QuantityFocus from './QuantityFocus';
import ShopInterior3D from './ShopInterior3D';

const Bubble = ({ children, pt }: { children: React.ReactNode; pt?: string }) => (
  <div className="max-w-[90%] self-start rounded-2xl rounded-bl-none bg-white px-4 py-2 text-lg shadow">
    {children}
    <Tr text={pt} />
  </div>
);
const Btn = ({ onClick, children }: { onClick: () => void; children: React.ReactNode }) => (
  <button onClick={onClick} className="rounded-xl bg-indigo-600 px-4 py-3 text-lg font-semibold text-white active:scale-95">
    {children}
  </button>
);
const LinkBtn = ({ onClick, children }: { onClick: () => void; children: React.ReactNode }) => (
  <button className="min-h-11 text-base text-slate-600 underline" onClick={onClick}>
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
  const ptVars = { shopPt: SHOP_PT[p.shop], itemPt: item?.pt ?? '' };
  const key = `${p.step}-${p.sub}-${p.itemId}-${state.cart.length}`;
  const answer = (weight: 'main' | 'chat') => (correct: boolean) => dispatch({ type: 'ANSWER_BLANK', correct, weight });
  const highlights = ITEMS.filter((i) => i.shop === p.shop && !state.needs.some((n) => n.itemId === i.id));
  const leave = () => dispatch({ type: 'LEAVE_SHOP' });

  let body: React.ReactNode = null;
  switch (p.step) {
    case 'enter':
      body = (
        <>
          <Bubble pt={fill(PT.welcome, ptVars)}>{fill(DIALOGS.welcome, vars)}</Bubble>
          <Btn onClick={() => dispatch({ type: 'NEXT' })}>Próximo ▶</Btn>
          <LinkBtn onClick={leave}>Voltar para a rua</LinkBtn>
        </>
      );
      break;
    case 'greet':
      body = (
        <BlankChoices key={key} seller={DIALOGS.greetSeller} sellerPt={PT.greetSeller} player={DIALOGS.greet.player} playerPt={PT.greetPlayer} options={DIALOGS.greet.options} correct={DIALOGS.greet.correct} hint={DIALOGS.greet.hint} onAnswer={answer('chat')} />
      );
      break;
    case 'pick': {
      const chip = (i: Item) => (
        <button key={i.id} onClick={() => { setShowList(false); dispatch({ type: 'PICK_ITEM', itemId: i.id }); }} className="flex w-full items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-left active:scale-95">
          <span className="text-3xl">{i.icon}</span>
          <span className="text-base leading-tight">
            <b>{i.id}</b> <Tr text={i.pt} className="!mt-0 !inline !text-sm" />
            <br />R$ {i.price}
            {i.kind === 'uncountable' ? ' (a little)' : ' each'}
          </span>
        </button>
      );
      body = showList ? (
        <>
          <Bubble pt={PT.greetAfter}>{DIALOGS.greetAfter}</Bubble>
          <p className="text-base font-bold text-slate-700">Peça ao vendedor (Ask the seller for…)</p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {state.needs.map((n) => {
              const got = state.cart.some((l) => l.itemId === n.itemId);
              return (
                <div key={n.itemId} className={got ? 'opacity-50' : ''}>
                  {chip(ITEMS_BY_ID[n.itemId])}
                  <p className="mt-0.5 text-sm text-slate-700">{got ? '✅ ' : 'Na lista: '}<NeedText n={n} /></p>
                </div>
              );
            })}
          </div>
          {highlights.length > 0 && (
            <>
              <p className="text-base font-bold text-slate-700">Também nesta loja (Also at the {shopName})</p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">{highlights.map(chip)}</div>
            </>
          )}
          <LinkBtn onClick={() => setShowList(false)}>Voltar para a loja</LinkBtn>
        </>
      ) : (
        <>
          <p className="text-center text-base text-slate-700">
            Ande pela loja e <b>toque num item</b> para pegar. Ou peça pelo nome ao vendedor.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => setShowList(true)} className="rounded-xl bg-indigo-600 px-3 py-3 font-semibold text-white active:scale-95">💬 Pedir ao vendedor</button>
            <button onClick={leave} className="rounded-xl bg-slate-200 px-3 py-3 font-semibold active:scale-95">🚪 Voltar para a rua</button>
          </div>
        </>
      );
      break;
    }
    case 'wrongShop':
      body = (
        <>
          <Bubble pt={fill(PT.wrongShop, ptVars)}>{fill(DIALOGS.wrongShop, vars)}</Bubble>
          {state.wrongShopStreak >= 2 && item && (
            <Bubble pt={fill(PT.tryShop, { shopPt: SHOP_PT[item.shop] })}>{fill(DIALOGS.tryShop, { shop: SHOP_NAMES[item.shop] })}</Bubble>
          )}
          <Btn onClick={() => dispatch({ type: 'NEXT' })}>OK</Btn>
        </>
      );
      break;
    case 'ask': {
      const d = DIALOGS.ask[item!.kind];
      body = <BlankChoices key={key} seller={fill(d.seller, vars)} sellerPt={howManyPt(item!)} options={d.options} correct={d.correct} hint={fill(d.hint, vars)} onAnswer={answer('main')} />;
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
        const li = last ? ITEMS_BY_ID[last.itemId] : undefined;
        const ev = { ...vars, item: li?.id ?? '', singular: li?.singular ?? '', qtyWord: typeof last?.amount === 'number' ? numberWord(last.amount) : '' };
        const ep = (PT.extras as Record<string, { seller?: string; player?: string }>)[e.id] ?? {};
        const pv = { itemPt: li?.pt ?? '', qtyPt: typeof last?.amount === 'number' ? numberPt(last.amount) : '' };
        body = (
          <BlankChoices key={key} seller={e.seller ? fill(e.seller, ev) : undefined} sellerPt={ep.seller ? fill(ep.seller, pv) : undefined} player={e.player ? fill(e.player, ev) : undefined} playerPt={ep.player} options={e.options.map((o) => fill(o, ev))} correct={fill(e.correct, ev)} hint={e.hint} onAnswer={answer('chat')} />
        );
      } else {
        body = (
          <>
            <Bubble pt={PT.here}>{DIALOGS.here}</Bubble>
            {mismatch && <p className="rounded-lg bg-amber-100 p-2 text-base text-amber-900">💡 {DIALOGS.listHint}</p>}
            <Btn onClick={() => dispatch({ type: 'NEXT' })}>Próximo ▶</Btn>
          </>
        );
      }
      break;
    }
    case 'more':
      body = (
        <>
          <Bubble pt={PT.more}>{DIALOGS.more}</Bubble>
          <div className="grid grid-cols-2 gap-2">
            <Btn onClick={() => dispatch({ type: 'ASK_MORE', more: true })}>
              {DIALOGS.yes}
              <Tr text={PT.yes} className="!text-white/80 !not-italic" />
            </Btn>
            <Btn onClick={() => dispatch({ type: 'ASK_MORE', more: false })}>
              {DIALOGS.no}
              <Tr text={PT.no} className="!text-white/80 !not-italic" />
            </Btn>
          </div>
        </>
      );
      break;
    case 'bye': {
      const d = DIALOGS.bye[p.sub] as { player?: string; seller?: string; options: string[]; correct: string; hint: string };
      const bp = PT.bye[p.sub] as { player?: string; seller?: string };
      body = <BlankChoices key={key} seller={d.seller} sellerPt={bp.seller} player={d.player} playerPt={bp.player} options={d.options} correct={d.correct} hint={d.hint} onAnswer={answer('chat')} />;
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
        onExit={leave}
      />
      <div className="flex max-h-[55%] flex-col gap-2 overflow-auto rounded-t-3xl bg-white p-3 shadow-[0_-4px_12px_rgba(0,0,0,.2)]">{body}</div>
    </div>
  );
}
