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

export const PT = dialogsJson.pt;
export const SHOP_PT: Record<ShopId, string> = { bakery: 'Padaria', market: 'Mercado', supermarket: 'Supermercado' };
export const PORTION_PT: Record<string, string> = { 'a little': 'um pouco', some: 'algum / uns', 'a lot of': 'muito', 'a few': 'alguns' };
const PT_NUM = ['zero', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito'];
export const numberPt = (n: number) => PT_NUM[n] ?? String(n);

/** "Quantas maçãs você quer?" / "Quanta farinha você quer?" */
export const howManyPt = (item: Item) =>
  item.kind === 'countable'
    ? `Quant${item.g === 'f' ? 'as' : 'os'} ${item.pt} você quer?`
    : `Quant${item.g === 'f' ? 'a' : 'o'} ${item.pt} você quer?`;

export const fill = (s: string | undefined, vars: Record<string, string | number>) =>
  (s ?? '').replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`));
