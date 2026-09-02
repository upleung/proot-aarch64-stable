const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const AUTO_UNZIP = true; 

const TAR_FILENAME = 'alpine-minirootfs-3.22.3-x86_64.tar.gz';

const prootPath = path.join(__dirname, 'bin/proot');
const rootfsPath = path.join(__dirname, 'my-linux/alpine');
const tarPath = path.join(rootfsPath, TAR_FILENAME); 

if (AUTO_UNZIP) {
    console.log('🔄 正在检查解压任务...');
    
    if (fs.existsSync(tarPath)) {
        try {
            console.log(`📦 发现压缩包，开始解压: ${TAR_FILENAME}`);
            console.log('⏳ 请稍候，这可能需要几秒钟...');

            execSync(`tar -xzf "${tarPath}" -C "${rootfsPath}"`, { stdio: 'inherit' });
            
            console.log('✅ 解压完成！');
            
            
        } catch (error) {
            console.error('❌ 解压失败:', error.message);
            console.error('⚠️ 将尝试继续启动，但系统可能不完整。');
        }
    } else {
        console.log(`⚠️ 未找到压缩包: ${TAR_FILENAME}，跳过解压。`);
    }
}

if (fs.existsSync(prootPath)) {
    try {
        fs.chmodSync(prootPath, '0755');
    } catch (e) {
        
    }
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
    '/bin/sh'
];

console.log(`🚀 正在启动 PRoot...\n📂 Rootfs: ${rootfsPath}`);

const child = spawn(prootPath, args, {
    stdio: 'inherit',
    env: { ...process.env, TERM: 'xterm-256color' }
});

child.on('close', (code) => {
    console.log(`PRoot 系统已退出，代码: ${code}`);
});

child.on('error', (err) => {
    console.error('启动失败，请检查 bin/proot 是否存在。', err);
});