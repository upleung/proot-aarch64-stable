const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const WORK_DIR = '/home/container';
const TAR_PATH = path.join(WORK_DIR, 'debian-rootfs.tar.xz');
const ROOTFS_DIR = path.join(WORK_DIR, 'rootfs');
const PROOT_BIN = path.join(WORK_DIR, 'proot');
const TMP_PROOT = '/tmp/proot'; // 绕过 noexec 限制

console.log('🔄 正在检查解压任务...');
if (fs.existsSync(TAR_PATH) && !fs.existsSync(path.join(ROOTFS_DIR, 'bin'))) {
    try {
        console.log('📦 发现压缩包，开始解压，请稍候...');
        fs.mkdirSync(ROOTFS_DIR, { recursive: true });
        execSync(`tar -xJf "${tarPath}" -C "${rootfsPath}"`, { stdio: 'inherit' });
        console.log('✅ 解压完成！');
    } catch (error) {
        console.error('❌ 解压失败:', error.message);
    }
}

// 复制到 /tmp 赋予执行权限
if (fs.existsSync(PROOT_BIN)) {
    fs.copyFileSync(PROOT_BIN, TMP_PROOT);
    fs.chmodSync(TMP_PROOT, '0755');
}

// 剔除 -b /sys 防止 TTY 死锁
const args = [
    '--link2symlink', '-0',
    '-r', ROOTFS_DIR,
    '-b', '/dev', '-b', '/proc', '-b', '/etc/resolv.conf',
    '-b', `${WORK_DIR}:/home`,
    '-w', '/root',
    '/bin/sh'
];

console.log(`🚀 正在启动 PRoot...`);
const child = spawn(TMP_PROOT, args, {
    stdio: 'inherit', // 绑定控制台输入输出
    env: { ...process.env, PROOT_NO_SECCOMP: '1', TERM: 'xterm-256color' }
});