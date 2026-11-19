// Pure money logic: integer paise only, no floating-point money.
export const toPaise = (x) => Math.round(Number(x) * 100);
export const fromPaise = (p) => (p / 100).toFixed(2);
// members: [{ weight, ...anything }] ordered by employee id. Remainder paise go to the LAST eligible employees.
export function splitPool(poolPaise, members) {
  const rows = members.map((m) => ({ ...m, paise: 0 }));
  const elig = rows.filter((r) => r.weight > 0);
  if (!elig.length || poolPaise <= 0) return { rows, undistributed: Math.max(0, poolPaise) };
  const w = elig.map((r) => Math.round(r.weight * 100));
  const W = w.reduce((a, b) => a + b, 0);
  let given = 0;
  elig.forEach((r, i) => { r.paise = Number((BigInt(poolPaise) * BigInt(w[i])) / BigInt(W)); given += r.paise; });
  let rem = poolPaise - given;
  for (let i = elig.length - 1; rem > 0 && i >= 0; i--, rem--) elig[i].paise += 1;
  return { rows, undistributed: 0 };
}
