import * as fs from 'fs';
import * as path from 'path';

const STATE_DIR = path.join(process.cwd(), '.state');
const STATE_FILE = path.join(STATE_DIR, 'test-state.json');

interface TestState {
  patientId?: string;
  episodeId?: string;
  patientName?: string;
  mrn?: string;
  taskId?: string;
  [key: string]: any;
}

function ensureDir(): void {
  if (!fs.existsSync(STATE_DIR)) {
    fs.mkdirSync(STATE_DIR, { recursive: true });
  }
}

export function saveState(data: Partial<TestState>): void {
  ensureDir();
  const existing = loadState();
  const merged = { ...existing, ...data };
  fs.writeFileSync(STATE_FILE, JSON.stringify(merged, null, 2));
}

export function loadState(): TestState {
  if (!fs.existsSync(STATE_FILE)) return {};
  return JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
}

export function clearState(): void {
  if (fs.existsSync(STATE_FILE)) {
    fs.unlinkSync(STATE_FILE);
  }
}
