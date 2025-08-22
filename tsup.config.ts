import { defineConfig } from 'tsup';
import { promises as fs } from 'fs';
import path from 'path';

export default defineConfig({
  entry: ['src/index.ts', 'bin/git-bn.ts'],
  format: ['cjs'],
  dts: {
    entry: 'src/index.ts'
  },
  clean: true,
  splitting: false,
  sourcemap: false,
  target: 'node16',
  platform: 'node',
  // 使用 ES Module 兼容的方式处理 shebang
  async onSuccess() {
    try {
      // 为 CLI 文件添加 shebang
      const cliFile = path.join(__dirname, 'dist', 'bin', 'git-bn.js');
      
      // 检查文件是否存在
      try {
        await fs.access(cliFile);
      } catch {
        console.log('CLI file not found, skipping shebang addition');
        return;
      }
      
      let content = await fs.readFile(cliFile, 'utf8');
      
      // 确保文件开头有 shebang
      if (!content.startsWith('#!/usr/bin/env node\n')) {
        content = '#!/usr/bin/env node\n' + content;
        await fs.writeFile(cliFile, content);
      }
      
      // 设置执行权限
      await fs.chmod(cliFile, 0o755);
      
      console.log('Shebang added successfully!');
    } catch (error) {
      console.error('Error adding shebang:', error);
    }
  }
});