# 账号专项回归

运行：Node.js 22 或更新版本，`npm ci --ignore-scripts && npm test`。

测试在 Node.js 中执行。`auth.test.mjs` 直接调用生产认证辅助函数；`app.test.mjs` 在独立 VM 和 LinkeDOM 中加载生产页面模块，提供虚构 Supabase 响应、表单、存储事件和认证事件。数据仅使用 `example.invalid` 和合成 token。网络调用默认抛错，既不创建线上账号，也不发送邮件、读取会员资料或调用账号清理接口。

测试覆盖正常/失败注册、重复注册两种返回、首次/已有账号登录、恢复链接和密码更新、错误与超时、微信 UA 提示、会话变更及异步响应竞争。UI 事件属于 DOM 模拟，不是完整浏览器端到端测试；会话广播由测试显式注入，不代表已验证真实 BroadcastChannel、WebKit、微信容器或跨域存储。

生产验收仍需专用测试邮箱：收信、有效/过期/重复使用的真实链接、Supabase URL 白名单和模板、真机微信、多个浏览器标签页、无痕/禁止存储环境。参见 `docs/auth-regression-2026-11-06.md`。

没有测试需要生产凭据。不要将 service-role key、真实账号密码、验证 token 或真实会员资料加入本目录、CI 或测试输出。
