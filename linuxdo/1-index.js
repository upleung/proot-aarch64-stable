const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const WORK_DIR = '/home/container';
const PROOT_BIN = path.join(WORK_DIR, 'bin/proot');
const ROOTFS_DIR = path.join(WORK_DIR, 'my-linux/debian');
const TAR_PATH = path.join(WORK_DIR, 'src/img/debian-rootfs.tar.xz');

console.log('🔄 正在初始化环境并自动拉取资源...');

// 1. 自动创建所有规范文件夹
const dirs = ['bin', 'my-linux/debian', 'src/js', 'src/img'];
dirs.forEach(dir => {
    const dirPath = path.join(WORK_DIR, dir);
    if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
});

// 2. 自动下载核心资源与脚本 (不存在才下载)
if (!fs.existsSync(PROOT_BIN)) {
    console.log('⬇️ 正在下载自编译 PRoot...');
    execSync(`curl -Lo "${PROOT_BIN}" https://github.com/upleung/proot-debian-ssh/raw/refs/heads/master/linuxdo/proot`, { stdio: 'inherit' });
    fs.chmodSync(PROOT_BIN, '0755'); // 赋予执行权限
}

if (!fs.existsSync(TAR_PATH)) {
    console.log('⬇️ 正在下载 Debian RootFS...');
    execSync(`curl -Lo "${TAR_PATH}" "https://mirrors.tuna.tsinghua.edu.cn/lxc-images/images/debian/bookworm/arm64/default/20260901_05%3A24/rootfs.tar.xz"`, { stdio: 'inherit' });
}

const js1Path = path.join(WORK_DIR, 'src/js/1-index.js');
if (!fs.existsSync(js1Path)) {
    console.log('⬇️ 正在保存备份 1-index.js...');
    execSync(`curl -Lo "${js1Path}" https://github.com/upleung/proot-debian-ssh/raw/refs/heads/master/linuxdo/1-index.js`, { stdio: 'inherit' });
}

const js2Path = path.join(WORK_DIR, 'src/js/2-index.js');
if (!fs.existsSync(js2Path)) {
    console.log('⬇️ 正在保存备份 2-index.js...');
    execSync(`curl -Lo "${js2Path}" https://github.com/upleung/proot-debian-ssh/raw/refs/heads/master/linuxdo/2.index.js`, { stdio: 'inherit' });
}

// 3. 自动解压 Debian (.xz 格式使用 -xJf)
if (fs.existsSync(TAR_PATH) && !fs.existsSync(path.join(ROOTFS_DIR, 'bin'))) {
    try {
        console.log('📦 发现压缩包，开始解压，请稍候...');
        execSync(`tar -xJf "${TAR_PATH}" -C "${ROOTFS_DIR}"`, { stdio: 'inherit' });
        console.log('✅ 解压完成！');
    } catch (error) {
        console.error('❌ 解压失败:', error.message);
    }
}

// 4. 直接从 bin/proot 启动系统，剔除 /tmp 中转
const args = [
    '-0',
    '-r', ROOTFS_DIR,
    '-b', '/dev', '-b', '/proc', '-b', '/etc/resolv.conf',
    '-b', `${WORK_DIR}:/home`,
    '-w', '/root',
    '/bin/bash'
];

console.log(`🚀 正在启动 PRoot (Debian)...`);
const child = spawn(PROOT_BIN, args, {
    stdio: 'inherit',
    env: { ...process.env, PROOT_NO_SECCOMP: '1', TERM: 'xterm-256color' }
});

child.on('close', (code) => {
    console.log(`系统退出，代码: ${code}`);
});
