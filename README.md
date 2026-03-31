# 华清个人网站

这是一个纯静态个人网站，使用 HTML 与 CSS 构建，可直接从 GitHub Pages 的 `main` 分支根目录 `/(root)` 发布。

## 本地预览

在项目根目录运行：

```bash
python3 -m http.server 8000
```

然后打开：

- `http://127.0.0.1:8000/index.html`
- `http://127.0.0.1:8000/about.html`
- `http://127.0.0.1:8000/services.html`
- `http://127.0.0.1:8000/articles.html`
- `http://127.0.0.1:8000/contact.html`

## GitHub Pages 发布

1. 将当前仓库内容推送到 GitHub 仓库的 `main` 分支。
2. 打开 GitHub 仓库页面，进入 `Settings`。
3. 在左侧找到 `Pages`。
4. 在 `Build and deployment` 中选择 `Deploy from a branch`。
5. 将分支设置为 `main`，目录设置为 `/(root)`。
6. 点击 `Save`，等待 GitHub Pages 发布完成。

如果仓库名为 `xuyilong0314-svg.github.io`，发布完成后会直接使用该仓库对应的 GitHub Pages 地址。
