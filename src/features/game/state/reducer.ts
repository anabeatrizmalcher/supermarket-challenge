import { EXTRAS, ITEMS_BY_ID } from '../content';
import { needAmount, cartTotal, canPay } from '../logic/pricing';
import { applyDelta, onChatBlank, onMainBlank, onPaid, onQuantity, onWrongShop } from '../logic/scoring';
import type { Amount, GameState, Item, ShopId, TeamPlan } from './types';

export type Action =
  | { type: 'ENTER_SHOP'; shop: ShopId; extra: number | null }
  | { type: 'LEAVE_SHOP' }
  | { type: 'NEXT' }
  | { type: 'ANSWER_BLANK'; correct: boolean; weight: 'main' | 'chat' }
  | { type: 'PICK_ITEM'; itemId: string }
  | { type: 'CHOOSE_AMOUNT'; amount: Amount | 'a few' }
  | { type: 'ASK_MORE'; more: boolean }
  | { type: 'GO_CHECKOUT' }
  | { type: 'PAY'; now: number }
  | { type: 'TIMEOUT'; now: number };

export const initialState = (plan: TeamPlan, startedAt: number): GameState => ({
  phase: { name: 'street' },
  cart: [],
  score: 0,
  startedAt,
  wrongOnLine: false,
  wrongShopStreak: 0,
  needs: plan.needs,
  wallet: plan.wallet,
  extraId: null,
  extraDone: false,
});

export const extraApplies = (s: GameState, item: Item) =>
  s.extraId !== null &&
  !s.extraDone &&
  (!EXTRAS[s.extraId].needsCountable || item.kind === 'countable');

export function reducer(s: GameState, a: Action): GameState {
  const p = s.phase;
  switch (a.type) {
    case 'ENTER_SHOP':
      if (p.name !== 'street') return s;
      return {
        ...s,
        phase: { name: 'shop', shop: a.shop, step: 'enter', sub: 0 },
        extraId: a.extra,
        extraDone: false,
        wrongOnLine: false,
        wrongShopStreak: 0,
        lastWrongItem: undefined,
      };

    case 'LEAVE_SHOP':
      if (p.name !== 'shop') return s;
      return { ...s, phase: { name: 'street' }, lastPlace: p.shop, wrongOnLine: false };

    case 'NEXT': {
      if (p.name === 'shop') {
        if (p.step === 'enter') return { ...s, phase: { ...p, step: 'greet', sub: 0 } };
        if (p.step === 'wrongShop') return { ...s, phase: { ...p, step: 'pick', sub: 0, itemId: undefined } };
        if (p.step === 'confirm') return { ...s, phase: { ...p, step: 'more', sub: 0 } };
      }
      if (p.name === 'checkout' && p.sub === 0) return { ...s, phase: { name: 'checkout', sub: 1 } };
      return s;
    }

    case 'ANSWER_BLANK': {
      const delta =
        a.weight === 'main' ? onMainBlank(a.correct, s.wrongOnLine) : onChatBlank(a.correct, s.wrongOnLine);
      const next: GameState = { ...s, score: applyDelta(s.score, delta), wrongOnLine: !a.correct };
      if (!a.correct) return next;
      if (p.name === 'shop') {
        if (p.step === 'greet') return { ...next, phase: { ...p, step: 'pick', sub: 0 } };
        if (p.step === 'ask') return { ...next, phase: { ...p, step: 'quantity', sub: 0 } };
        if (p.step === 'confirm') return { ...next, extraDone: true, phase: { ...p, sub: 1 } };
        if (p.step === 'bye') {
          return p.sub === 0
            ? { ...next, phase: { ...p, sub: 1 } }
            : { ...next, phase: { name: 'street' }, lastPlace: p.shop };
        }
      }
      if (p.name === 'checkout') {
        if (p.sub === 1 || p.sub === 2) return { ...next, phase: { name: 'checkout', sub: p.sub + 1 } };
        if (p.sub === 4) return { ...next, phase: { name: 'finished', outcome: 'lost' } };
      }
      return next;
    }

    case 'PICK_ITEM': {
      if (p.name !== 'shop' || p.step !== 'pick') return s;
      const item = ITEMS_BY_ID[a.itemId];
      if (!item) return s;
      if (item.shop !== p.shop) {
        const inList = s.needs.some((n) => n.itemId === item.id);
        return {
          ...s,
          score: inList ? applyDelta(s.score, onWrongShop()) : s.score,
          wrongShopStreak: s.lastWrongItem === item.id ? s.wrongShopStreak + 1 : 1,
          lastWrongItem: item.id,
          phase: { ...p, step: 'wrongShop', itemId: item.id },
        };
      }
      return {
        ...s,
        wrongShopStreak: 0,
        lastWrongItem: undefined,
        wrongOnLine: false,
        phase: { ...p, step: 'ask', itemId: item.id },
      };
    }

    case 'CHOOSE_AMOUNT': {
      if (p.name !== 'shop' || p.step !== 'quantity' || !p.itemId) return s;
      const item = ITEMS_BY_ID[p.itemId];
      if (a.amount === 'a few') {
        // "a few" is never grammatical with an uncountable noun
        if (item.kind !== 'uncountable') return s;
        return { ...s, score: applyDelta(s.score, onMainBlank(false, s.wrongOnLine)), wrongOnLine: true };
      }
      if ((item.kind === 'countable') !== (typeof a.amount === 'number')) return s;
      const need = s.needs.find((n) => n.itemId === item.id);
      const delta = need ? onQuantity(needAmount(need) === a.amount) : 0;
      const cart = [...s.cart, { itemId: item.id, amount: a.amount }];
      const withCart = { ...s, cart, score: applyDelta(s.score, delta), wrongOnLine: false };
      return { ...withCart, phase: { ...p, step: 'confirm', sub: extraApplies(s, item) ? 0 : 1 } };
    }

    case 'ASK_MORE': {
      if (p.name !== 'shop' || p.step !== 'more') return s;
      return {
        ...s,
        wrongOnLine: false,
        phase: a.more ? { ...p, step: 'pick', sub: 0, itemId: undefined } : { ...p, step: 'bye', sub: 0 },
      };
    }

    case 'GO_CHECKOUT':
      if (p.name !== 'street') return s;
      if (!s.needs.every((n) => s.cart.some((l) => l.itemId === n.itemId))) return s;
      return { ...s, phase: { name: 'checkout', sub: 0 }, lastPlace: 'checkout', wrongOnLine: false };

    case 'PAY': {
      if (p.name !== 'checkout' || p.sub !== 3) return s;
      if (canPay(cartTotal(s.cart, ITEMS_BY_ID), s.wallet)) {
        return {
          ...s,
          score: applyDelta(s.score, onPaid()),
          endedAt: a.now,
          phase: { name: 'finished', outcome: 'paid' },
        };
      }
      return { ...s, endedAt: a.now, wrongOnLine: false, phase: { name: 'checkout', sub: 4 } };
    }

    case 'TIMEOUT':
      if (p.name === 'finished') return s;
      return { ...s, endedAt: a.now, phase: { name: 'finished', outcome: 'timeout' } };
  }
}
