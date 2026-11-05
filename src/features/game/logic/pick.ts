import type { CartLine, Need } from '../state/types';

export type PickWarning = 'notInList' | 'already' | null;

/** Should we ask "are you sure?" before the player takes this item? */
export function pickWarning(needs: Need[], cart: CartLine[], itemId: string): PickWarning {
  if (!needs.some((n) => n.itemId === itemId)) return 'notInList';
  if (cart.some((l) => l.itemId === itemId)) return 'already';
  return null;
}
