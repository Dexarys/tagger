# tagger 🏷️

**Simple CLI tool to bump versions and generate changelogs from conventional commits.**

This tool analyzes Git commits since the last tag, determines the appropriate semantic version bump (`patch`, `minor`, or `major`), updates the `package.json`, generates a categorized changelog, commits, and tags the new release.

## ✨ Features

- Conventional Commit detection (`feat:`, `fix:`, `BREAKING CHANGE`, etc.)
- Automatically bumps semantic version
- Generates clean, structured changelogs grouped by type
- Commits `package.json`* and `CHANGELOG.md`, creates a new Git tag
- Lightweight and framework agnostic

*: Multiple package.json files can be updated

## 📦 Installation

Install as a dev dependency in your project:

```bash
npm install --save-dev @dexarys/tagger
```

## 🚀 Usage
Run the release script from your project root:

``` bash
npx tagger
```

Or add a script to your ``package.json``:

```json
{
  "scripts": {
    "release": "tagger"
  }
}
```

Then run:

``` bash
npm run release
```

If commit messages follow the Conventional Commits convention, tagger will:

1. Detect the correct version bump based on commit messages

2. Update the ``package.json`` version

3. Prepend a structured entry to your ``CHANGELOG.md``

4. Commit the changes

5. Create a Git tag for the new version

## 🔍 Managing Multiple package.json Files
By default, Tagger will recursively search and update all package.json files in your project.

If your project includes multiple packages (e.g., a monorepo), this behavior helps ensure version consistency across all packages.

### Disable Multi-Package Behavior
If you want Tagger to only update the root package.json, you can disable this behavior by passing:

``` bash
--multi=false
```
This prevents scanning subdirectories for other package.json files.

### Ignoring Specific Paths
To fine-tune which directories are scanned, you can create a .taggerignore file at the root of your project.

Each line should contain a relative path to exclude from scanning (similar to .gitignore):

``` bash
node_modules
dist
apps/legacy-app
tools/some-script-folder
```

> 📝 Paths are relative to the repository root. Empty lines and comments (starting with #) are ignored.

This gives you full control over which package.json files are updated while keeping your monorepo clean and efficient.

## 📄 Example Output

``` bash
> Releasing: 1.2.0 (minor)

✅ Release tagged as v1.2.0
Push with: git push && git push --tags
```

Generated changelog:

``` md
## v1.2.0 - 2025-05-13

### ✨ Features
- add dynamic icon rendering
- support for multi-theme system

### 🐛 Fixes
- correct icon rendering in dark mode

### 📦 Others
- update build script
```

## 🛠️ Requirements
- Node.js ≥ 16

- Git repository with conventional commits

- A valid package.json in project root


## 📘 License
This project is licensed under the GPL-3.0-only license.

## 🔥 Author
Developed by @dexarys