export type TeamColor = 'red' | 'blue' | 'green' | 'yellow' | 'purple' | 'orange';
export const TEAMS: TeamColor[] = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];
export const TEAM_HEX: Record<TeamColor, string> = {
  red: '#ef4444',
  blue: '#3b82f6',
  green: '#22c55e',
  yellow: '#eab308',
  purple: '#a855f7',
  orange: '#f97316',
};
export const TEAM_PT: Record<TeamColor, string> = {
  red: 'vermelho', blue: 'azul', green: 'verde', yellow: 'amarelo', purple: 'roxo', orange: 'laranja',
};
// Dark text on the yellow team: white on yellow is hard to read
export const TEAM_TEXT: Record<TeamColor, string> = {
  red: '#fff', blue: '#fff', green: '#fff', yellow: '#111827', purple: '#fff', orange: '#fff',
};
export type ShopId = 'bakery' | 'market' | 'supermarket';
export type PlaceId = ShopId | 'checkout';
export type Portion = 'a little' | 'some' | 'a lot of';
export type Amount = number | Portion;

export interface Item {
  id: string;
  singular: string;
  kind: 'countable' | 'uncountable';
  shop: ShopId;
  price: number;
  icon: string;
  pt: string; // Portuguese name
  g: 'm' | 'f'; // grammatical gender, for "quantos/quantas"
}

export type Need =
  | { itemId: string; kind: 'countable'; qty: number }
  | { itemId: string; kind: 'uncountable'; portion: Portion };

export interface TeamPlan {
  team: TeamColor;
  needs: Need[];
  wallet: number;
}
export interface MatchConfig {
  seed: number;
  plans: TeamPlan[];
  maxSeconds: number;
}
export interface CartLine {
  itemId: string;
  amount: Amount;
}

export type ShopStep =
  | 'enter' | 'greet' | 'pick' | 'wrongShop' | 'ask' | 'quantity' | 'confirm' | 'more' | 'bye';

export type Phase =
  | { name: 'street' }
  | { name: 'shop'; shop: ShopId; step: ShopStep; sub: number; itemId?: string }
  | { name: 'checkout'; sub: number } // 0 hello, 1 how much, 2 price, 3 pay, 4 sorry
  | { name: 'finished'; outcome: 'paid' | 'lost' | 'timeout' };

export interface GameState {
  phase: Phase;
  cart: CartLine[];
  score: number;
  startedAt: number; // ms (server time)
  endedAt?: number;
  wrongOnLine: boolean;
  wrongShopStreak: number;
  lastWrongItem?: string;
  needs: Need[];
  wallet: number;
  lastPlace?: PlaceId;
  extraId: number | null;
  extraDone: boolean;
}
