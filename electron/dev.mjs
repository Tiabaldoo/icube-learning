import { spawn } from 'node:child_process';
import electron from 'electron';
import { createServer } from 'vite';

const server = await createServer({
  mode: 'desktop',
  server: { host: '127.0.0.1', port: 5173, strictPort: true },
});
await server.listen();
const child = spawn(electron, ['.'], {
  stdio: 'inherit',
  env: { ...process.env, AICUBE_DESKTOP_DEV_URL: 'http://127.0.0.1:5173/' },
});
let stopping = false;
async function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  child.kill();
  await server.close();
  process.exit(code);
}
child.on('error', error => { console.error(error); void stop(1); });
child.on('exit', code => void stop(code ?? 0));
process.on('SIGINT', () => void stop());
process.on('SIGTERM', () => void stop());
