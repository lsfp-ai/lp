"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const html = fs.readFileSync(
  path.join(__dirname, "../ideco-mirai-navi/index.html"),
  "utf8"
);
const encoder = fs.readFileSync(
  path.join(__dirname, "../ideco-mirai-navi/mn1_member_encoder.js"),
  "utf8"
);

assert.equal(
  (html.match(/id="confirmInputs"/gu) || []).length,
  1,
  "there must be exactly one primary calculation button"
);

const inputWiring = html.slice(
  html.indexOf("const coreTouched="),
  html.indexOf("// MN1_MEMBER_TRANSFER_UI_BEGIN")
);
assert.ok(inputWiring.length > 0, "input wiring section must exist");
assert.match(inputWiring, /markInputsDirty\(\)/u);
for (const forbidden of [
  "request(",
  "render(",
  "simulate(",
  "simulateForUi(",
  "affordProbBand(",
  "desiredSurvivalCached(",
  "solveAffordable(",
  "solveAffordableProb(",
  "solveByProb(",
  "solveEffAnnual(",
  "solveRequiredRate(",
  "setTimeout(",
]) {
  assert.equal(
    inputWiring.includes(forbidden),
    false,
    `input handlers must not start heavy work: ${forbidden}`
  );
}

const calculationWiring = html.slice(
  html.indexOf("// 重い試算は計算ボタンを押した時だけ実行する。"),
  html.indexOf("// 初期化")
);
assert.match(
  calculationWiring,
  /\$\("confirmInputs"\)\.addEventListener\("click",async\(\)=>\{/u,
  "heavy calculation must be owned by the calculation button"
);
assert.match(calculationWiring, /await new Promise\(resolve=>setTimeout\(resolve,20\)\)/u);
assert.match(calculationWiring, /calculated=render\(\)/u);
assert.match(calculationWiring, /if\(calculationBusy\)return/u);
assert.match(html, /setDraftControlsDisabled\(true\)/u);
assert.match(calculationWiring, /setDraftControlsDisabled\(false\)/u);

const initialization = html.slice(html.indexOf("// 初期化"), html.indexOf("</script>", html.indexOf("// 初期化")));
assert.equal(
  /\brender\(/u.test(initialization),
  false,
  "page initialization must not automatically run the simulation"
);
assert.match(initialization, /markInputsDirty\(\)/u);

assert.match(
  html,
  /表示中の数字は前回の結果です。上の計算ボタンを押すと更新します。/u
);
assert.match(
  html,
  /ready=!inputDirty&&coreConfirmed\(\)&&inputValid&&fullResultReady&&mn1TransferReady/u,
  "stale results must not be copied to the advisor memo"
);
assert.match(
  html,
  /条件を変更しました。計算ボタンを押すと、相談メモも新しい条件で作り直します。/u,
  "stale advisor memo and reproduction code must be scrubbed"
);
assert.match(encoder, /CONTRACT = "MN2"/u);
assert.match(encoder, /ENGINE_VERSION = "v25"/u);

console.log("Member explicit calculation interaction contract: PASS");
console.log("automaticHeavyCalculationPaths=0");
console.log("explicitCalculationButtons=1");
console.log("staleMemoCopyBlocked=true");
console.log("busyDraftControlsLocked=true");
console.log("transferContract=MN2/v25");
