# 猫鼠大作战 (Crazy Eights: Cat and Mouse Edition)

这是一个基于 React + Vite + Tailwind CSS 开发的经典纸牌游戏《疯狂 8 点》的猫和老鼠主题版。

## 如何同步到 GitHub

1. **在 GitHub 上创建一个新的仓库**（不要勾选初始化 README）。
2. **在本地终端执行以下命令**（如果你已经安装了 Git）：

```bash
# 初始化 git 仓库
git init

# 添加所有文件
git add .

# 提交更改
git commit -m "Initial commit: Cat and Mouse Battle Game"

# 关联远程仓库 (替换为你的仓库地址)
git remote add origin https://github.com/你的用户名/你的仓库名.git

# 推送到 GitHub
git branch -M main
git push -u origin main
```

## 如何部署到 Vercel

1. **登录 Vercel** (https://vercel.com)。
2. **点击 "Add New" -> "Project"**。
3. **导入你刚才创建的 GitHub 仓库**。
4. **配置项目**：
   - **Framework Preset**: 选择 `Vite` (通常会自动检测)。
   - **Build Command**: `npm run build`。
   - **Output Directory**: `dist`。
5. **点击 "Deploy"**。

部署完成后，Vercel 会为你提供一个公网访问地址。

## 技术栈

- **React 19**
- **Vite**
- **Tailwind CSS**
- **Motion** (动画)
- **Lucide React** (图标)
