"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const sourcePath = path.join(root, "ideco-mirai-navi/mn1_member_encoder.js");
const htmlPath = path.join(root, "ideco-mirai-navi/index.html");
const begin = "<!-- MN1_MEMBER_ENCODER_BEGIN -->";
const end = "<!-- MN1_MEMBER_ENCODER_END -->";

const source = fs.readFileSync(sourcePath, "utf8").trimEnd();
const html = fs.readFileSync(htmlPath, "utf8");
assert.equal(html.split(begin).length - 1, 1, "one encoder begin marker");
assert.equal(html.split(end).length - 1, 1, "one encoder end marker");

const before = html.slice(0, html.indexOf(begin) + begin.length);
const after = html.slice(html.indexOf(end));
const output = `${before}\n<script>\n${source}\n</script>\n${after}`;
fs.writeFileSync(htmlPath, output);

console.log("MN1 member HTML build: PASS");
console.log("target=ideco-mirai-navi/index.html");
