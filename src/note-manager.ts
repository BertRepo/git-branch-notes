import { GitUtils } from './git-utils';
import { BranchInfo } from './types';

export class NoteManager {
  private gitUtils: GitUtils;

  constructor() {
    this.gitUtils = new GitUtils();
  }

  async getAllBranchesWithNotes(): Promise<BranchInfo[]> {
    await this.gitUtils.fetchNotes();
    
    const branches = await this.gitUtils.getBranches();
    const branchesWithNotes = await Promise.all(
      branches.map(async branch => {
        const note = await this.gitUtils.getBranchNote(branch.name);
        return { ...branch, note };
      })
    );

    return branchesWithNotes;
  }

  async setNote(branchName: string, note: string): Promise<void> {
    await this.gitUtils.setBranchNote(branchName, note);
    await this.gitUtils.pushNotes();
  }

  async syncNotes(): Promise<void> {
    await this.gitUtils.fetchNotes();
    await this.gitUtils.pushNotes();
  }
}