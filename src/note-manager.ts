import { GitUtils } from "./git-utils";
import { BranchInfo } from "./types";

export class NoteManager {
  private gitUtils: GitUtils;

  constructor(repoPath: string = process.cwd()) {
    this.gitUtils = new GitUtils(repoPath);
  }

  // 获取所有分支信息及备注
  async getAllBranchesWithNotes(): Promise<BranchInfo[]> {
    try {
      const branches = await this.gitUtils.getBranches();
      return branches;
    } catch (error) {
      console.error("Error getting branches with notes:", error);
      return [];
    }
  }

  // 设置分支备注
  async setNote(branchName: string, note: string): Promise<void> {
    try {
      await this.gitUtils.setBranchNote(branchName, note);
    } catch (error) {
      console.error(`Error setting note for branch ${branchName}:`, error);
      throw error;
    }
  }

  // 显示备注映射关系
  async showNotesMapping(): Promise<string> {
    return this.gitUtils.showNotesMapping();
  }

  // 检查并更新分支状态
  async checkAndUpdateBranchStatus(): Promise<void> {
    try {
      await this.gitUtils.checkAndUpdateBranchStatus();
    } catch (error) {
      console.error("Error checking and updating branch status:", error);
    }
  }

  // 将分支标记为已删除
  async markBranchAsDeleted(branchName: string): Promise<void> {
    try {
      await this.gitUtils.markBranchAsDeleted(branchName);
    } catch (error) {
      console.error(`Error marking branch ${branchName} as deleted:`, error);
    }
  }

  // 初始化分支的备注
  async initBranches(
    branchType: "remote" | "local" | "all" = "remote"
  ): Promise<void> {
    try {
      await this.gitUtils.initBranches(branchType);
    } catch (error) {
      console.error("Error initializing branches:", error);
      throw error;
    }
  }
}
