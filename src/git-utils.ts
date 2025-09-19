import simpleGit, { SimpleGit } from "simple-git";
import { BranchInfo, BranchNotesData } from "./types";
import { formatTimestamp } from "./utils";
import * as fs from "fs";
import * as path from "path";

export class GitUtils {
  private git: SimpleGit;
  private repoPath: string;
  private notesFilePath: string;

  constructor(repoPath: string = process.cwd()) {
    this.git = simpleGit(repoPath);
    this.repoPath = repoPath;

    // 设置备注文件路径 - 直接放在项目根目录
    this.notesFilePath = path.join(this.repoPath, "branch-notes.json");
  }

  // 获取所有分支信息
  async getBranches(
    branchType?: "remote" | "local" | "all"
  ): Promise<BranchInfo[]> {
    const branches = await this.git.branch(["-a", "--verbose"]);
    const currentBranch = branches.current;

    // 获取所有分支备注数据
    const notesData = await this.readNotesFile();
    // 构建分支名称到备注的映射
    const activeNotesMap = new Map<
      string,
      { note: string; timestamp: string }
    >();
    // FIXME: 处理 deleted 状态的分支 删除分支时应该出发文件里状态更新的 不然没效果
    const deletedNotesMap = new Map<
      string,
      { note: string; timestamp: string }
    >();

    if (notesData) {
      notesData.notes.forEach((note) => {
        const noteData = {
          note: note.note,
          timestamp: note.timestamp,
        };

        if (note.status === "deleted") {
          deletedNotesMap.set(note.branchName, noteData);
        } else {
          activeNotesMap.set(note.branchName, noteData);
        }
      });
    }

    // 过滤分支类型
    let filteredBranchNames = branches.all;
    if (branchType === "remote") {
      filteredBranchNames = branches.all.filter((name) =>
        name.startsWith("remotes/")
      );
    } else if (branchType === "local") {
      filteredBranchNames = branches.all.filter(
        (name) => !name.startsWith("remotes/")
      );
    }
    // 如果是'all'或者未指定，就不过滤

    const branchInfoPromises = filteredBranchNames.map(async (branchName) => {
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
        const [commitDate, commitAuthor] = logResult
          .trim()
          .split(";")
          .map((s) => s.trim());

        date = formatTimestamp(new Date(commitDate));
        author = commitAuthor;
      } catch (error) {
        console.warn(
          `Failed to get commit details for ${branch.commit}:`,
          error
        );
      }

      // 从映射中获取该分支的备注和时间戳
      const branchNoteData = activeNotesMap.get(cleanName);

      return {
        name: cleanName,
        isCurrent: branchName === currentBranch,
        isRemote,
        commit: branch.commit,
        date,
        author,
        note: branchNoteData?.note,
        noteTimestamp: branchNoteData?.timestamp,
      };
    });

