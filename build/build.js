import chalk from 'chalk';
import fs from 'fs/promises';

async function copyFiles() {
    await fs.copyFile('./package.json', './dist/package.json');
    await fs.copyFile('./README.md', './dist/README.md');
    await fs.copyFile('./bin/tagger.js', './dist/bin/tagger.js');
}

await fs.mkdir('./dist', {recursive: true});
await fs.mkdir('./dist/bin', {recursive: true});

console.log(chalk.white('\n Copy files'));
await copyFiles();
console.log(chalk.green('\n Task completed!'));