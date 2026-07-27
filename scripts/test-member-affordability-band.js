"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const html = fs.readFileSync(
  path.join(__dirname, "../ideco-mirai-navi/index.html"),
  "utf8"
);

const coreBegin =
  "// ===== 加入者版計算核（MN4共有結果はアドバイザー版と別の出力parity検査で照合）=====";
const coreEnd = "// ===== 計算核ここまで =====";
const coreStartIndex = html.indexOf(coreBegin);
const coreEndIndex = html.indexOf(coreEnd);
assert.ok(coreStartIndex >= 0 && coreEndIndex > coreStartIndex);
const core = html.slice(
  html.indexOf("\n", coreStartIndex) + 1,
  coreEndIndex
);

const bandStartIndex = html.indexOf("const AFFORD_SEEDS=");
const bandEndIndex = html.indexOf("const rangeRounded=", bandStartIndex);
assert.ok(bandStartIndex >= 0 && bandEndIndex > bandStartIndex);
const bandCode = html.slice(bandStartIndex, bandEndIndex);

const cfg = {
  startAge: 45,
  drawAge: 65,
  maxAge: 95,
  retAge: 65,
  retAmt: 0,
  retMu: 0,
  retSig: 0,
  wMon: 15,
  wRate: 4,
  wMu: 7,
  wSig: 15,
  assets: [
    {
      name: "test",
      start: 500,
      monthly: 2,
      endAge: 65,
      mu: 7,
      sig: 15,
      on: true,
    },
  ],
  draws: [],
  mode: "amount",
  mat: { age: 50, amt: 0, yrs: 3, mu: 0, sig: 0 },
  infl: 2,
  spendMode: "keep",
};

const context = { structuredClone };
vm.createContext(context);
vm.runInContext(
  `${core}\n${bandCode}\n` +
    `const band=affordProbBand(${JSON.stringify(cfg)},0.8,true);` +
    `const displayedHi=Math.floor((band.hiYen/1e4)*2+1e-9)/2*1e4;` +
    `const hiChecks=AFFORD_SEEDS.map(seed=>({seed,surv:simulate({...${JSON.stringify(cfg)},seed,wMon:displayedHi/1e4}).survProb}));` +
    `globalThis.result={band,displayedHi,hiChecks};`,
  context,
  { timeout: 30000 }
);

const { band, displayedHi, hiChecks } = context.result;
assert.equal(band.rows.length, 3);
for (const row of band.rows) {
  assert.equal(row.afford.feasible, true);
  assert.ok(
    row.afford.survProb >= 0.8,
    `each seed-specific solution must meet its own target: ${row.seed}`
  );
}
assert.ok(band.loYen < band.hiYen, "the fixed case must expose a result band");
assert.ok(
  hiChecks.some((row) => row.surv < 0.8),
  "the displayed high endpoint is not a common all-seed guarantee"
);
assert.ok(
  hiChecks.some((row) => row.surv >= 0.8),
  "the high endpoint must remain a valid seed-specific result"
);
assert.equal(
  html.includes("1,000通りずつ計算した3組すべてで"),
  false,
  "the result band must not be described as an all-seed guarantee"
);
assert.match(
  html,
  /乱数の異なる3組で、それぞれ100回中約\$\{D\.pPct\}回に相当し/u
);

console.log("Member affordability band semantics: PASS");
console.log(`seedSpecificSolutions=${band.rows.length}`);
console.log(`displayedHighWan=${displayedHi / 1e4}`);
console.log(
  `displayedHighSurvivalPct=${hiChecks
    .map((row) => Math.round(row.surv * 1000) / 10)
    .join(",")}`
);
console.log("displayedHighIsCommonAllSeedGuarantee=false");
