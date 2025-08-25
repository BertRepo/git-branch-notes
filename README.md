# Git Branch Notes

**Read this in other languages: [Chinese](README_zh.md).**

Welcome to use Git Branch Notes! A CLI tool for managing Git branch notes with remote synchronization.

[npm package location](https://www.npmjs.com/package/git-branch-notes)

[![license](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

## Installation

```bash
npm install -g git-branch-notes
```

## How to use
### List all branches with notes (local and remote)
```bash
git-bn list
git-bn list -a ## show all branches, including those without notes --all参数
```

### List only remote branches with notes
```bash
git-bn list -r
git-bn list --remote
```

### List only local branches with notes  
```bash
git-bn list -l
git-bn list --local
```

### Set note for a branch and sync to remote (default behavior)
```bash
git-bn set "Working on new feature" ## set note for current branch
git-bn set -b feature-branch "Working on new feature"
git-bn set --branch feature-branch "Working on new feature"
```

### Set note for a branch without syncing to remote
```bash
git-bn set -b feature-branch "Working on new feature" -n
git-bn set --branch feature-branch "Working on new feature" --no-sync
```

### Fetch remote notes and push local notes, then someone of your repo can get it
```bash
git-bn sync
```

### Get note for a specific branch
```bash
git-bn get ## get note for current branch
git-bn get main
```

## Features

+ 📝 Add notes to Git branches
+ 🔄 Sync notes across multiple repositories (manual control)
+ 🌐 Remote synchronization support
+ 🎯 Simple and intuitive CLI interface

## Example
![Example](./assets/image.png)
