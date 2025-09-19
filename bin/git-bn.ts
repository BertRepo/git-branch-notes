#!/usr/bin/env node

import { program } from "commander";
import { NoteManager } from "../src/note-manager";
import { GitUtils } from "../src/git-utils";
import { getPackageInfo, handleError } from "../src/utils";
import * as fs from "fs";
import * as path from "path";

const packageInfo = getPackageInfo();
// 获取当前工作目录
const currentDir = process.cwd();
const noteManager = new NoteManager(currentDir);

program.version(packageInfo.version).description("Git Branch Notes Manager (File-based storage)");

// 初始化分支备注，为指定类型的分支创建空备注
program
  .command("init")
  .description("Initialize notes for branches (default: remote branches)")
  .option("-r, --remote", "Initialize only remote branches")
  .option("-l, --local", "Initialize only local branches")
  .option("-a, --all", "Initialize all branches (local and remote)")
  .action(async (options) => {
    try {
      let branchType: 'remote' | 'local' | 'all' = 'remote'; // 默认初始化远程分支
      if (options.local) {
        branchType = 'local';
      } else if (options.all) {
        branchType = 'all';
      }
      
      await noteManager.initBranches(branchType);
      
      const typeText = branchType === 'remote' ? 'remote' : 
                     branchType === 'local' ? 'local' : 'all';
      
      console.log(`✅ \x1b[32m${typeText}\x1b[0m branches have been initialized with empty notes.`);
    } catch (error) {
      handleError(error, "initializing branches");
    }
  });

// 查看分支备注（仅从本地文件读取）
program
  .command("list")
  .description("List branches with notes (from local file only)")
  .option("-r, --remote", "Show only remote branches")
  .option("-l, --local", "Show only local branches")
  .option("-a, --all", "Show all branches, including those without notes")
  .action(async (options) => {
    try {
      // 检查备注文件是否存在
      const notesFilePath = path.join(currentDir, "branch-notes.json");
      if (!fs.existsSync(notesFilePath)) {
        console.log("❌ branch-notes.json file not found. Please run \x1b[33m'git-bn init'\x1b[0m to initialize branch notes.");
        return;
      }
      
      // 自动检查并更新分支状态
      await noteManager.checkAndUpdateBranchStatus();
      
      const branches = await noteManager.getAllBranchesWithNotes();

      // 检查是否有分支数据
      if (branches.length === 0) {
        console.log("ℹ️  No branch information found. Please ensure you're in a git repository.");
        return;
      }

      // 根据参数筛选 本地、远程、全部 分支
      let filteredBranches = branches;
      if (options.remote) {
        filteredBranches = branches.filter((branch) => branch.isRemote);
      } else if (options.local) {
        filteredBranches = branches.filter((branch) => !branch.isRemote);
      }

      // 检查筛选后是否有分支
      if (filteredBranches.length === 0) {
        const typeText = options.remote ? "remote" : "local";
        console.log(`ℹ️  No ${typeText} branches found.`);
        return;
      }

      // let branchesToShow;
      // // 过滤掉没有备注的分支
      // if (!options.all) {
      //   branchesToShow = filteredBranches.filter((branch) => branch.note);
      // } else {
      //   branchesToShow = filteredBranches;
      // }

      // if (branchesToShow.length === 0) {
      //   console.log("ℹ️  No branches with notes found");
      //   console.log("   Use 'git-bn set <note>' to add notes to branches.");
      //   return;
      // }

      const tableData = filteredBranches.map((branch) => {
        const prefix = branch.isCurrent ? "* " : "  ";
        const remoteIndicator = branch.isRemote ? "[remote] " : "";
        const fullBranchName = `${prefix}${remoteIndicator}${branch.name}`;
        const noteTime = branch.noteTimestamp || "";

        // TODO: 添加备注人信息
        return {
          Branch: fullBranchName,
          Commit: branch.commit.substring(0, 8),
          Author: branch.author,
          Date: branch.date,
          Note: branch.note || "",
          NoteTime: noteTime
        };
      });

      console.table(tableData);
      console.log(
        "\x1b[33m* Indicates current branch; [remote] Indicates remote branch\x1b[0m\n"
      );
    } catch (error) {
      handleError(error, "listing branches");
    }
  });

  // 设置分支备注，自动检查并添加分支
