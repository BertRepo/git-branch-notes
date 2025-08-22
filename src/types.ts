export interface BranchInfo {
  name: string;
  isCurrent: boolean;
  isRemote: boolean;
  commit: string;
  date: string;
  author: string;
  note?: string;
}

export interface NoteConfig {
  remote: string;
  ref: string;
  enabled: boolean;
}