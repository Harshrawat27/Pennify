#!/usr/bin/env node
/**
 * Patches @expo/ngrok to work with ngrok v3.
 * Run automatically via postinstall.
 *
 * Changes:
 * 1. Replaces bundled ngrok v2 binary with system ngrok v3
 * 2. Strips fields rejected by ngrok v3 tunnel API (authtoken, configPath, port, etc.)
 * 3. Fixes config path to ngrok v3 location
 */

const fs = require("fs");
const path = require("path");
const os = require("os");

const NM = path.join(__dirname, "node_modules");

// 1. Replace ngrok binary
const binaryDest = path.join(NM, "@expo/ngrok-bin-darwin-arm64/ngrok");
const binarySrc = "/opt/homebrew/bin/ngrok";
if (fs.existsSync(binarySrc) && fs.existsSync(path.dirname(binaryDest))) {
  fs.copyFileSync(binarySrc, binaryDest);
  fs.chmodSync(binaryDest, 0o755);
  console.log("✓ Replaced ngrok v2 binary with system ngrok v3");
}

// 2. Patch index.js — strip invalid fields before startTunnel API call
const indexPath = path.join(NM, "@expo/ngrok/index.js");
let index = fs.readFileSync(indexPath, "utf8");
const oldConnect = `async function connectRetry(opts, retryCount = 0) {
  opts.name = String(opts.name || uuid.v4());
  try {
    const response = await ngrokClient.startTunnel(opts);`;
const newConnect = `async function connectRetry(opts, retryCount = 0) {
  opts.name = String(opts.name || uuid.v4());
  // Strip fields not accepted by ngrok v3 HTTP tunnel API
  const { authtoken, configPath, port, host, httpauth, region, ...tunnelOpts } = opts;
  try {
    const response = await ngrokClient.startTunnel(tunnelOpts);`;
if (index.includes(oldConnect)) {
  fs.writeFileSync(indexPath, index.replace(oldConnect, newConnect));
  console.log("✓ Patched @expo/ngrok/index.js for ngrok v3 API");
} else if (index.includes("tunnelOpts")) {
  console.log("✓ @expo/ngrok/index.js already patched");
}

// 3. Patch utils.js — fix config path to ngrok v3 location
const utilsPath = path.join(NM, "@expo/ngrok/src/utils.js");
let utils = fs.readFileSync(utilsPath, "utf8");
const oldPath = `return join(homedir(), ".ngrok2", "ngrok.yml");`;
const newPath = `return join(homedir(), "Library", "Application Support", "ngrok", "ngrok.yml");`;
if (utils.includes(oldPath)) {
  fs.writeFileSync(utilsPath, utils.replace(oldPath, newPath));
  console.log("✓ Patched @expo/ngrok/src/utils.js config path for ngrok v3");
} else if (utils.includes("Application Support")) {
  console.log("✓ @expo/ngrok/src/utils.js already patched");
}
