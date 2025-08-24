#!/usr/bin/env node

import { program } from "commander";
import { NoteManager } from "../src/note-manager";
import { GitUtils } from "../src/git-utils";
import * as fs from "fs";
import * as path from "path";

// 读取 package.json 文件
function getPackageInfo() {
  try {
    const packagePath = path.join(process.cwd(), "package.json");
    if (fs.existsSync(packagePath)) {
      const packageContent = fs.readFileSync(packagePath, "utf8");
      return JSON.parse(packageContent);
    }
    // 如果在根目录找不到，尝试从当前文件所在目录往上找
    let currentDir = __dirname;
    for (let i = 0; i < 5; i++) {
      currentDir = path.dirname(currentDir);
      const candidatePath = path.join(currentDir, "package.json");
      if (fs.existsSync(candidatePath)) {
        const packageContent = fs.readFileSync(candidatePath, "utf8");
        return JSON.parse(packageContent);
      }
    }
    throw new Error("package.json not found");
  } catch (error) {
    console.error("Error reading package.json:", error);
    return { version: "1.0.0", description: "Git Branch Notes Manager" };
  }
}

const packageInfo = getPackageInfo();
const noteManager = new NoteManager();

// 错误处理函数
function handleError(error: unknown, context: string): void {
  if (error instanceof Error) {
    console.error(`\x1b[41mError ${context}:`, error.message);
  } else {
    console.error(`\x1b[41mUnknown error ${context}:`, error);
  }
}

program.version(packageInfo.version).description(packageInfo.description);

program
  .command("list")
  .description("List all branches with notes")
  .option("-r, --remote", "Show only remote branches with notes ")
  .option("-l, --local", "Show only local branches with notes")
  .option("-a, --all", "Show all branches, including those without notes")
  .action(async (options) => {
    try {
      // 自动获取远程备注
      console.log("🔄 Fetching remote notes...");
      await noteManager.fetchNotes();

      const branches = await noteManager.getAllBranchesWithNotes();

      // 应用筛选
      let filteredBranches = branches;
      if (options.remote) {
        filteredBranches = branches.filter((branch) => branch.isRemote);
      } else if (options.local) {
        filteredBranches = branches.filter((branch) => !branch.isRemote);
      }

      let branchesWithNotes;
      // 过滤掉没有备注的分支（如果有备注才显示）
      if (!options.all) {
        branchesWithNotes = filteredBranches.filter((branch) => branch.note);
      } else {
        branchesWithNotes = filteredBranches;
      }

      if (branchesWithNotes.length === 0) {
        console.log("No branches with notes found");
        return;
      }

      const tableData = branchesWithNotes.map((branch) => {
        const prefix = branch.isCurrent ? "* " : "  ";
        const remoteIndicator = branch.isRemote ? "[remote] " : "";
        const fullBranchName = `${prefix}${remoteIndicator}${branch.name}`;

        return {
          Branch: fullBranchName,
          Commit: branch.commit.substring(0, 8),
          Author: branch.author,
          Date: branch.date,
          Note: branch.note || "",
        };
      });

      console.table(tableData);
      console.log(
        "\x1b[33m* Indicates current branch; [remote] Indicates remote branch"
      );
    } catch (error) {
      handleError(error, "listing branches");
    }
  });

program
  .command("set <note>")
  .description("Set note for current branch (sync to remote)")
  .option("-b, --branch <branch>", "Specify branch name (default: current branch)")
  .option("-n, --no-sync", "Do not sync to remote after setting")
  .action(async (note: string, options) => {
    try {
      let targetBranch = options.branch;
      
      // 如果没有指定分支，获取当前分支
      if (!targetBranch) {
        const gitUtils = new GitUtils();
        targetBranch = await gitUtils.getCurrentBranch();
        console.log(`No branch specified, using current branch: ${targetBranch}`);
      }

      await noteManager.setNote(targetBranch, note);
      console.log(`✅ Successfully set note for branch: ${targetBranch}`);

      if (options.sync !== false) {
        await noteManager.syncNotes();
        console.log("✅ Note synced to remote");
      } else {
        console.log(
          '💡 Note is set locally only. Use "git-bn sync" to sync to remote later.'
        );
      }
    } catch (error) {
      handleError(error, "setting note");
    }
  });

program
  .command("get [branch]")
  .description("Get note for a branch (default: current branch)")
  .action(async (branch: string | undefined) => {
    try {
      let targetBranch = branch;
      const gitUtils = new GitUtils();
      // 如果没有指定分支，获取当前分支
      if (!targetBranch) {
        const currentBranch = await gitUtils.getCurrentBranch();
        targetBranch = currentBranch;
        console.log(`No branch specified, using current branch: ${targetBranch}`);
      }

      console.log(`Fetching note for branch: ${targetBranch}`);
      const note = await gitUtils.getBranchNote(targetBranch);
      if (note) {
        console.log(`📝 Note for ${targetBranch}: \x1b[32m${note}`);
      } else {
        console.log(`ℹ️ No note found for branch: ${targetBranch}`);
      }
    } catch (error) {
      handleError(error, "getting note");
    }
  });

program
  .command("sync")
  .description("Sync notes with remote (fetch and push)")
  .action(async () => {
    try {
      console.log("🔄 Starting notes synchronization...");
      await noteManager.syncNotes();
      console.log("✅ Notes synchronization completed");
    } catch (error) {
      handleError(error, "syncing notes");
    }
  });

program.parse(process.argv);
