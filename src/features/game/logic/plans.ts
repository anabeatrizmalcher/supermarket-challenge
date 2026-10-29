import { CONFIG } from '../content/config';
import { ITEMS, ITEMS_BY_ID } from '../content';
import { mulberry32, shuffle } from '../../../lib/prng';
import type { Need, Portion, TeamColor, TeamPlan } from '../state/types';
import { needAmount, walletFor } from './pricing';

const PORTIONS: Portion[] = ['a little', 'some', 'a lot of'];

/** Two plans conflict if they share an item with the same quantity/portion. */
export function conflicts(a: Need[], b: Need[]): boolean {
  return a.some((x) => b.some((y) => x.itemId === y.itemId && needAmount(x) === needAmount(y)));
}

function draw(rnd: () => number): Need[] {
  const nCount = rnd() < 0.5 ? 2 : 3;
  const nUnc = CONFIG.itemsPerTeam - nCount;
  const countable = shuffle(ITEMS.filter((i) => i.kind === 'countable'), rnd).slice(0, nCount);
  const uncountable = shuffle(ITEMS.filter((i) => i.kind === 'uncountable'), rnd).slice(0, nUnc);
  const span = CONFIG.maxNeedQty - CONFIG.minNeedQty + 1;
  return [
    ...countable.map((i): Need => ({
      itemId: i.id,
      kind: 'countable',
      qty: CONFIG.minNeedQty + Math.floor(rnd() * span),
    })),
    ...uncountable.map((i): Need => ({
      itemId: i.id,
      kind: 'uncountable',
      portion: PORTIONS[Math.floor(rnd() * 3)],
    })),
  ];
}

export function generatePlans(seed: number, teams: TeamColor[]): TeamPlan[] {
  const rnd = mulberry32(seed);
  const plans: TeamPlan[] = [];
  for (const team of teams) {
    let needs: Need[] | null = null;
    for (let attempt = 0; attempt < 200 && !needs; attempt++) {
      const cand = draw(rnd);
      if (!plans.some((p) => conflicts(cand, p.needs))) needs = cand;
    }
    if (!needs) throw new Error(`Could not generate a plan for ${team}`);
    plans.push({ team, needs, wallet: walletFor(needs, ITEMS_BY_ID) });
  }
  return plans;
}
