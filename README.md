# 何华清｜愿景思维

这是一个纯静态中文个人独立站，使用 HTML 与 CSS 构建，适合直接发布到 GitHub Pages 或 Vercel。

## 网站文件结构

```text
/
├── index.html                 首页
├── about.html                 关于我
├── vision.html                愿景思维
├── articles.html              文章专栏首页
├── projects.html              课程 / 项目
├── contact.html               联系
├── services.html              旧链接跳转页，自动跳到 projects.html
├── styles.css                 全站样式
├── .nojekyll                  GitHub Pages 静态发布标记
├── articles/                  文章详情页
│   ├── ren-bu-shi-canque.html
│   ├── yuan-shengming-de-ben-gen.html
│   ├── wo-zong-jue-de-bu-gou-hao.html
│   ├── wei-shen-me-yi-zhi-zai-nu-li.html
│   ├── shi-jian-zhi-wai.html
│   └── yuan-jing-bu-shi-di-da.html
├── scripts/                   本地私人资料库脚本
├── personal_archive/          本地私人检索资料库输出目录
└── site-ia-copy-draft.md      网站信息架构与文案草案
```

## 如何本地预览

在项目根目录运行：

```bash
python3 -m http.server 8000
```

如果 `8000` 端口被占用，可以改用：

```bash
python3 -m http.server 8001
```

然后在浏览器打开：

- `http://127.0.0.1:8000/index.html`
- 或 `http://127.0.0.1:8001/index.html`

主要页面：

- `index.html`：首页
- `about.html`：关于我
- `vision.html`：愿景思维
- `articles.html`：文章专栏首页
- `projects.html`：课程 / 项目
- `contact.html`：联系

## 如何发布到 GitHub Pages

这套站点没有构建步骤，直接发布根目录即可。

1. 把当前项目推送到 GitHub 仓库的 `main` 分支。
2. 打开 GitHub 仓库页面，进入 `Settings`。
3. 点击左侧 `Pages`。
4. 在 `Build and deployment` 里选择 `Deploy from a branch`。
5. 分支选择 `main`，目录选择 `/(root)`。
6. 点击 `Save`。
7. 等待 GitHub Pages 发布完成，GitHub 会给出线上地址。

如果你后续绑定自定义域名，可以在 `Pages` 页面直接配置。

## 如何发布到 Vercel

这套站点同样可以零构建发布到 Vercel。

1. 登录 [Vercel](https://vercel.com/)。
2. 点击 `Add New...` -> `Project`。
3. 选择你的 GitHub 仓库并导入。
4. Framework Preset 选择 `Other` 或保持自动识别。
5. Build Command 留空。
6. Output Directory 留空。
7. 点击 `Deploy`。

Vercel 会自动把根目录当作静态站点发布。后续你每次推送到仓库，它都可以自动重新部署。

## 哪种方式更适合这个站

如果你要的是一个长期稳定、低维护、纯内容型的个人独立站，`GitHub Pages` 更适合当前这一版。

原因很简单：

- 这是纯静态站，没有后台、没有构建流程、没有动态接口。
- GitHub Pages 足够稳定，而且免费。
- 发布链路更简单，后续维护成本最低。

如果你后面很看重这些能力，可以考虑换到 `Vercel`：

- 每次提交都自动生成预览链接
- 自定义域名和 HTTPS 配置更顺手
- 以后如果升级到 Next.js 之类框架，也更方便继续演进

对目前这个“作者型、思想型、静态内容站”来说，我的建议是：

`先用 GitHub Pages 上线最合适。`

## 本地私人资料库

仓库根目录提供了两份本地脚本，用来把个人文稿整理成一个可检索的私人资料库：

```bash
python3 scripts/build_personal_archive.py
python3 scripts/search_personal_archive.py "愿景"
```

默认会读取 `personal_archive/sources.json` 里的文档清单，生成：

- `personal_archive/index.sqlite`：本地检索数据库
- `personal_archive/texts/`：统一抽取后的纯文本
- `personal_archive/manifest.json`：文档与同内容关系元数据
- `personal_archive/search.html`：可直接打开的本地搜索页

`personal_archive/` 已加入 `.gitignore`，这些私人材料不会默认被提交到网站仓库或随公开站点一起发布。
