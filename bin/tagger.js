#!/usr/bin/env node

/// tagger - simple CLI tool to bump version & generate changelog

import chalk from 'chalk';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const projectRoot = process.cwd();
const IGNORED_DEFAULT = ['node_modules', 'dist', '.git'];
const IGNORED_PATHS = new Set(
  fs.existsSync('.taggerignore')
    ? fs.readFileSync('.taggerignore', 'utf-8')
        .split('\n')
        .map(line => line.trim())
        .filter(line => !!line && !line.startsWith('#'))
    : IGNORED_DEFAULT
);

const args = process.argv.slice(2);
const pathArg = args.find(arg => arg.startsWith('--multi='));
const useMulti = pathArg ? pathArg.split('=')[1] : true;

function isIgnored(relativePath) {
  return [...IGNORED_PATHS].some(ignored => relativePath.startsWith(ignored));
}

function run(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf-8' }).trim();
  } catch (err) {
    return ''; 
  }
}

function detectBump(commits) {
  if (commits.some(m => /BREAKING CHANGE|!:/.test(m))) return 'major';
  if (commits.some(m => /^feat(\(.+\))?:/.test(m))) return 'minor';
  if (commits.some(m => /^fix(\(.+\))?:/.test(m))) return 'patch';
  if (commits.some(m => /^revert(\(.+\))?:/.test(m))) return 'patch';
  if (commits.some(m => /^perf(\(.+\))?:/.test(m))) return 'patch';
  return 'none';
}

function bumpVersion(current, bump) {
  const [major, minor, patch] = current.split('.').map(Number);
  if (bump === 'major') return `${major + 1}.0.0`;
  if (bump === 'minor') return `${major}.${minor + 1}.0`;
  if (bump === 'patch') return `${major}.${minor}.${patch + 1}`;
}

function categorizeCommits(commits) {
  const types = {
    feat: [],
    fix: [],
    docs: [],
    refactor: [],
    chore: [],
    style: [],
    test: [],
    perf: [],
    build: [],
    ci: [],
    revert: [],
    other: []
  };

  for (const message of commits) {
    const match = message.match(/^(\w+)(\(.+\))?:\s(.+)/);
    if (match) {
      const [_, type, , description] = match;
      if (types[type]) {
        types[type].push(`- ${description}`);
      } else {
        types.other.push(`- ${message}`);
      }
    } else {
      types.other.push(`- ${message}`);
    }
  }

  return types;
}

function findPackages(dir, baseDir = dir) {
  let results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = path.relative(baseDir, fullPath);

    if (isIgnored(relativePath)) continue;

    if (entry.isDirectory()) {
      results = results.concat(findPackages(fullPath, baseDir));
    } else if (entry.isFile() && entry.name === 'package.json') {
      results.push(fullPath);
    }
  }

  return results;
}

const packageRoot = path.join(projectRoot, 'package.json');
const packages = useMulti ? findPackages(projectRoot) : packageRoot;
const changelogPath = path.join(projectRoot, 'CHANGELOG.md');

const lastTag = run('git describe --tags --abbrev=0');
const commitRange = lastTag ? `${lastTag}..HEAD` : 'HEAD';
const rawCommits = run(`git log ${commitRange} --pretty=format:"%s"`).split('\n').filter(Boolean);

const bump = detectBump(rawCommits);
if (bump !== 'none') {
  const pkgRoot = JSON.parse(fs.readFileSync(packageRoot, 'utf-8'));
  const nextVersion = bumpVersion(pkgRoot.version ?? '0.0.0', bump);
  
  console.log(chalk.yellow(`\n> Releasing: ${nextVersion} (${bump})\n`));
  
  packages.forEach(packagePath => {
    const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
    pkg.version = nextVersion;
    fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2));
  });

  const categorized = categorizeCommits(rawCommits);

  let changelogEntry = `## v${nextVersion} - ${new Date().toISOString().slice(0, 10)}\n`;

  const sectionLabels = {
    feat: '✨ Features',
    fix: '🐛 Fixes',
    docs: '📝 Documentation',
    refactor: '♻️ Refactors',
    perf: '⚡ Performance',
    style: '🎨 Code Style',
    test: '✅ Tests',
    build: '🏗️ Build',
    ci: '🔧 CI/CD',
    chore: '🧹 Chores',
    revert: '⏪ Reverts',
    other: '📦 Others'
  };

  for (const [type, messages] of Object.entries(categorized)) {
    if (messages.length > 0) {
      changelogEntry += `\n### ${sectionLabels[type]}\n${messages.join('\n')}\n`;
    }
  }

  changelogEntry += '\n';

  const previousLog = fs.existsSync(changelogPath) ? fs.readFileSync(changelogPath, 'utf-8') : '';
  fs.writeFileSync(changelogPath, changelogEntry + previousLog);

  const filesToAdd = [...packages, 'CHANGELOG.md']
  .map(p => `"${p}"`)
  .join(' ');

  run(`git add ${filesToAdd}`);
  run(`git commit -m "chore(release): v${nextVersion}"`);
  run(`git tag v${nextVersion}`);

  console.log(chalk.green(`\n✅ Release tagged as v${nextVersion}\nPush with: git push && git push --tags\n`));
} else {
  console.log(chalk.cyan(`\n Nothing to release yet.`));
}