    return Promise.all(branchInfoPromises);
  }

  // 获取当前分支
  async getCurrentBranch(): Promise<string> {
    try {
      const branchInfo = await this.git.branch();
      return branchInfo.current;
    } catch (error: any) {
      throw new Error(`Failed to get current branch: ${error?.message}`);
    }
  }

  // 获取指定分支的备注
  async getBranchNote(branchName: string): Promise<string> {
    const notesData = await this.readNotesFile();
    if (!notesData) {
      return "";
    }

    const branchNote = notesData.notes.find(
      (note) => note.branchName === branchName
    );
    return branchNote?.note || "";
  }

  // 设置分支备注，自动检查并添加分支
  async setBranchNote(branchName: string, note: string): Promise<void> {
    // 获取现有备注数据
    let notesData = await this.readNotesFile();
    if (!notesData) {
      notesData = {
        version: "1.0.0",
        notes: [],
        lastUpdated: "",
      };
    }
    const timestamp = formatTimestamp(new Date());

    // 查找是否已存在该分支的备注
    const existingNoteIndex = notesData.notes.findIndex(
      (n) => n.branchName === branchName
    );

    if (existingNoteIndex >= 0) {
      // 更新现有备注，确保状态为active
      notesData.notes[existingNoteIndex] = {
        branchName,
        note,
        timestamp,
        status: "active",
      };
    } else {
      // 添加新备注，默认状态为active
      notesData.notes.push({
        branchName,
        note,
        timestamp,
        status: "active",
      });
    }

    // 更新上次更新时间
    notesData.lastUpdated = timestamp;

    // 保存到文件
    await this.writeNotesFile(notesData);
  }

  // 读取备注文件
  private async readNotesFile(): Promise<BranchNotesData | null> {
    try {
      if (!fs.existsSync(this.notesFilePath)) {
        return null;
      }

      const content = fs.readFileSync(this.notesFilePath, "utf-8");
      return JSON.parse(content) as BranchNotesData;
    } catch (error) {
      console.warn(`Failed to read notes file: ${error}`);
      return null;
    }
  }

  // 写入备注文件
  private async writeNotesFile(data: BranchNotesData): Promise<void> {
    try {
      // 确保.git目录存在
      const gitDir = path.dirname(this.notesFilePath);
      if (!fs.existsSync(gitDir)) {
        throw new Error(
          ".git directory not found. Make sure you're in a git repository."
        );
      }

      fs.writeFileSync(
        this.notesFilePath,
        JSON.stringify(data, null, 2),
        "utf-8"
      );
    } catch (error) {
      console.error(`Failed to write notes file: ${error}`);
      throw error;
    }
  }

  // 检查并更新分支状态（新分支自动添加空备注，删除分支标记状态）
  async checkAndUpdateBranchStatus(): Promise<void> {
    try {
      // 获取当前所有分支
      const currentBranches = await this.getBranches();
      const currentBranchNames = new Set(
        currentBranches.map((branch) => branch.name)
      );

      // 获取备注文件中的分支
      const notesData = await this.readNotesFile();

      if (!notesData) {
        return; // 如果没有备注文件，不需要处理
      }

      const timestamp = formatTimestamp(new Date());

      let hasChanges = false;

      // 检查是否有删除的分支
      for (let i = 0; i < notesData.notes.length; i++) {
        const note = notesData.notes[i];
        if (
          note.status !== "deleted" &&
          !currentBranchNames.has(note.branchName)
        ) {
          // 标记为已删除
          notesData.notes[i].status = "deleted";
          notesData.notes[i].timestamp = timestamp;
          hasChanges = true;
        }
      }

      // 检查是否有新分支需要添加空备注
      currentBranchNames.forEach((branchName) => {
        const existingNote = notesData.notes.find(
          (note) => note.branchName === branchName
        );
        if (!existingNote) {
          // 添加新分支的空备注
          notesData.notes.push({
            branchName,
            note: "",
            timestamp,
            status: "active",
          });
          hasChanges = true;
        }
      });

      // 如果有更改，保存文件
      if (hasChanges) {
        notesData.lastUpdated = timestamp;
        await this.writeNotesFile(notesData);
      }
    } catch (error) {
      console.warn(`Failed to check and update branch status: ${error}`);
    }
  }

  // 将分支标记为已删除
  async markBranchAsDeleted(branchName: string): Promise<void> {
    try {
      const notesData = await this.readNotesFile();
      if (!notesData) {
        return;
      }

      const noteIndex = notesData.notes.findIndex(
        (note) => note.branchName === branchName
      );
      if (noteIndex >= 0) {
        const timestamp = formatTimestamp(new Date());

        //TODO - 还需要在宿主机删除分支的时候触发
        // 标记为已删除
        notesData.notes[noteIndex].status = "deleted";
        notesData.notes[noteIndex].timestamp = timestamp;
        notesData.lastUpdated = timestamp;

        await this.writeNotesFile(notesData);
      }
    } catch (error) {
      console.warn(`Failed to mark branch as deleted: ${error}`);
    }
  }

  // 显示备注映射关系  包含已删除的分支 但是我会标记下
  async showNotesMapping(): Promise<string> {
    let output = "=== Notes Mapping ===\n";

    const notesData = await this.readNotesFile();
    if (!notesData || notesData.notes.length === 0) {
      return output + "No notes found\n";
    }

    output += `Found ${notesData.notes.filter(item => item?.note?.length > 0).length} effective notes:\n`;

    // 按分支名称排序
    const sortedNotes = [...notesData.notes].sort((a, b) =>
      a.branchName.localeCompare(b.branchName)
    );

    for (const note of sortedNotes) {
      if (note?.note?.length === 0) continue
      const formattedDate = note.timestamp;
      const statusText = note.status === "deleted" ? "[DELETED] " : "";

      output += `Branch:\x1b[32m ${statusText}${note.branchName}\x1b[0m\n`;
      output += `Note:\x1b[32m ${note.note}\x1b[0m\n`;
      output += `Added/Updated: \x1b[32m${formattedDate}\x1b[0m\n`;
      if (note.status === "deleted") {
        output += `Status: Deleted\n`;
      }
      output += "─".repeat(50) + "\n";
    }

    return output;
  }

  // 初始化分支的备注
  async initBranches(
    branchType: "remote" | "local" | "all" = "remote"
  ): Promise<void> {
    try {
      // 获取指定类型的分支信息
      const branches = await this.getBranches(branchType);

      // 创建新的备注数据结构
      const notesData: BranchNotesData = {
        version: "1.0.0",
        notes: [],
        lastUpdated: new Date().toISOString(),
      };

      const timestamp = formatTimestamp(new Date());
      // 为每个分支创建空备注
      branches.forEach((branch) => {
        notesData.notes.push({
          branchName: branch.name,
          note: "",
          timestamp,
          status: "active",
        });
      });

      notesData.lastUpdated = timestamp;

      // 保存到文件
      await this.writeNotesFile(notesData);
      console.log(`✅ Initialized notes for ${branches.length} branches`);
    } catch (error) {
      console.error(`Failed to initialize branches: ${error}`);
      throw error;
    }
  }

  //****************** Git操作相关的公共方法 ********************/
  async gitAdd(filePaths: string[]): Promise<void> {
    try {
      await this.git.add(filePaths);
    } catch (error) {
      console.error("Failed to add files:", error);
      throw error;
    }
  }

  async gitCommit(message: string): Promise<void> {
    try {
      await this.git.commit(message);
    } catch (error: any) {
      if (error?.message && error?.message.includes("nothing to commit")) {
        console.log("ℹ️ No changes to commit.");
        return;
      }
      throw error;
    }
  }

  async gitPush(): Promise<void> {
    try {
      await this.git.push();
    } catch (error) {
      console.error("Failed to push to remote:", error);
      throw error;
    }
  }

  async gitPull(): Promise<void> {
    try {
      await this.git.pull();
    } catch (error) {
      console.error("Failed to pull from remote:", error);
      throw error;
    }
  }
}
