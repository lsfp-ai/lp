"use strict";
// 「増え方◯%」を「毎年◯%」や「長期の年平均◯%」と誤解させない（2026-11-04 計算監査 M-2）。
// 計算は月次の対数正規：1年あたりの平均＝e^μ−1、真ん中の結果の年平均＝e^(μ−σ²/2)−1。
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const html = fs.readFileSync(path.join(__dirname, "../ideco-mirai-navi/index.html"), "utf8");

assert.doesNotMatch(html, /長い期間で見た年平均の増え方を/u, "old wording that equates mu with the long-run annual average");
assert.match(html, /Math\.exp\(styleMu\/100\)-1/u, "mean growth uses e^mu-1");
assert.match(html, /Math\.exp\(styleMu\/100-Math\.pow\(styleSig\/100,2\)\/2\)-1/u, "median growth uses e^(mu-sigma^2/2)-1");
// 初期表示（ケースB 7%・15%）の静的文言が計算式の値と一致する
const fmt = (x) => (x * 100).toFixed(1);
const mean = fmt(Math.exp(0.07) - 1), median = fmt(Math.exp(0.07 - 0.15 ** 2 / 2) - 1);
assert.equal(mean, "7.3"); assert.equal(median, "6.1");
assert.match(html, new RegExp(`平均の増え方は約${mean.replace(".", "\\.")}%、2,000通りの真ん中の結果を年平均に直すと約${median.replace(".", "\\.")}%`, "u"));
console.log(`member return wording: PASS caseB mean=${mean}% median=${median}%`);
