# 网站上线部署指南 (针对 latentspace.top)

你的网站目前只在本地电脑运行。要让所有人通过 `latentspace.top` 访问，你需要将代码**部署**到公网服务器，并配置**域名解析**。

鉴于你拥有 **ICP 备案号** (`沪ICP备2026003431号-1`)，这通常意味着你需要将域名解析到**中国大陆境内的服务器**才能保持备案号的有效性。

以下是两种主流方案：

---

## 方案 A：使用国内云服务器 (推荐 - 合规且速度快)
**适用场景**：保持备案号有效，国内访问速度极快。
**前提**：你需要拥有一台国内云服务器（阿里云、腾讯云等），且操作系统为 Ubuntu/CentOS。

### 1. 准备服务器环境
在你的云服务器上安装 Node.js 和 Git：
```bash
# Ubuntu 为例
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs git nginx
```

### 2. 获取代码
你可以将代码上传到 GitHub，然后在服务器上拉取：
```bash
git clone https://github.com/你的用户名/sheyingShow.git
cd sheyingShow
npm install
```

### 3. 构建与运行
```bash
# 构建生产版本
npm run build

# 使用 PM2 后台运行 (推荐安装 PM2: npm install -g pm2)
pm2 start npm --name "sheying-show" -- start
```

### 4. 配置 Nginx 反向代理 (绑定域名)
编辑 Nginx 配置 (`/etc/nginx/sites-available/default`)，将域名指向本地 3000 端口：
```nginx
server {
    listen 80;
    server_name latentspace.top www.latentspace.top;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```
重启 Nginx：`sudo systemctl restart nginx`

### 5. 域名解析
去你的域名注册商（阿里云/腾讯云），添加 **A 记录**：
*   主机记录: `@`，记录值: `你的服务器公网IP`
*   主机记录: `www`，记录值: `你的服务器公网IP`

---

## 方案 B：使用 Vercel (最简单 - 但有掉备案风险)
**适用场景**：完全免费，无需运维，操作极简。
**风险提示**：Vercel 服务器在海外。根据规定，已备案域名如果长期未解析到国内接入商的服务器，**备案号可能会被注销**，导致域名在国内无法访问。请自行评估风险。

### 1. 推送代码到 GitHub
你需要先将本地代码推送到 GitHub 仓库。
```bash
git init
git add .
git commit -m "Initial commit"
# 关联你的 GitHub 仓库 (先在 GitHub 上创建空仓库)
git remote add origin https://github.com/你的用户名/仓库名.git
git push -u origin main
```

### 2. 在 Vercel 导入项目
1.  访问 [vercel.com](https://vercel.com) 并使用 GitHub 登录。
2.  点击 "Add New..." -> "Project"。
3.  选择你刚才推送的 `sheyingShow` 仓库。
4.  **配置环境变量** (非常重要！)：
    在 "Environment Variables" 区域，把 `.env` 文件里的内容复制进去：
    *   `NEXT_PUBLIC_SUPABASE_URL`
    *   `NEXT_PUBLIC_SUPABASE_ANON_KEY`
    *   `GEMINI_API_KEY`
    *   (其他必要的变量...)
5.  点击 **Deploy**。

### 3. 绑定域名
1.  部署成功后，在 Vercel 项目控制台点击 **Settings** -> **Domains**。
2.  输入 `latentspace.top` 并添加。
3.  Vercel 会提示你如何配置 DNS。你需要去域名注册商添加 **CNAME 记录** 或 **A 记录**（按照 Vercel 的提示操作）。

---

## ⚠️ 关键检查清单

1.  **Supabase 配置**：
    确保你在 Supabase 后台的 **Authentication -> URL Configuration** 中，将 `Site URL` 和 `Redirect URLs` 更新为你的新域名 (例如 `https://latentspace.top`)。否则登录功能会报错！

2.  **环境变量**：
    生产环境必须手动配置环境变量，本地的 `.env` 文件不会自动上传。
