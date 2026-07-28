"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(
  path.join(root, "ideco-mirai-navi/index.html"),
  "utf8"
);
const manifest = JSON.parse(
  fs.readFileSync(path.join(root, "ideco-mirai-navi/version.json"), "utf8")
);
const designRule = fs.readFileSync(
  path.join(root, "DESIGN-PROBABILITY-EXPLANATION.md"),
  "utf8"
);

assert.equal(manifest.uiVersion, "v1.3.1");
assert.equal(manifest.calculationEngineVersion, "v27");
assert.equal(manifest.transferContractVersion, "MN4");
assert.equal(manifest.calculationChanged, false);
assert.equal(
  manifest.calculationCoreSha256,
  "2de196f567b6086bb7a740bcd8352282705ec2c73bc31d4d0a5012aa204bcd91"
);

for (const required of [
  "積立から取り崩しまでの資産残高の推移",
  "グラフで推移を確認する",
  "グラフを閉じる",
  "積立期間から取り崩し後まで、2,000通りの計算をグラフで確認できます。",
  "100回中約80回に相当：",
  "100回中約90回に相当：",
  "歳まで資産が尽きない条件",
  "歳まで資産が尽きない慎重な条件",
  "実際には同じ条件で1,000通りの計算を3組行います。",
  "将来の結果を保証するものではありません。",
  "この条件で再計算する",
]) {
  assert.ok(html.includes(required), `required human-centered copy: ${required}`);
}

for (const forbidden of [
  "希望した月額での残高を見る",
  "80%でみる",
  "90%でみる",
  "試算割合",
  "成功率",
  "残高が続く月額",
  "残高がもった割合",
  "残高が続くか確認する年齢",
  "100回試すと",
  "1,000通りずつ計算した3組すべてで",
]) {
  assert.equal(html.includes(forbidden), false, `forbidden ambiguous copy: ${forbidden}`);
}

assert.equal((html.match(/class="pTargetAge"/gu) || []).length, 2);
assert.match(html, /document\.querySelectorAll\("\.pTargetAge"\)/u);
assert.match(html, /\$\("survSummaryAge"\)\.textContent=D\.maxAge/u);
assert.match(
  html,
  /次は\$\{maxAge\}歳まで資産が尽きない毎月額を計算します（表示中は前回の\$\{lastMoneyData\.maxAge\}歳結果）/u
);
assert.match(
  html,
  /const draftTargetChanged=inputDirty&&\(maxAge!==D\.maxAge\|\|Math\.round\(pTarget\*100\)!==D\.pPct\)/u
);
assert.match(
  html,
  /if\(draftTargetChanged\)\{\s*applyDraftSelectionCopy\(\);\s*applyTargetDraftHint\(\);\s*\}else\{\s*applyResultSelectionCopy\(D\);/u
);
assert.match(html, /const minGap=\(ctx\.measureText\(prevLabel\)\.width\+ctx\.measureText\(lastLabel\)\.width\)\/2\+8/u);
assert.match(html, /cv\.dataset\.tickAges=tickYears\.map\(y=>S\.startAge\+y\)\.join\(","\)/u);
assert.match(
  html,
  /乱数の異なる3組で、それぞれ100回中約\$\{D\.pPct\}回に相当し、\$\{D\.maxAge\}歳まで資産が尽きない月額を計算した結果の幅です。/u
);
assert.match(html, /data-p="80"/u);
assert.match(html, /data-p="90"/u);
assert.match(html, /pTarget=next;\s*document\.querySelectorAll/u);
assert.match(html, /\$\("recalculateAfford"\)\.addEventListener\("click",runExplicitCalculation\)/u);
assert.doesNotMatch(
  html.slice(html.indexOf('$("pSeg").addEventListener'), html.indexOf('$("moneyViewSeg").addEventListener')),
  /render\(|simulate\(|affordProbBand\(/u,
  "changing the condition must not automatically start heavy calculation"
);

assert.match(html, /cfg\.seed==null\?19670701:cfg\.seed>>>0/u);
assert.match(html, /const AFFORD_SEEDS=\[19670701,2669371156,2227694790\]/u);
assert.match(html, /const ENGINE_VERSION = "v27"/u);
assert.match(html, /const CONTRACT = "MN4"/u);
assert.match(designRule, /何をするか/u);
assert.match(designRule, /100回換算は説明方法です。計算方法ではありません。/u);
assert.match(designRule, /条件と結果を混ぜない/u);
assert.match(designRule, /重い計算は自動で走らせない/u);
assert.match(designRule, /相談メモ、CSV、PDF、共有コードも同じ意味/u);

console.log("Member human-centered probability UI: PASS");
console.log("bareTargetPercentLabels=0");
console.log("targetAgeOptions=90,95,100");
console.log("actualAffordableRuns=1,000x3");
console.log("graphRuns=2,000");
console.log("calculationCoreChanged=false");
