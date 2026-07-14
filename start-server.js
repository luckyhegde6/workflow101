const { spawn } = require('child_process');
const cp = spawn('npx.cmd', ['next', 'dev', '--port', '3000'], {
  cwd: __dirname,
  stdio: ['ignore', 'pipe', 'pipe'],
  detached: true,
  shell: true,
});
cp.stdout.on('data', d => require('fs').appendFileSync(__dirname + '/dev-server.log', d));
cp.stderr.on('data', d => require('fs').appendFileSync(__dirname + '/dev-server.log', d));
cp.unref();
console.log('Server PID:', cp.pid);
