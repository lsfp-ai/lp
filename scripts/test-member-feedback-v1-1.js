"use strict";

const assert = require("node:assert/strict");
const crypto = require("node:crypto");
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
const changelog = fs.readFileSync(
  path.join(root, "ideco-mirai-navi/CHANGELOG.md"),
  "utf8"
);

assert.match(html, /data-app-version="v1\.3\.0"/u);
assert.match(html, /data-release-date="2026-07-28"/u);
assert.match(html, /querySelectorAll\("\[data-app-version-label\]"\)/u);
assert.match(html, /querySelectorAll\("\[data-release-date-label\]"\)/u);
assert.equal(
  html.includes('querySelectorAll("[data-app-version]")'),
  false,
  "the document root stores the version and must never be replaced as a label"
);
assert.equal(
  html.includes('querySelectorAll("[data-release-date]")'),
  false,
  "the document root stores the release date and must never be replaced as a label"
);
assert.equal(manifest.uiVersion, "v1.3.0");
assert.equal(manifest.calculationEngineVersion, "v27");
assert.equal(manifest.transferContractVersion, "MN4");
assert.equal(manifest.calculationChanged, true);
assert.equal(manifest.feedbackStatus, "reflected");
const coreMarker = "// ===== 加入者版計算核（MN4共有結果はアドバイザー版と別の出力parity検査で照合）=====";
const coreStart = html.indexOf(coreMarker);
const coreEndMarker = "// ===== 計算核ここまで =====";
const coreEnd = html.indexOf(coreEndMarker);
assert.ok(coreStart >= 0 && coreEnd > coreStart, "calculation core markers");
const coreCodeStart = html.indexOf("\n", coreStart) + 1;
const calculationCore = html.slice(
  coreCodeStart,
  coreEnd
).trimEnd();
assert.equal(
  crypto.createHash("sha256").update(calculationCore).digest("hex"),
  manifest.calculationCoreSha256,
  "calculation core hash must match the version manifest"
);
assert.match(changelog, /画面版 v1\.3\.0／計算版 v27/u);
assert.match(changelog, /画面版 v1\.1\.0/u);
assert.match(changelog, /画面版 v1\.0\.0（改訂前の基準版）/u);
assert.match(changelog, new RegExp(manifest.previousBaselineCommit, "u"));

for (const id of ["ageN", "monN", "drawN", "spendN"]) {
  assert.equal(
    (html.match(new RegExp(`id="${id}"`, "gu")) || []).length,
    1,
    `${id} must exist exactly once`
  );
}
for (const pair of [
  ["age", "ageN"],
  ["mon", "monN"],
  ["draw", "drawN"],
  ["spend", "spendN"],
]) {
  assert.match(
    html,
    new RegExp(`bindRangeNumber\\("${pair[0]}","${pair[1]}"`, "u"),
    `${pair[0]} and ${pair[1]} must be synchronized`
  );
}
assert.match(html, /inputmode="numeric"/u);
assert.match(html, /inputmode="decimal"/u);
assert.match(
  html,
  /変更中は計算せず、最後に計算ボタンを押します。/u
);
assert.match(
  html,
  /monRaw=monNumber\.value\.trim\(\),previousMon=monRaw===""\?NaN:Number\(monRaw\)/u,
  "an empty direct monthly input must not silently move the slider to zero"
);
assert.match(
  html,
  /value>=min&&value<=max&&onStep/u,
  "off-step direct values must not be copied to the slider before validation"
);
assert.match(
  html,
  /if\(raw!==""&&Number\.isFinite\(value\)&&value>=min&&value<=max&&onStep\)\{\s*number\.value=/u,
  "empty and off-step direct values must not be normalized on change"
);

const inputWiring = html.slice(
  html.indexOf("const coreTouched="),
  html.indexOf("// MN1_MEMBER_TRANSFER_UI_BEGIN")
);
for (const forbidden of [
  "render(",
  "simulate(",
  "simulateForUi(",
  "affordProbBand(",
  "desiredSurvivalCached(",
  "solveAffordableProb(",
]) {
  assert.equal(
    inputWiring.includes(forbidden),
    false,
    `direct input must not start heavy calculation: ${forbidden}`
  );
}

assert.match(
  html,
  /積立シミュレーション（まず4項目）/u
);
assert.match(
  html,
  /増え方（リターン）と値動き（リスク）の3つの例/u
);
assert.match(
  html,
  /積立から取り崩しまでの見通し/u
);
assert.match(
  html,
  /入力した積立の見通しを整理します。/u
);
assert.match(
  html,
  /ここで指定する年齢は<b>仮の値<\/b>です。/u
);
assert.equal(
  html.includes("※ 65歳は"),
  false,
  "the withdrawal-age guidance must not contradict a direct age input"
);

assert.match(html, /id="rDepletionAge"/u);
assert.match(html, /depletionAge=S\.sDep\[qn\]/u);
assert.match(html, /depletionAgeP40:D\.depletionAge/u);
assert.match(
  html,
  /2,000通りを早く尽きる順に並べ、小さいほうから40%の位置/u
);
assert.match(
  html,
  /希望月額で資産が持つ年齢の目安（2,000通り・小さいほうから40%）/u
);
assert.match(
  html,
  /画面版：\$\{APP_VERSION\}（\$\{APP_RELEASE_DATE\}）／再現：\$\{MN1MemberEncoder\.CONTRACT\}／計算版：\$\{MN1MemberEncoder\.ENGINE_VERSION\}/u
);
assert.match(
  html,
  /\[hidden\]\{display:none!important\}/u,
  "calculated result must not keep showing the hidden 未計算 chip"
);

assert.match(html, /const ENGINE_VERSION = "v27"/u);
assert.match(html, /spendMode\};/u);
assert.doesNotMatch(html, /const normalizedFlatCfg=/u);
assert.match(html, /同じ額面のまま/u);
assert.match(html, /物価に合わせて毎年増やす/u);
assert.match(html, /この率は「今の価値」への換算だけに使います/u);
assert.match(html, /表示だけを切り替えます。/u);
assert.match(html, /今回の反映：取り崩し方法を明示選択できるようにし、物価上昇率を常に確認できる位置へ移しました。/u);

console.log("Member v1.3.0 withdrawal-mode contract: PASS");
console.log("directNumericInputs=4");
console.log("automaticHeavyCalculationPaths=0");
console.log("depletionAgeSource=2,000-path p40");
console.log("calculationEngine=v27/spendMode=flat|keep");
