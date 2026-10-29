// Everything tunable lives here: wallet slack, multipliers, points, time.
export const CONFIG = {
  walletMinSlack: 5,
  walletSlackRate: 0.2,
  multipliers: { 'a little': 1, some: 2, 'a lot of': 3 },
  points: {
    mainRight: 10,
    mainWrong: -3,
    chatRight: 5,
    chatWrong: -2,
    qtyRight: 10,
    qtyWrong: -5,
    wrongShop: -2,
    paid: 20,
  },
  maxSeconds: 20 * 60,
  countdownSeconds: 3,
  teamSize: 4,
  itemsPerTeam: 5,
  maxQty: 8,
  minNeedQty: 2,
  maxNeedQty: 6,
} as const;
