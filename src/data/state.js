const fs = require('fs');
const path = require('path');

const STATE_DIR = path.join(process.cwd(), '.state');
const STATE_FILE = path.join(STATE_DIR, 'test-state.json');

function ensureDir() {
  if (!fs.existsSync(STATE_DIR)) {
    fs.mkdirSync(STATE_DIR, { recursive: true });
  }
}

function saveState(data) {
  ensureDir();
  const existing = loadState();
  const merged = { ...existing, ...data };
  fs.writeFileSync(STATE_FILE, JSON.stringify(merged, null, 2));
}

function loadState() {
  if (!fs.existsSync(STATE_FILE)) return {};
  return JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
}

function clearState() {
  if (fs.existsSync(STATE_FILE)) {
    fs.unlinkSync(STATE_FILE);
  }
}

module.exports = {
  saveState,
  loadState,
  clearState,
};
