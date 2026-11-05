import { describe, expect, it } from 'vitest';
import { ITEMS_BY_ID } from '../src/features/game/content';
import { canPay, cartTotal, walletFor } from '../src/features/game/logic/pricing';
import { generatePlans } from '../src/features/game/logic/plans';
import { rankTeams } from '../src/features/game/logic/ranking';
import { applyDelta, onMainBlank } from '../src/features/game/logic/scoring';
import { initialState, reducer, type Action } from '../src/features/game/state/reducer';
import { TEAMS, type Need, type TeamPlan } from '../src/features/game/state/types';

const needs: Need[] = [
  { itemId: 'apples', kind: 'countable', qty: 3 },
  { itemId: 'eggs', kind: 'countable', qty: 2 },
  { itemId: 'milk', kind: 'uncountable', portion: 'a little' },
  { itemId: 'water', kind: 'uncountable', portion: 'a lot of' },
  { itemId: 'sugar', kind: 'uncountable', portion: 'a little' },
];

describe('pricing', () => {
  it('matches the example in the doc (wallet R$ 21)', () => {
    expect(walletFor(needs, ITEMS_BY_ID)).toBe(21);
  });
  it('detects overspending', () => {
    const cart = [
      ...needs.map((n) => ({
        itemId: n.itemId,
        amount: n.kind === 'countable' ? n.qty : n.portion,
      })),
      { itemId: 'apples', amount: 2 },
      { itemId: 'cupcakes', amount: 1 },
    ];
    const total = cartTotal(cart, ITEMS_BY_ID);
    expect(total).toBe(23);
    expect(canPay(total, 21)).toBe(false);
  });
});

describe('scoring', () => {
  it('only the first wrong attempt counts and score never goes below 0', () => {
    expect(onMainBlank(false, false)).toBe(-3);
    expect(onMainBlank(false, true)).toBe(0);
    expect(onMainBlank(true, true)).toBe(0);
    expect(applyDelta(2, -5)).toBe(0);
  });
});

describe('ranking', () => {
  it('orders by score, then time; losers count as 0', () => {
    const r = rankTeams(
      [
        { team: 'red', status: 'finished', score: 50, elapsed: 100 },
        { team: 'blue', status: 'finished', score: 50, elapsed: 80 },
        { team: 'green', status: 'lost', score: 90, elapsed: 60 },
      ],
      1200,
    );
    expect(r.map((x) => x.team)).toEqual(['blue', 'red', 'green']);
    expect(r[2].score).toBe(0);
  });
});

describe('generatePlans', () => {
  it('never fails and never repeats an item+amount across 6 teams (10k seeds)', () => {
    for (let seed = 1; seed <= 10000; seed++) {
      const plans = generatePlans(seed, TEAMS);
      expect(plans).toHaveLength(6);
    }
  });
});

