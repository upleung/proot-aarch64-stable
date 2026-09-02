const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const SSH_PORT = '24631';

const prootPath = path.join(__dirname, 'bin/proot');
const rootfsPath = path.join(__dirname, 'my-linux/alpine');

if (fs.existsSync(prootPath)) {
    try { fs.chmodSync(prootPath, '0755'); } catch (e) {}
}

const args = [
    '--link2symlink',
    '-0',
    '-r', rootfsPath,
    '-b', '/dev',
    '-b', '/proc',
    '-b', '/sys',
    '-b', '/etc/resolv.conf:/etc/resolv.conf',
    '-w', '/root',
    
    '/bin/sh', '-c', 
    `/usr/sbin/dropbear -r /etc/dropbear/dropbear_rsa_host_key -p ${SSH_PORT} && echo "✅ SSH 服务已启动! 端口: ${SSH_PORT}" && /bin/sh`
];

console.log(`🚀 正在启动系统...`);

const child = spawn(prootPath, args, {
    stdio: 'inherit',
    env: { ...process.env, TERM: 'xterm-256color' }
});

child.on('close', (code) => {
    console.log(`系统退出，代码: ${code}`);
});