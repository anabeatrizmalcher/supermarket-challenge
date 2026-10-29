import itemsJson from './items.json';
import dialogsJson from './dialogs.json';
import type { Item, ShopId } from '../state/types';

export const ITEMS = itemsJson as unknown as Item[];
export const ITEMS_BY_ID: Record<string, Item> = Object.fromEntries(ITEMS.map((i) => [i.id, i]));
export const DIALOGS = dialogsJson;
export const EXTRAS = dialogsJson.extras as {
  id: string;
  needsCountable?: boolean;
  seller?: string;
  player?: string;
  options: string[];
  correct: string;
  hint: string;
}[];
export const SHOP_NAMES: Record<ShopId, string> = {
  bakery: 'Bakery',
  market: 'Market',
  supermarket: 'Supermarket',
};

export const fill = (s: string | undefined, vars: Record<string, string | number>) =>
  (s ?? '').replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`));
