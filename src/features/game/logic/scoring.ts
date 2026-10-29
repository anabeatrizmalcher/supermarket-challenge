import { CONFIG } from '../content/config';

const P = CONFIG.points;
// Only the first wrong attempt counts; a right answer only scores on the first try.
export const onMainBlank = (correct: boolean, alreadyWrong: boolean) =>
  correct ? (alreadyWrong ? 0 : P.mainRight) : alreadyWrong ? 0 : P.mainWrong;
export const onChatBlank = (correct: boolean, alreadyWrong: boolean) =>
  correct ? (alreadyWrong ? 0 : P.chatRight) : alreadyWrong ? 0 : P.chatWrong;
export const onQuantity = (correct: boolean) => (correct ? P.qtyRight : P.qtyWrong);
export const onWrongShop = () => P.wrongShop;
export const onPaid = () => P.paid;
export const applyDelta = (score: number, delta: number) => Math.max(0, score + delta);
