# Git Branch Notes（Git 分支备注工具）
**其他语言: [English](README.md), [中文](README_zh.md).**

欢迎使用 Git Branch Notes！这是一个用于管理 Git 分支备注并支持远程同步的命令行工具。

[![license](https://img.shields.io/badge/license-MIT-blue)](LICENSE)


## 安装方式 

```bash
npm install -g git-branch-notes
```
## 使用方法
### 获取远程信息后列出所有带备注的分支
```bash
git-bn list
```

### 为分支设置备注
```bash
git-bn set feature-branch "hello, word!"
```
### 与远程仓库同步备注，团队其他成员即可获取备注信息
```bash
git-bn sync
```
### 从远程获取备注信息
```bash
git-bn fetch-notes
```
### 显示备注映射关系
```bash
git-bn mapping
```

## 功能特点

+ 📝 为 Git 分支添加备注信息
+ 🌐 支持远程同步功能
+ 🎯 提供 TypeScript 支持
+ 📊 详细的备注映射关系展示
