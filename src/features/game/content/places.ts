import type { PlaceId } from '../state/types';

// side: -1 = left of the street, 1 = right. z = position along the street.
export const PLACES: Record<PlaceId, { label: string; z: number; side: 1 | -1; color: string }> = {
  bakery: { label: 'Bakery', z: -12, side: -1, color: '#f59e0b' },
  market: { label: 'Market', z: -26, side: 1, color: '#22c55e' },
  supermarket: { label: 'Supermarket', z: -40, side: -1, color: '#3b82f6' },
  checkout: { label: 'Checkout', z: -54, side: 1, color: '#ef4444' },
};
export const STREET = { halfWidth: 6, minZ: -64, maxZ: 10, walkHalf: 5.2 };
