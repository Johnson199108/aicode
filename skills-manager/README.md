# Skills Manager

本地 Web 平台，用于统一管理 TRAE 的全部 skills（自定义 / 插件 / 内置），并支持修改后提交推送到 git 远程仓库。

## 功能

- 扫描本地三类 skills 并分组展示：
  - 自定义（`~/.trae-cn/skills/`）— 可读可写
  - 插件（`~/.trae-cn/plugins/`）— 只读
  - 内置（`~/.trae-cn/builtin/`）— 只读
- 在线编辑 `SKILL.md` 及 references 子文件，支持 Markdown 实时预览
- 新建自定义 skill
- Git 同步：对自定义 skills 目录执行 提交 / 推送，同步到远程仓库

## 快速开始

```bash
cd skills-manager
npm install
npm start
```

浏览器打开 http://localhost:3210

## Git 同步配置

平台对 `~/.trae-cn/skills/`（自定义 skills 目录）进行 git 管理，远程仓库默认指向 `https://github.com/Johnson199108/my-skills`。

首次使用：
1. 在平台内编辑或新建 skill
2. 点击「提交」输入 commit message
3. 点击「推送」同步到 GitHub

## 技术栈

- 后端：Node.js + Express
- Git：simple-git
- 前端：原生 HTML/CSS/JS + marked.js（Markdown 预览）
