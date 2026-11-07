# 学乱档案室

Gakuran 非官方中文 Wiki。对话导航、技能旁白、词条资料库、外观图鉴、个人笔记及来源索引。

本版收录 78 篇中文资料、26 种战斗风格、294 张官方卡片索引和 Kaglorn 整理的 1,097 项外观。核对日期 2026-11-07；图鉴为 2026-10-21 快照。内容与数值未经游戏内实测，矛盾与版本差异保留在词条正文。

## 运行

使用 Node.js 22.13 或更新版本。在本目录执行：

```
npm ci
node scripts/prepare-content.mjs
npm run build:pages
node scripts/serve-static.mjs
```

GitHub Pages 构建默认前缀 `/gakuran-cn`，本地预览需设置环境变量 `NEXT_PUBLIC_BASE_PATH=/gakuran-cn` 后启动服务，打开 http://127.0.0.1:5173/gakuran-cn/ 。开发使用 `npm run dev`。根域名部署时，将此环境变量设为空字符串后重新执行 `npm run build:pages`。生产静态文件位于 `dist/client/`。无需服务器端数据库。所有图像、CSS、JS 与资料在本地提供。外链来源仍连接原始服务。

## 内容维护

`research/` 保存一手资料快照和三个中文整理包；`scripts/prepare-content.mjs` 校验、合并并输出 `public/data/`。更新后重新构建。个人笔记和任务通过 localStorage 保存在浏览器中，清理站点数据会清空记录。本版没有多人编辑、后台账号或自动同步任务。

## 出处与署名

- 官方 Trello：https://trello.com/b/v3WatB1P
- 官方 Roblox：https://www.roblox.com/games/128736949265057/Gakuran
- Kaglorn 原图鉴：https://kaglorn.github.io/gakuran-clothes/
- Kaglorn 仓库：https://github.com/Kaglorn/gakuran-clothes

外观数据与原图保留作者及来源，不将其署名为本站原创。界面和中文整理独立制作；校园氛围插画通过内置 ImageGen 生成，提示见 `public/data/research-report.md`，非游戏截图。对话式阅读参考《极乐迪斯科》的交互思路，未使用其游戏图像、角色或原文。

## 发布与国内访问

正式发布采用 GitHub Pages：https://rowland786.github.io/gakuran-cn/ 。仓库根目录原有的 Kaglorn 图鉴文件保留，新 Wiki 源码位于 `wiki/`，已构建静态文件位于 `docs/`。GitHub Actions 发布 `docs/`，使用 `github-pages` 环境。更新中文资料或界面后，需重新构建并同步静态目录。部署成功与中国大陆公网连通性是独立结果，GitHub Pages 上线不能证明所有国内网络均能稳定访问。
