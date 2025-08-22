#!/usr/bin/env node

import { program } from 'commander';
import { NoteManager } from '../src/note-manager';
import { GitUtils } from '../src/git-utils';

const noteManager = new NoteManager();

// 错误处理函数
function handleError(error: unknown, context: string): void {
  if (error instanceof Error) {
    console.error(`Error ${context}:`, error.message);
  } else {
    console.error(`Unknown error ${context}:`, error);
  }
}

program
  .version('1.0.0')
  .description('Git Branch Notes Manager');

program
  .command('list')
  .description('List all branches with notes')
  .action(async () => {
    try {
      const branches = await noteManager.getAllBranchesWithNotes();
      branches.forEach(branch => {
        const prefix = branch.isCurrent ? '* ' : '  ';
        const remoteIndicator = branch.isRemote ? '[remote] ' : '';
        console.log(`${prefix}${remoteIndicator}${branch.name}`);
        if (branch.note) {
          console.log(`  Note: ${branch.note}`);
        }
        console.log('');
      });
    } catch (error) {
      handleError(error, 'listing branches');
    }
  });

program
  .command('set <branch> <note>')
  .description('Set note for a branch')
  .action(async (branch: string, note: string) => {
    try {
      await noteManager.setNote(branch, note);
      console.log(`Note set for branch ${branch}`);
    } catch (error) {
      handleError(error, 'setting note');
    }
  });

program
  .command('sync')
  .description('Sync notes with remote')
  .action(async () => {
    try {
      await noteManager.syncNotes();
      console.log('Notes synced');
    } catch (error) {
      handleError(error, 'syncing notes');
    }
  });

program
  .command('get <branch>')
  .description('Get note for a specific branch')
  .action(async (branch: string) => {
    try {
      const gitUtils = new GitUtils();
      const note = await gitUtils.getBranchNote(branch);
      if (note) {
        console.log(`Note for ${branch}: ${note}`);
      } else {
        console.log(`No note found for ${branch}`);
      }
    } catch (error) {
      handleError(error, 'getting note');
    }
  });

program.parse(process.argv);