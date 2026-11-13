# 顺路面包 · 案例网站

虚构社区面包品牌，含案例首页、香气卡与点餐原型、3D工坊、过程记录、资料库。模拟订单；无在线模型调用。

## EdgeOne Pages 导入
- 分支：codex/edgeone-migration；框架Other；根目录 ./。
- 安装：npm ci --no-audit --no-fund；构建：npm run build；输出：dist；Node22.11.0。
- 构建环境变量：ASSET_BASE_URL=https://szy-1525664363.cos.ap-shanghai.myqcloud.com/shunlu/
- 将27MB主片 brand-film-460631360e19e68e.mp4 上传到现有上海COS桶的shunlu/目录，保持公有读私有写。只上传指定MP4，不上传server-assets。
- 设置全局（不含中国大陆）加速区域，域名建议shunlu.szydym.com。COS允许实际HTTPS网站来源、GET/HEAD、允许Headers *。保留已有项目来源。

## 运行与验证
npm test；首次干净检出设置环境变量后 npm run build。构建拒绝覆盖已有dist，重复本地构建请先将旧产物归档到work。Cloud Functions/API由平台额外构建，不能只上传dist替代Git导入。
cloud-functions/api提供/api/card和/api/export。legacy-api与server保留旧业务逻辑；src/edgeone/adapter.mjs适配Web Request与平台字符串请求体。cloudFunctions配置includeFiles和externalNodeModules，保证Sharp、PDF库、中文字体与底稿一起打包。server-assets不进入网页静态目录。

验收：进入香气卡，生成带中文留言卡片，下载分享PNG、壁纸PNG和打印PDF；完整模拟预订；3D工坊进店与天气；资料库搜索及PDF；两个视频播放与拖动。原始服务器没有数据库或外部账号依赖。
官方CLI1.7.2本地构建用于检查接口是否被发现、依赖和资源是否打包；真实云端函数与COS仍需部署后验证。

## 来源与维护
工作台D:/Workspace/projects/project-027-愚园路社区面包店品牌。发布基线deploy-main-v006（含2026-10-15香气选择反馈）和deploy-media-v004，保持旧输出不变。src/edgeone维护迁移脚本。媒体资料保留既有来源及概念项目标识；字体许可证随文件保留，不扩大第三方素材授权。
官方配置：https://pages.edgeone.ai/document/edgeone-json
函数文档：https://pages.edgeone.ai/document/node-functions
