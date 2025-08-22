# Git Branch Notes

**Read this in other languages: [English](README.md), [中文](README_zh.md).**

Welcome to use Git Branch Notes! A CLI tool for managing Git branch notes with remote synchronization.

[![license](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

## Installation

```bash
npm install -g git-branch-notes
```

## How to use
### List all branches with notes after fetch remote

```bash
git-bn list
```

### Set note for a branch
```bash
git-bn set feature-branch "Working on new UI"
```

### Sync notes with remote, then someone of your repo can get it
```bash
git-bn sync
```

### Fetch notes from remote
```bash
git-bn fetch-notes
```

### Show notes mapping
```bash
git-bn mapping
```

## Features

+ 📝 Add notes to Git branches
+ 🌐 Remote synchronization support
+ 🎯 TypeScript support
+ 📊 Detailed notes mapping
