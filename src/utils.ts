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

// 错误处理函数
function handleError(error: unknown, context: string): void {
  if (error instanceof Error) {
    console.error(`\x1b[41mError ${context}:\x1b[0m`, error.message);
  } else {
    console.error(`\x1b[41mUnknown error ${context}:\x1b[0m`, error);
  }
}

// 时间戳处理
function formatTimestamp(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}


export { getPackageInfo, handleError, formatTimestamp };