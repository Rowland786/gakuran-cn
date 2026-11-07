# 学乱 Wiki

官方 Trello 公开资料的非官方中文版。网站：https://rowland786.github.io/gakuran-cn/

294张卡片、19个分类、1,630个附件记录，101项具名天赋逐项翻译。默认展示13个未归档分类，可切换归档资料。衣柜保留Kaglorn的1,097项图鉴及署名。

## 运行

需要Node.js 22.13或更新版本。

```
npm ci
node scripts/prepare-content.mjs
node scripts/prepare-board.mjs
node scripts/verify-board.mjs
npm run build:pages
```

GitHub Pages构建默认前缀`/gakuran-cn`。本地预览时设置环境变量`NEXT_PUBLIC_BASE_PATH=/gakuran-cn`，运行`node scripts/serve-static.mjs`，打开 http://127.0.0.1:5173/gakuran-cn/ 。根域名部署需将此前缀设为空后重新构建。静态文件位于`dist/client/`。

## 资料

`research/board-live.json`保留官方公开JSON快照；`board-zh-1/2/3.json`逐卡保存中文正文；`perks-a/b.json`保存从天赋图逐项译出的名称与效果。`board-attachments.json`记录附件本地预览与原文件URL。生成结果为`public/data/board.json`。

图文及版本差异单独保留，未把旧数值和新公告混合成一个未经实测的结论。专名、代码、资产ID与歌曲名保留原拼写。天赋图已有中文文字，附件与英文原文可展开核对。

更新公开源数据使用`node scripts/sync-trello.mjs`，更新附件使用`node scripts/sync-board-assets.mjs`。新增卡片需补充对应中文译文；生成脚本会拒绝缺少翻译的发布数据。

附件预览随站点提供。较大的GIF转换为保留时序的动态WebP，原文件仍通过来源链接提供。看板背景和游戏图像来自官方Trello，归原权利人。

官方来源：https://trello.com/b/v3WatB1P

图鉴原作者Kaglorn：https://kaglorn.github.io/gakuran-clothes/

图鉴仓库：https://github.com/Kaglorn/gakuran-clothes

同步日期：2026-11-07。未实测游戏内数值、兑换码与中国大陆各网络连通性。
