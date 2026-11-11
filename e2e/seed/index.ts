import { clean, rebuild } from './clean.ts';
import { SeedError, assertLocalTargets } from './config.ts';
import { seed } from './seed.ts';

const commands: Record<string, () => Promise<void>> = {
  seed,
  clean,
  reset: async () => { await clean(); await seed(); },
  rebuild: async () => { await rebuild(); await seed(); },
};

const name = process.argv[2] ?? '';
const run = commands[name];
if (!run) {
  console.error(`Usage: node e2e/seed/index.ts <${Object.keys(commands).join('|')}>`);
  process.exit(2);
}
Promise.resolve().then(assertLocalTargets).then(run).then(
  () => process.exit(0),
  (error) => {
    console.error(error instanceof SeedError ? `\nSEED ERROR: ${error.message}` : error);
    process.exit(1);
  },
);
