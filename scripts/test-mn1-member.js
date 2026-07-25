"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { TextEncoder } = require("node:util");
const encoder = require("../ideco-mirai-navi/mn1_member_encoder.js");

const envelope = {
  contract: "MN1",
  engine: "v25",
  inputs: {
    scheme: "unknown",
    limit62: false,
    age: 45,
    balanceWan: 500,
    monthlyWan: 2,
    drawAge: 65,
    maxAge: 95,
    caseId: "B",
    inflationPct: 2,
    desiredMonthlyWan: 15,
    targetPct: 80,
    muPct: 7,
    sigmaPct: 15,
  },
  expected: {
    totalNominalWan: 980,
    totalRealWan: 896,
    startBalanceNominalWan: 2236,
    startBalanceRealWan: 1505,
    desiredMonthlyRealWan: 10.1,
    affordableNominalWanRange: [7.5, 8],
    affordableRealWanRange: [5, 5.5],
    desiredSurvivalPctRange: [45, 50.3],
    feasibleAllSeeds: true,
  },
};

const golden =
  "MN1.eyJjb250cmFjdCI6Ik1OMSIsImVuZ2luZSI6InYyNSIsImlucHV0cyI6eyJzY2hlbWUiOiJ1bmtub3duIiwibGltaXQ2MiI6ZmFsc2UsImFnZSI6NDUsImJhbGFuY2VXYW4iOjUwMCwibW9udGhseVdhbiI6MiwiZHJhd0FnZSI6NjUsIm1heEFnZSI6OTUsImNhc2VJZCI6IkIiLCJpbmZsYXRpb25QY3QiOjIsImRlc2lyZWRNb250aGx5V2FuIjoxNSwidGFyZ2V0UGN0Ijo4MCwibXVQY3QiOjcsInNpZ21hUGN0IjoxNX0sImV4cGVjdGVkIjp7InRvdGFsTm9taW5hbFdhbiI6OTgwLCJ0b3RhbFJlYWxXYW4iOjg5Niwic3RhcnRCYWxhbmNlTm9taW5hbFdhbiI6MjIzNiwic3RhcnRCYWxhbmNlUmVhbFdhbiI6MTUwNSwiZGVzaXJlZE1vbnRobHlSZWFsV2FuIjoxMC4xLCJhZmZvcmRhYmxlTm9taW5hbFdhblJhbmdlIjpbNy41LDhdLCJhZmZvcmRhYmxlUmVhbFdhblJhbmdlIjpbNSw1LjVdLCJkZXNpcmVkU3Vydml2YWxQY3RSYW5nZSI6WzQ1LDUwLjNdLCJmZWFzaWJsZUFsbFNlZWRzIjp0cnVlfX0.3a4097b5";

assert.equal(encoder.encodeEnvelope(envelope), golden, "Node golden encode");
assert.throws(
  () =>
    encoder.encodeEnvelope({
      ...envelope,
      inputs: { ...envelope.inputs, balanceWan: 10000.1 },
    }),
  /inputs\.balanceWan/u
);
assert.throws(
  () =>
    encoder.encodeEnvelope({
      ...envelope,
      expected: {
        ...envelope.expected,
        totalNominalWan: Number.MAX_SAFE_INTEGER + 1,
      },
    }),
  /expected\.totalNominalWan/u
);

const source = fs.readFileSync(
  path.join(__dirname, "../ideco-mirai-navi/mn1_member_encoder.js"),
  "utf8"
);
const sandbox = {
  TextEncoder,
  Uint8Array,
  btoa(value) {
    return Buffer.from(value, "binary").toString("base64");
  },
};
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
vm.runInContext(source, sandbox);
assert.equal(
  sandbox.MN1MemberEncoder.encodeEnvelope(
    vm.runInContext(`(${JSON.stringify(envelope)})`, sandbox)
  ),
  golden,
  "browser-like golden encode"
);

console.log("MN1 member encoder tests: PASS");
console.log("goldenCodes=1");
console.log("runtime=node + browser-like no module/no Buffer");
