#!/usr/bin/env node

/// tagger - simple CLI tool to bump version & generate changelog

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function run(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf-8' }).trim();
  } catch (err) {
    // No tag
    return '';
  }
}

function detectBump(commits) {
  if (commits.some(m => /BREAKING CHANGE|!:/.test(m))) return 'major';
  if (commits.some(m => /^feat(\(.+\))?:/.test(m))) return 'minor';
  if (commits.some(m => /^fix(\(.+\))?:/.test(m))) return 'patch';
  return 'none';
}

function bumpVersion(current, bump) {
  const [major, minor, patch] = current.split('.').map(Number);
  if (bump === 'major') return `${major + 1}.0.0`;
  if (bump === 'minor') return `${major}.${minor + 1}.0`;
  if (bump === 'patch') return `${major}.${minor}.${patch + 1}`;
}

const packagePath = path.join(__dirname, '../package.json');
const changelogPath = path.join(__dirname, '../CHANGELOG.md');

const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
const lastTag = run('git describe --tags --abbrev=0');
const commitRange = lastTag ? `${lastTag}..HEAD` : 'HEAD';
const commits = run(`git log ${commitRange} --pretty=format:"%s"`).split('\n');

const bump = detectBump(commits);
if (bump !== 'none') {
  const nextVersion = bumpVersion(pkg.version ?? '0.0.0', bump);

  console.log(`\n> Releasing: ${nextVersion} (${bump})\n`);

  pkg.version = nextVersion;
  fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2));

  const changelogEntry = `## v${nextVersion} - ${new Date().toISOString().slice(0, 10)}\n` +
    commits.map(m => `- ${m}`).join('\n') + '\n\n';

  const previousLog = fs.existsSync(changelogPath) ? fs.readFileSync(changelogPath, 'utf-8') : '';
  fs.writeFileSync(changelogPath, changelogEntry + previousLog);

  run('git add package.json CHANGELOG.md');
  run(`git commit -m "chore(release): v${nextVersion}"`);
  run(`git tag v${nextVersion}`);

  console.log(`\n✅ Release tagged as v${nextVersion}\nPush with: git push && git push --tags\n`);
} else {
  console.log(`\n Nothing to release yet.`);
}
