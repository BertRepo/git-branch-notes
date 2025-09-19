# Git Branch Notes

**Read this in other languages: [Chinese](README_zh.md).**

Welcome to Git Branch Notes! A CLI tool for managing Git branch notes with file-based storage.

[npm package location](https://www.npmjs.com/package/git-branch-notes)

[![license](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

## Installation

```bash
npm install -g git-branch-notes
```

## Note Storage Mechanism

Git Branch Notes now uses a file-based storage system. Branch notes are stored in a JSON file located at `branch-notes.json` in the root of your repository. This approach ensures that notes remain associated with branch names rather than commit hashes, making them persistent even when branches are updated with new commits.

Since the file is stored in the project root directory (not in .git/), it can be easily shared with team members through Git commits and pushes. This enables seamless collaboration on branch notes across your team.

The file structure looks like this:

```json
{
  "version": "1.0.0",
  "notes": [
    {
      "branchName": "main",
      "note": "This is the main branch",
      "timestamp": "2023-09-15T12:34:56.789Z"
    }
  ],
  "lastUpdated": "2023-09-15T12:34:56.789Z"
}
```

## How to use
### Initialize branches with empty notes
```bash
git-bn init [-r|-l|-a]
```
This command initializes notes for branches. By default, it initializes remote branches.

Options:
- `-r, --remote`: Initialize only remote branches (default)
- `-l, --local`: Initialize only local branches
- `-a, --all`: Initialize all branches (local and remote)

### List branches with notes
```bash
git-bn list [-r|-l|-a]
```
This command lists branches with notes from the local branch-notes.json file only. It includes enhanced error handling and prompts.

Options:

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

### Set note for a branch
```bash
git-bn set "Working on new feature" ## set note for current branch
git-bn set -b feature-branch "Working on new feature"
git-bn set --branch feature-branch "Working on new feature"
```

This command automatically checks if the branch exists and adds it to the notes file if it doesn't exist.

### Get note for a specific branch
```bash
git-bn get ## get note for current branch
git-bn get main
```

### Push notes file to remote repository
```bash
git-bn push
git-bn push -m "Update branch notes" ## Push with custom commit message
```
Push the branch-notes.json file to the remote repository. You can provide a custom commit message with the `-m` option.

### Pull notes file from remote repository
```bash
git-bn pull
```
Pull the latest branch-notes.json file from the remote repository.

### View notes mapping
```bash
git-bn mapping
```
Shows a detailed mapping of all branch notes, including deleted branches with their status marked as "[DELETED]".

## Automatic Branch Status Management

The tool automatically manages branch status changes:

- **New branches**: When a new branch is created (local or remote), it will be automatically added to the branch-notes.json file with an empty note the next time you run `git-bn list`.
- **Deleted branches**: When a branch is deleted, it will be marked as "[DELETED]" in the mapping view but will not be removed from the file.

This ensures that your branch notes are always up-to-date with your repository structure.

## Date Format

All timestamps in the tool use the format: `YYYY-MM-DD HH:mm:ss` for consistency and readability.

### Legacy sync command (no longer needed with file-based storage)
```bash
git-bn sync
```

## Features

+ 📝 Add notes to Git branches
+ 💾 File-based storage in `branch-notes.json`
+ 🔗 Notes persistently associated with branch names
+ ⏱️ Automatic timestamp tracking for notes
+ 🎯 Simple and intuitive CLI interface

## Example
![Example](./assets/image.png)
