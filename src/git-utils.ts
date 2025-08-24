import simpleGit, { SimpleGit } from "simple-git";
import { BranchInfo } from "./types";

export class GitUtils {
  private git: SimpleGit;

  constructor(repoPath: string = process.cwd()) {
    this.git = simpleGit(repoPath);
  }

  async getBranches(): Promise<BranchInfo[]> {
    console.log("Fetching all branches...");
    const branches = await this.git.branch(["-a", "--verbose"]);
    const currentBranch = branches.current;

    const branchInfoPromises = branches.all.map(async (branchName) => {
      const isRemote = branchName.startsWith("remotes/");
      const cleanName = isRemote
        ? branchName.replace("remotes/", "")
        : branchName;
      const branch = branches.branches[branchName];

      let date = "";
      let author = "";
      try {
        const logResult = await this.git.raw([
          "log",
          "-1",
          "--format=%ci;%an",
          branch.commit,
        ]);
        const [commitDate, commitAuthor] = logResult.trim().split(";");

        const dateObj = new Date(commitDate);
        date = dateObj.toISOString().slice(0, 19).replace("T", " ");
        author = commitAuthor;
      } catch (error) {
        console.warn(
          `Failed to get commit details for ${branch.commit}:`,
          error
        );
      }

      return {
        name: cleanName,
        isCurrent: branchName === currentBranch,
        isRemote,
        commit: branch.commit,
        date,
        author,
        note: undefined,
      };
    });

    return Promise.all(branchInfoPromises);
  }

  async getCurrentBranch(): Promise<string> {
  try {
    const branchInfo = await this.git.branch();
    return branchInfo.current;
  } catch (error:any) {
    throw new Error(`Failed to get current branch: ${error?.message}`);
  }
}

  async getBranchNote(branchName: string): Promise<string> {
    try {
      const note = await this.git.raw([
        "notes",
        "--ref=branch-notes",
        "show",
        branchName,
      ]);
      return note.trim();
    } catch {
      return "";
    }
  }

  // 设置分支备注
  async setBranchNote(branchName: string, note: string): Promise<void> {
    await this.git.raw([
      "notes",
      "--ref=branch-notes",
      "add",
      "-f",
      "-m",
      note,
      branchName,
    ]);
  }

  async pushNotes(remote: string = "origin"): Promise<void> {
    await this.git.push(remote, "refs/notes/branch-notes");
  }

  // 拉取远程notes到本地
  async fetchNotes(remote: string = "origin"): Promise<boolean> {
    try {
      // 先检查远程是否有notes
      const hasRemoteNotes = await this.checkRemoteNotes(remote);
      if (!hasRemoteNotes) {
        console.log("No branch notes found on remote");
        return false;
      }

      // 使用兼容的fetch命令
      await this.git.raw(["fetch", remote, "+refs/notes/*:refs/notes/*"]);

      // 验证notes是否拉取成功
      const notesList = await this.git.raw([
        "notes",
        "--ref=branch-notes",
        "list",
      ]);
      if (notesList.trim()) {
        console.log("Successfully fetched branch notes from remote");
        console.log(`Found ${notesList.trim().split("\n").length} notes`);
        return true;
      } else {
        console.log("No notes found after fetch");
        return false;
      }
    } catch (error: any) {
      console.warn("Failed to fetch notes:", error?.message);
      return false;
    }
  }

  // 添加方法来显示notes映射
  async showNotesMapping(): Promise<string> {
    try {
      let output = "=== Notes Mapping ===\n\n";

      // 获取所有notes
      const notesList = await this.git.raw([
        "notes",
        "--ref=branch-notes",
        "list",
      ]);
      if (!notesList.trim()) {
        return output + "No notes found\n";
      }

      const noteLines = notesList.trim().split("\n");
      output += `Found ${noteLines.length} notes:\n\n`;

      for (const line of noteLines) {
        const [commitHash, ref] = line.split(" ");

        // 获取commit对应的分支
        const branchResult = await this.git.raw([
          "branch",
          "--contains",
          commitHash,
        ]);
        const branches = branchResult
          .trim()
          .split("\n")
          .map((b) => b.replace("*", "").trim());

        // 获取note内容
        try {
          const noteContent = await this.git.raw([
            "notes",
            "--ref=branch-notes",
            "show",
            commitHash,
          ]);
          output += `Commit: ${commitHash.slice(0, 8)}\n`;
          output += `Branches: ${branches.join(", ")}\n`;
          output += `Note: ${noteContent.trim()}\n`;
          output += "─".repeat(50) + "\n\n";
        } catch (error) {
          output += `Commit: ${commitHash.slice(0, 8)} - Error reading note\n`;
        }
      }

      return output;
    } catch (error: any) {
      return `Error: ${error?.message}\n`;
    }
  }

  // 查看远程notes引用
  async checkRemoteNotes(remote: string = "origin"): Promise<boolean> {
    try {
      const result = await this.git.raw([
        "ls-remote",
        remote,
        "refs/notes/branch-notes",
      ]);
      return result.trim().length > 0;
    } catch {
      return false;
    }
  }
}
