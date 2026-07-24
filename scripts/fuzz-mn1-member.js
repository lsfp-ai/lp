"use strict";

const assert = require("node:assert/strict");
const encoder = require("../ideco-mirai-navi/mn1_member_encoder.js");

const iterations = Number(process.env.MN1_MEMBER_FUZZ_N || 50000);

function mulberry32(seed) {
  return function random() {
    let value = (seed += 0x6d2b79f5);
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

const random = mulberry32(20260724);
const int = (min, max) => min + Math.floor(random() * (max - min + 1));
const pick = (values) => values[int(0, values.length - 1)];

const crcTable = new Uint32Array(256);
for (let index = 0; index < 256; index += 1) {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) {
    value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  }
  crcTable[index] = value >>> 0;
}

function referenceCrc32(text) {
  let crc = 0xffffffff;
  for (const byte of Buffer.from(text, "utf8")) {
    crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return ((crc ^ 0xffffffff) >>> 0).toString(16).padStart(8, "0");
}

function randomEnvelope() {
  const scheme = pick(["idecoplus", "corporate", "unknown"]);
  const limit62 = random() < 0.25;
  const age = int(20, 64);
  const drawAge = int(Math.max(60, age + 1), 74);
  const maxAge = pick([90, 95, 100]);
  const caseId = pick(["A", "B", "C"]);
  const caseValues = { A: [4, 8], B: [7, 15], C: [9, 20] }[caseId];
  const capTenths = limit62 ? 62 : scheme === "idecoplus" ? 23 : 55;
  const desiredMonthlyWan = int(1, 80) / 2;
  const affordableLow = int(0, 80) / 2;
  const affordableHigh = int(Math.round(affordableLow * 2), 100) / 2;
  const affordableRealLow = int(0, Math.round(affordableLow * 2)) / 2;
  const affordableRealHigh =
    int(Math.round(affordableRealLow * 2), Math.round(affordableHigh * 2)) / 2;
  const survivalLow = int(0, 1000) / 10;
  const survivalHigh = int(Math.round(survivalLow * 10), 1000) / 10;
  const totalNominalWan = int(0, 100000);
  const startBalanceNominalWan = int(0, 100000);

  return {
    contract: "MN1",
    engine: "v24",
    inputs: {
      scheme,
      limit62,
      age,
      balanceWan: int(0, 10000),
      monthlyWan: int(0, capTenths) / 10,
      drawAge,
      maxAge,
      caseId,
      inflationPct: pick([1, 2, 3]),
      desiredMonthlyWan,
      targetPct: pick([80, 90]),
      muPct: caseValues[0],
      sigmaPct: caseValues[1],
    },
    expected: {
      totalNominalWan,
      totalRealWan: int(0, totalNominalWan),
      startBalanceNominalWan,
      startBalanceRealWan: int(0, startBalanceNominalWan),
      desiredMonthlyRealWan: int(0, Math.round(desiredMonthlyWan * 10)) / 10,
      affordableNominalWanRange: [affordableLow, affordableHigh],
      affordableRealWanRange: [affordableRealLow, affordableRealHigh],
      desiredSurvivalPctRange: [survivalLow, survivalHigh],
      feasibleAllSeeds: random() < 0.9,
    },
  };
}

function invalidEnvelope(envelope, index) {
  const value = structuredClone(envelope);
  switch (index % 10) {
    case 0:
      value.contract = "MN2";
      break;
    case 1:
      value.engine = "v25";
      break;
    case 2:
      value.inputs.age = 19;
      break;
    case 3:
      value.inputs.monthlyWan = 6.3;
      break;
    case 4:
      value.inputs.balanceWan = 10001;
      break;
    case 5:
      value.inputs.muPct += 1;
      break;
    case 6:
      value.expected.totalRealWan = value.expected.totalNominalWan + 1;
      break;
    case 7:
      value.expected.desiredMonthlyRealWan = value.inputs.desiredMonthlyWan + 0.1;
      break;
    case 8:
      value.expected.desiredSurvivalPctRange = [50, 49.9];
      break;
    default:
      value.extra = "reject";
      break;
  }
  return value;
}

let roundTrips = 0;
let independentCrcChecks = 0;
let invalidRejects = 0;
for (let index = 0; index < iterations; index += 1) {
  const envelope = randomEnvelope();
  const code = encoder.encodeEnvelope(envelope);
  const parts = code.split(".");
  assert.equal(parts.length, 3);
  assert.equal(parts[0], "MN1");
  assert.equal(parts[2], referenceCrc32(parts[1]));
  independentCrcChecks += 1;

  const decoded = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
  assert.deepStrictEqual(decoded, envelope);
  roundTrips += 1;

  assert.throws(() => encoder.encodeEnvelope(invalidEnvelope(envelope, index)));
  invalidRejects += 1;
}

console.log("MN1 member encoder fuzz: PASS");
console.log(`iterations=${iterations}`);
console.log(`roundTrips=${roundTrips}`);
console.log(`independentCrcChecks=${independentCrcChecks}`);
console.log(`invalidRejects=${invalidRejects}`);
console.log("seed=20260724");