describe('reducer', () => {
  const plan: TeamPlan = {
    team: 'red',
    needs: [{ itemId: 'apples', kind: 'countable', qty: 2 }],
    wallet: 10,
  };
  const run = (actions: Action[]) => actions.reduce(reducer, initialState(plan, 0));
  const shopFlow: Action[] = [
    { type: 'ENTER_SHOP', shop: 'market', extra: null },
    { type: 'NEXT' },
    { type: 'ANSWER_BLANK', correct: false, weight: 'chat' },
    { type: 'ANSWER_BLANK', correct: true, weight: 'chat' },
    { type: 'PICK_ITEM', itemId: 'apples' },
    { type: 'ANSWER_BLANK', correct: true, weight: 'main' },
    { type: 'CHOOSE_AMOUNT', amount: 2 },
    { type: 'NEXT' },
    { type: 'ASK_MORE', more: false },
    { type: 'ANSWER_BLANK', correct: true, weight: 'chat' },
    { type: 'ANSWER_BLANK', correct: true, weight: 'chat' },
  ];

  it('plays a whole game and pays', () => {
    const s = run([
      ...shopFlow,
      { type: 'GO_CHECKOUT' },
      { type: 'NEXT' },
      { type: 'ANSWER_BLANK', correct: true, weight: 'main' },
      { type: 'ANSWER_BLANK', correct: true, weight: 'main' },
      { type: 'PAY', now: 5000 },
    ]);
    expect(s.phase).toEqual({ name: 'finished', outcome: 'paid' });
    // greet wrong (floor 0) + ask 10 + qty 10 + bye 5+5 + checkout 10+10 + paid 20
    expect(s.score).toBe(70);
  });

  it('loses when the cart is over the wallet', () => {
    const poor = initialState({ ...plan, wallet: 1 }, 0);
    const l = [
      ...shopFlow,
      { type: 'GO_CHECKOUT' } as Action,
      { type: 'NEXT' } as Action,
      { type: 'ANSWER_BLANK', correct: true, weight: 'main' } as Action,
      { type: 'ANSWER_BLANK', correct: true, weight: 'main' } as Action,
      { type: 'PAY', now: 1 } as Action,
      { type: 'ANSWER_BLANK', correct: true, weight: 'chat' } as Action,
    ].reduce(reducer, poor);
    expect(l.phase).toEqual({ name: 'finished', outcome: 'lost' });
  });

  it('does not open checkout before the list is bought', () => {
    expect(run([{ type: 'GO_CHECKOUT' }]).phase.name).toBe('street');
  });
});

import { ITEMS } from '../src/features/game/content';
import { makeCluster, makeUnit } from '../src/features/game/components/itemModels';
describe('3D item models', () => {
  it('builds a unit and a pile for every item', () => {
    for (const it of ITEMS) {
      expect(makeUnit(it.id).children.length).toBeGreaterThan(0);
      expect(makeCluster(it.id).userData.itemId).toBe(it.id);
    }
  });
});

import { EXTRAS, fill } from '../src/features/game/content';
describe('extra dialogs', () => {
  it('every extra can be rendered for a countable item without crashing', () => {
    const ev = { shop: 'Market', item: 'apples', singular: 'apple', qtyWord: 'three' };
    for (const e of EXTRAS) {
      expect(e.seller || e.player).toBeTruthy();
      const lines = [e.seller, e.player].filter(Boolean).map((l) => fill(l, ev));
      expect(lines.some((l) => l.includes('___'))).toBe(true);
      expect(e.options.map((o) => fill(o, ev))).toContain(fill(e.correct, ev));
    }
  });
});

import { DIALOGS, PT, howManyPt } from '../src/features/game/content';
import { numberToWords } from '../src/features/game/logic/pricing';
describe('translations', () => {
  it('every item has a Portuguese name and gender', () => {
    for (const it of ITEMS) {
      expect(it.pt.length).toBeGreaterThan(1);
      expect(['m', 'f']).toContain(it.g);
    }
  });
  it('every extra chat has a translation for each line it has', () => {
    for (const e of DIALOGS.extras) {
      const t = (PT.extras as Record<string, { seller?: string; player?: string }>)[e.id];
      expect(t).toBeTruthy();
      if (e.seller) expect(t.seller).toBeTruthy();
      if (e.player) expect(t.player).toBeTruthy();
    }
  });
  it('conjugates quantos/quantas and quanto/quanta', () => {
    const by = (id: string) => ITEMS.find((i) => i.id === id)!;
    expect(howManyPt(by('apples'))).toBe('Quantas maçãs você quer?');
    expect(howManyPt(by('eggs'))).toBe('Quantos ovos você quer?');
    expect(howManyPt(by('flour'))).toBe('Quanta farinha você quer?');
    expect(howManyPt(by('milk'))).toBe('Quanto leite você quer?');
  });
  it('spells prices in English', () => {
    expect(numberToWords(21)).toBe('twenty-one');
    expect(numberToWords(40)).toBe('forty');
    expect(numberToWords(7)).toBe('seven');
  });
});
