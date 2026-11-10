# 学乱 Wiki

官方 Trello 公开资料的非官方中文版。网站：https://rowland786.github.io/gakuran-cn/

298张卡片、19个分类、1,718个附件记录，101项具名天赋逐项翻译。默认展示13个未归档分类，可切换归档资料。衣柜保留Kaglorn的1,097项图鉴及署名。

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

## 觉醒流程

觉醒总页支持筛选，各风格卡直接展示对应阶段。`research/awakening-quests.json`保存15种完整流程，以及4种已公布第一阶段的流程；后两阶段待补，来源差异分别标明。任务图与Trello正文不一致时分别标明；任务图未标注版本，不把不同条件合并为已确认结论。生成脚本校验源卡和参考图指纹，来源变化后需重新核对。

## 资料

`research/board-live.json`保留官方公开JSON快照；`board-zh-1/2/3.json`逐卡保存中文正文；`perks-a/b.json`保存从天赋图逐项译出的名称与效果。`board-attachments.json`记录附件本地预览与原文件URL。生成结果为`public/data/board.json`。

图文及版本差异单独保留，未把旧数值和新公告混合成一个未经实测的结论。专名、代码、资产ID与歌曲名保留原拼写。天赋图已有中文文字，图片附件可展开核对，正文展示中文说明。

更新公开源数据使用`node scripts/sync-trello.mjs`，更新附件使用`node scripts/sync-board-assets.mjs`，正文跨卡引用使用`node scripts/sync-embedded-assets.mjs`。新增卡片与已修改正文都需同步中文译文；每条译文的sourceHash对应源卡名称与正文，生成脚本会拒绝缺失或过期的翻译。board-sync.json记录抓取时间和源文件指纹；board-annotations.json保存更新公告对旧卡的补充说明。

附件预览随站点提供。195个GIF演示转换为H.264 MP4，直接放在相关说明下，支持播放、暂停、进度和全屏。封面与视频随站点提供，原文件保留来源链接。`research/board-demos.json`记录演示清单。更新演示运行`node scripts/prepare-demo-videos.mjs`，需本机提供ffmpeg、ffprobe与sharp，然后重新生成看板。看板背景和游戏图像来自官方Trello，归原权利人。

官方来源：https://trello.com/b/v3WatB1P

图鉴原作者Kaglorn：https://kaglorn.github.io/gakuran-clothes/

图鉴仓库：https://github.com/Kaglorn/gakuran-clothes

同步日期：2026-11-10。未实测游戏内数值、兑换码与中国大陆各网络连通性。
