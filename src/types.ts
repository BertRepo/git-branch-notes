export interface BranchInfo {
  name: string;
  isCurrent: boolean;
  isRemote: boolean;
  commit: string;
  date: string;
  author: string;
  note?: string;
  noteTimestamp?: string; // 备注添加时间
}

export interface NoteConfig {
  remote: string;
  ref: string;
  enabled: boolean;
}

// 分支备注
interface BranchNote {
  branchName: string;
  note: string;
  timestamp: string; // 'YYYY-MM-DD HH:mm:ss'
  status?: 'active' | 'deleted'; // 分支状态，默认为active 可选
}

// 分支备注存储文件
export interface BranchNotesData {
  version: string; // 文件格式版本
  notes: BranchNote[];
  lastUpdated: string; // 'YYYY-MM-DD HH:mm:ss'
}