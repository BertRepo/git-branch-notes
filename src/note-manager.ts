import { GitUtils } from "./git-utils";
import { BranchInfo } from "./types";

export class NoteManager {
  private gitUtils: GitUtils;

  constructor() {
    this.gitUtils = new GitUtils();
  }

  async getAllBranchesWithNotes(): Promise<BranchInfo[]> {
    const branches = await this.gitUtils.getBranches();
    const branchesWithNotes = await Promise.all(
      branches.map(async (branch) => {
        const note = await this.gitUtils.getBranchNote(branch.name);
        return { ...branch, note };
      })
    );

    return branchesWithNotes;
  }

  async setNote(branchName: string, note: string): Promise<void> {
    await this.gitUtils.setBranchNote(branchName, note);
  }

  async syncNotes(remote: string = "origin"): Promise<void> {
    try {
      // 先拉取远程notes
      await this.gitUtils.fetchNotes(remote);

      // 再推送本地notes到远程
      await this.gitUtils.pushNotes(remote);
    } catch (error: any) {
      console.error("❌ Failed to sync notes:", error?.message);
      throw error;
    }
  }

  async fetchNotes(remote: string = "origin"): Promise<boolean> {
    return this.gitUtils.fetchNotes(remote);
  }
}
