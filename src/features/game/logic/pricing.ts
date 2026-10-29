import { CONFIG } from '../content/config';
import type { Amount, CartLine, Item, Need } from '../state/types';

type Items = Record<string, Item>;

export const lineCost = (item: Item, amount: Amount) =>
  typeof amount === 'number' ? item.price * amount : item.price * CONFIG.multipliers[amount];

export const cartTotal = (cart: CartLine[], items: Items) =>
  cart.reduce((sum, l) => sum + lineCost(items[l.itemId], l.amount), 0);

export const needAmount = (n: Need): Amount => (n.kind === 'countable' ? n.qty : n.portion);

export const walletFor = (needs: Need[], items: Items) => {
  const cost = needs.reduce((s, n) => s + lineCost(items[n.itemId], needAmount(n)), 0);
  return cost + Math.max(CONFIG.walletMinSlack, Math.ceil(cost * CONFIG.walletSlackRate));
};

export const canPay = (total: number, wallet: number) => total <= wallet;

const WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight'];
export const numberWord = (n: number) => WORDS[n] ?? String(n);

export const amountLabel = (item: Item, amount: Amount) =>
  typeof amount === 'number' ? `${amount} ${item.id}` : `${amount} ${item.id}`;

export const listComplete = (needs: Need[], cart: CartLine[]) =>
  needs.every((n) => cart.some((l) => l.itemId === n.itemId));

/** Lines (or parts of lines) that go beyond the list, with their extra cost. */
export function overspend(cart: CartLine[], needs: Need[], items: Items) {
  const used = new Set<number>();
  const out: { label: string; cost: number }[] = [];
  const matched = new Map<number, number>();
  for (const n of needs) {
    const idx = cart.findIndex((l, i) => l.itemId === n.itemId && !used.has(i));
    if (idx >= 0) {
      used.add(idx);
      matched.set(idx, lineCost(items[n.itemId], needAmount(n)));
    }
  }
  cart.forEach((l, i) => {
    const cost = lineCost(items[l.itemId], l.amount) - (matched.get(i) ?? 0);
    if (cost > 0) out.push({ label: amountLabel(items[l.itemId], l.amount), cost });
  });
  return out;
}
