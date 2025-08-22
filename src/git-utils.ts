import simpleGit, { SimpleGit } from 'simple-git';
import { BranchInfo } from './types';

export class GitUtils {
  private git: SimpleGit;

  constructor(repoPath: string = process.cwd()) {
    this.git = simpleGit(repoPath);
  }

  async getBranches(): Promise<BranchInfo[]> {
    const branches = await this.git.branch(['-a', '--verbose']);
    const currentBranch = branches.current;

    return branches.all.map(branchName => {
      const isRemote = branchName.startsWith('remotes/');
      const cleanName = isRemote ? branchName.replace('remotes/', '') : branchName;
      const branch = branches.branches[branchName];
      
      return {
        name: cleanName,
        isCurrent: branchName === currentBranch,
        isRemote,
        commit: branch.commit,
        date: '', // 需要额外获取
        author: '', // 需要额外获取
        note: undefined
      };
    });
  }

  async getBranchNote(branchName: string): Promise<string> {
    try {
      const note = await this.git.raw(['notes', '--ref=branch-notes', 'show', branchName]);
      return note.trim();
    } catch {
      return '';
    }
  }

  async setBranchNote(branchName: string, note: string): Promise<void> {
    await this.git.raw(['notes', '--ref=branch-notes', 'add', '-f', '-m', note, branchName]);
  }

  async pushNotes(remote: string = 'origin'): Promise<void> {
    await this.git.push(remote, 'refs/notes/branch-notes');
  }

  async fetchNotes(remote: string = 'origin'): Promise<void> {
    try {
      await this.git.fetch(remote, 'refs/notes/*:refs/notes/*');
    } catch (error: any) {  // TODO:type 需要严格定义下
      console.warn('Failed to fetch notes:', error?.message || 'Unknown error');
    }
  }
}