program
  .command("set <note>")
  .description("Set note for a branch (stored locally)")
  .option("-b, --branch <branch>", "Specify branch name (default: current branch)")
  .action(async (note: string, options) => {
    try {
      let targetBranch = options.branch;
      
      // 如果没有指定分支，获取当前分支
      if (!targetBranch) {
        const gitUtils = new GitUtils(currentDir);
        targetBranch = await gitUtils.getCurrentBranch();
        console.log(`No branch specified, using current branch: \x1b[33m${targetBranch}\x1b[0m`);
      }

      // 检查分支是否存在于备注文件中，如果不存在则会自动添加
      await noteManager.setNote(targetBranch, note);
      console.log(`✅ Successfully set note for branch:\x1b[32m ${targetBranch}\x1b[0m`);
    } catch (error) {
      handleError(error, "setting note");
    }
  });

// 获取某个分支的备注
program
  .command("get [branch]")
  .description("Get note for a branch (default: current branch)")
  .action(async (branch: string | undefined) => {
    try {
      let targetBranch = branch;
      const gitUtils = new GitUtils(currentDir);
      // 如果没有指定分支，获取当前分支
      if (!targetBranch) {
        const currentBranch = await gitUtils.getCurrentBranch();
        targetBranch = currentBranch;
        console.log(`No branch specified, using current branch: \x1b[33m${targetBranch}\x1b[0m`);
      }
      
      // 获取所有分支信息，包含备注和时间戳
      const branches = await noteManager.getAllBranchesWithNotes();
      const targetBranchInfo = branches.find(b => b.name === targetBranch);
      
      if (!targetBranchInfo) {
        console.log(`ℹ️ Branch not found: \x1b[33m${targetBranch}\x1b[0m`);
        return;
      }
      
      if (targetBranchInfo.note) {
        console.log(`📝 Note for ${targetBranch}: \x1b[32m${targetBranchInfo.note}\x1b[0m`);
        
        // 显示备注添加/更新时间（已经是 'YYYY-MM-DD HH:mm:ss' 格式）
        if (targetBranchInfo.noteTimestamp) {
          console.log(`⏱️  Added/Updated: \x1b[32m${targetBranchInfo.noteTimestamp}\x1b[0m\n`);
        }
      } else {
        console.log(`ℹ️ No note found for branch: \x1b[33m${targetBranch}\x1b[0m\n`);
      }
    } catch (error) {
      handleError(error, "getting note");
    }
  });

  // 同步文件到远程
program
  .command("push")
  .description("Push notes file to remote repository")
  .option("-m, --message <message>", "Commit message for pushing notes")
  .action(async (options) => {
    try {
      const git = new GitUtils(currentDir);
      
      // 检查文件是否存在
      if (!fs.existsSync(path.join(currentDir, "branch-notes.json"))) {
        console.log("ℹ️ branch-notes.json file not found. Use \x1b[33m'git-bn init'\x1b[0m to create it.");
        return;
      }
      
      // 添加文件到暂存区
      await git.gitAdd(["branch-notes.json"]);
      
      // FIXME: 已经提交后 没有变更 也会提交
      // 尝试提交
      const commitMessage = options.message || "chore：Update branch notes";
      try {
        await git.gitCommit(commitMessage);
        console.log(`✅ Committed with message: "${commitMessage}"`);
      } catch (commitError: any) {
        if (commitError.message.includes("nothing to commit")) {
          console.log("ℹ️ No changes to commit. The notes file is already up to date.");
        } else {
          throw commitError;
        }
      }
      
      // 推送到远程
      try {
        await git.gitPush();
        console.log("✅ Successfully pushed branch-notes.json to remote repository.");
      } catch (pushError: any) {
        console.error("❌ Failed to push to remote repository:", pushError.message);
        console.log("ℹ️ Please make sure you're connected to the remote repository and have the necessary permissions.");
      }
    } catch (error) {
      handleError(error, "pushing notes");
    }
  });

  // 从远程拉取备注文件
program
  .command("pull")
  .description("Pull notes file from remote repository")
  .action(async () => {
    try {
      const git = new GitUtils(currentDir);
      
      // 拉取最新代码
      await git.gitPull();
      
      console.log("✅ Successfully pulled latest branch-notes.json from remote. Use \x1b[33m'git-bn list'\x1b[0m to view updated notes.");
    } catch (error: any) {
      if (error.message.includes("not a git repository")) {
        console.error("❌ Not a git repository. Please run this command in a git repository.");
      } else {
        handleError(error, "pulling notes");
      }
    }
  });


// 查看所有备注映射 -- 目前和 list 命令效果重叠 但是我只展示有备注的
program
  .command("mapping")
  .description("Show all branch notes mapping")
  .action(async () => {
    try {
      const mapping = await noteManager.showNotesMapping();
      console.table(mapping);
    } catch (error) {
      handleError(error, "showing notes mapping");
    }
  });

program.parse(process.argv);