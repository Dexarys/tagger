import chalk from 'chalk';
import fs from 'fs';

async function copyFiles() {
    await fs.copyFile('./package.json', './dist/package.json', () => {});
    await fs.copyFile('./README.md', './dist/README.md', () => {});
    await fs.copyFile('./bin/tagger.js', './dist/tagger.js', () => {});
}

fs.mkdir('./dist', () => {});
chalk.white('\n Copy files');
await copyFiles();
chalk.green('\n Task completed!');