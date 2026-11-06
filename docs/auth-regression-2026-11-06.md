# 账号注册与登录专项回归验收

日期：2026-11-06，北京时间。基线：`fbf753b19e85404498cbcc4fd5efeab22e139f66`（11 月 5 日 22:08:56）。上一提交为 `8b070c97be3ae04fd6a225153211cd963229731c`（21:13:22）。

**结论：代码与隔离模拟测试已完成，生产完整注册验收尚未通过。修复位于独立分支，尚未合并或发布。**

未访问会员账号、健康档案、照片、团队成员列表或账号清理接口；未创建或删除生产账号，未发出测试邮件。所有测试身份均为虚构数据。

## 1. 已验证的生产事实

- 当前 `main` 为上述基线。对应 [GitHub Pages 发布任务](https://github.com/xuyilong0314-svg/hehuaqing-site/actions/runs/42042311407) 成功；这是发布结果，不是认证测试结果。
- 约北京时间 20:35 的 HTTP 检查中，下列 9 个生产文件均返回 200，下载内容逐字节等于基线：`account/index.html`、`account/app.js`、`account/client.js`、`account/auth-support.js`、`zhongyi/aform/app.js`、`auth.js`、`registration.js`、`config.js`、`analytics/config.js`。
- 使用已公开的 publishable key，仅 GET `/auth/v1/settings`：`disable_signup=false`、`external.email=true`、`mailer_autoconfirm=false`。确认当前开启邮箱注册并要求邮箱验证，不能由此证明邮件实际发送或送达。
- `https://hehuaqing.com/account/` 和 `https://xuyilong0314-svg.github.io/hehuaqing-site/account/` 均最终返回 `https://www.hehuaqing.com/account/`，状态 200。
- 生产 Chrome 页面实测：账号页加载、切换注册、打开“忘记密码”、返回登录均正常。没有提交账号或密码。
- 在生产页面使用**人工构造、无 token 的过期错误参数**并刷新，确认被渲染为注册验证提示，即使 `type=recovery` 也要求查看注册验证邮件。该检查验证前端错误页，不是真实邮件过期测试。

## 2. 代码与配置范围

已读取：账号 app/client/auth-support/nav/index，A 表 app/auth/registration/config/index，团队 shared-auth/team，analytics/config、site-analytics、根 index、README、CNAME，以及仓库树、提交与 Pages 运行记录。认证 SDK 为仓库自带的 Supabase JS 2.118.0。

三个入口指向同一 Supabase 项目，使用一致的默认本地会话键 `sb-mdwbtgjyrdqfwupvadir-auth-token`。账号页关闭 URL 自动会话检测，并由 HTML 将认证回跳交给 A 表；A 表和团队启用检测。注册和密码找回均使用规范回跳地址 `https://www.hehuaqing.com/zhongyi/aform/`。

未找到已有测试源码、package.json 或自定义 CI 工作流。仓库只有 `test-results/.last-run.json`，其中 `status=failed`、`failedTests=[]`，不足以还原测试内容或失败原因。本次新增独立测试与 CI，不将原结果记录当作验收依据。

## 3. 确定缺陷与最小修复

| 优先级 | 基线问题与触发条件 | 修复与验证 |
|---|---|---|
| P1 | 回调携带无效 token，但浏览器保留另一份有效会话：校验函数只验证已保存 token，模拟中可误报成功 | 在内存中保留并向 `getUser` 提交当前回调 token，继续校验返回身份与会话一致；重试仍使用原 token |
| P1 | 仅 `type=recovery`、没有 token 的地址可借用旧登录进入密码设置；恢复流程没有复用注册的服务端身份确认 | 注册、邀请/恢复回跳统一先确认会话与当前链接身份；缺 token 的恢复链接不进入密码表单 |
| P1 | 注册成功页遇到另一标签退出或切换账号仍保留旧成功结果；显式 `/login` 页面接收跨页登录只更新变量 | 退出/切号立即清除成功状态；跨页登录重新加载身份并更新页面 |
| P1 | 账号上下文或阅读历史请求晚于退出返回，旧响应可能重画已登录状态 | 用状态版本及会话检查丢弃过时响应；退出事件立即清除账号界面 |
| P2 | 账号页对任何 storage 事件重载，其他页更新阅读设置等非认证键时清空正在填写的表单 | 只响应认证键或 storage 清空事件 |
| P2 | 过期恢复链接展示注册指引；查询字符串错误未识别，入口转发条件也不完整 | 识别 hash/query 错误；保留恢复用途，提供重新找回密码入口；无用途错误同时说明注册与恢复路径 |
| P2 | 认证 HTTP 请求没有应用层时限，挂起请求可能长期占用表单 | 为 `/auth/v1/` 请求增加 12 秒 AbortController 截止，并保留调用方取消；其他业务请求不使用该时限 |

P1 描述的是前端身份确认、状态呈现和竞争条件问题，**不是已经证明可以绕过 Supabase 服务端权限或盗取账号**。没有对生产用户进行攻击验证。

改动没有关闭邮箱验证，没有改变数据库权限、角色、密钥或账号删除规则。相关入口更新脚本版本。测试基础设施为开发依赖，不参与静态站点运行。

## 4. 回归矩阵

| 关键路径 | 代码/模拟结果 | 生产验证范围 |
|---|---|---|
| 邮箱注册 | 两个表单均调用 signUp，带回跳地址；无 session 不显示成功 | 表单可打开；注册开关已核实；未提交真实注册 |
| 验证邮件 | 验证请求参数、待验证提示已覆盖 | 未验证 SMTP、模板、收件箱、垃圾箱、投递限额 |
| 验证链接回跳 | 成功、无 token、旧会话、身份不匹配、未确认邮箱、401、503、超时和重试已覆盖 | 静态路径与人工构造的错误页已检查；未点击真实邮件 |
| 首次及已有账号登录 | 账号页和 A 表正常登录、错误凭据、未验证邮箱均覆盖；模拟 profile 只含虚构数据 | 未用生产测试账号登录；实际 profile 创建触发器未验证 |
| 重复注册 | 两个入口均覆盖明确重复错误及无 session 的混淆用户返回，不误报成功 | 真实重复注册的服务端策略、邮件发送行为未验证 |
| 密码找回 | 邮件请求、有效恢复、无 token、过期错误、保存新密码已模拟 | 未发送生产邮件、未修改实际密码；新旧密码生效需补验 |
| 网络异常 | 报错分类、保留输入、恢复按钮、连接探测、请求取消/超时已覆盖 | 公开 settings 能连通；真实弱网、断网恢复、DNS/代理故障未实测 |
| 微信 | UA 检测及账号页网络错误的“浏览器中打开”提示通过模拟 | 未使用 iOS/Android 微信真机；健康档案页只有通用浏览器提示，帮助交互仍有差异 |
| 跨页面会话 | 模拟 SIGNED_IN/SIGNED_OUT、storage 和晚到响应，覆盖阅读、健康记录、团队 | 同项目/同存储键及域名跳转已核实；真实 BroadcastChannel、多标签、WebKit/微信隔离存储未验证 |

在未修改的基线副本上重放 8 项针对性 UI 模拟用例，8 项均复现失败；在修复分支上这些用例均通过。

**测试结果：56 / 56 通过，0 失败、0 跳过。** 命令 `npm test`；本机 Node.js v24.22.1。测试由 Node 原生测试运行器、VM 和 LinkeDOM 执行，使用真实页面代码、模拟的认证/数据返回及事件；不是 Playwright 全浏览器 E2E。`git diff --check` 和变更 JavaScript 的语法检查通过。

已增加 `.github/workflows/auth-regression.yml`，在 PR 和 main 提交时执行隔离测试，权限仅 `contents: read`，不使用生产凭据。远端运行结果应以 PR 检查状态为准，不能由本地通过推定。

## 5. 仍需完成的生产验收

1. 由可访问 Supabase 项目配置的维护者核对 Site URL、Redirect URLs、确认邮件与恢复邮件模板。准确允许 `https://www.hehuaqing.com/zhongyi/aform/`；确认模板保留正确 RedirectTo，不静默回退到首页。公开 settings 不提供白名单或 SMTP 配置。
2. 使用专用、可收信的测试邮箱完成新注册 → 收信 → 点击最新链接 → 成功页 → 首次登录 → 阅读/健康记录/团队入口。只创建测试者自己的空记录，团队成员权限应按真实策略显示。
3. 同邮箱重复注册，确认页面不误报；分别测试旧链接、再次使用、实际过期和发送频率限制。记录结果和脱敏时间，不记录邮件 token。
4. 密码找回 → 收信 → 设置新密码 → 退出 → 新密码可登录、旧密码不可登录；已登录其他账号时点击测试邮件，确认最终身份为邮件对应测试账号。
5. 同一浏览器多个标签页进行登录、退出和切号；用 Safari、Android Chrome、iOS/Android 微信检查。同源 localStorage 不代表微信和外部浏览器共享会话；在外部浏览器完成验证后，微信中可能需要再登录。
6. 真机断网/恢复、慢响应、存储受限与从后台回到前台。12 秒限制是单次认证 HTTP 请求截止，不保证 SDK 的多次重试或组件加载总时长小于 12 秒。

上述缺口需要**专用测试邮箱的收信能力、Supabase 配置读取权限及微信真机**；当前仅有 GitHub 写入权限和公开站点/公开认证配置访问，无法据此宣布生产全场景通过。

尚未纳入本次最小修复：独立“重新发送注册验证邮件”入口；健康档案页与账号页的连接诊断按钮完全统一；PKCE `?code=` 邮件流程（当前客户端使用默认 implicit 流程，若后台模板或客户端改用 PKCE，应另补完整测试）。

## 6. 发布与回滚

先审阅分支/PR 与 CI，再合并 main 并等待 Pages 成功，随后核对生产文件内容和上面的邮箱/真机流程。线上未部署本次修复时，不能把本地 56 项通过写成线上验收通过。回滚可 revert 本次修复提交；无需回滚数据库迁移，因为本次没有数据库变更。

参考：[Supabase signUp](https://supabase.com/docs/reference/javascript/auth-signup)、[认证状态事件](https://supabase.com/docs/reference/javascript/auth-onauthstatechange)、[密码找回](https://supabase.com/docs/reference/javascript/auth-resetpasswordforemail)、[Redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls)。重复注册可能返回隐藏账号存在性的结果，因此测试同时覆盖错误和无 session 两类响应；邮件能否返回指定地址仍取决于实际 URL 配置与模板。
