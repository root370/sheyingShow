# 网站上线部署指南 (针对 latentspace.top)

你的网站目前只在本地电脑运行。要让所有人通过 `latentspace.top` 访问，你需要将代码**部署**到公网服务器，并配置**域名解析**。

鉴于你拥有 **ICP 备案号** (`沪ICP备2026003431号-1`)，这通常意味着你需要将域名解析到**中国大陆境内的服务器**才能保持备案号的有效性。

以下是两种主流方案：

---

## 方案 A：使用国内云服务器 (推荐 - 合规且速度快)
**适用场景**：保持备案号有效，国内访问速度极快。
**前提**：你需要拥有一台国内云服务器（阿里云、腾讯云等），且操作系统为 Ubuntu/CentOS。

### 1. 准备服务器环境

**情况 A：如果你是 Ubuntu / Debian 系统：**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs git nginx
```

**情况 B：如果你是 CentOS / 阿里云 Linux / RedHat 系统：**
(出现 "This script is only supported on Debian-based systems" 错误请用这个)
```bash
# 1. 安装 Node.js 源
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -

# 2. 安装 Node.js, Git, Nginx
sudo yum install -y nodejs git nginx

# 3. 启动 Nginx (CentOS 需要手动启动)
sudo systemctl start nginx
sudo systemctl enable nginx
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

### 6. 验证部署是否成功

在服务器终端执行以下命令进行检查：

1.  **检查 Node.js 服务是否在运行**：
    ```bash
    pm2 status
    # 应该看到名为 "sheying-show" 的进程状态为 "online"
    
    # 或者检查端口占用
    netstat -tulpn | grep 3000
    ```

2.  **检查 Nginx 是否正常**：
    ```bash
    systemctl status nginx
    # 状态应该是 "active (running)"
    ```

3.  **本地访问验证**：
    ```bash
    curl http://localhost
    # 如果返回了 HTML 代码（包含 <html...），说明 Nginx 到 Node.js 的转发是通的。
    ```

4.  **浏览器访问**：
    打开你的浏览器，访问 `http://latentspace.top`。
    *   如果能看到网站：🎉 成功！
    *   如果显示 "Welcome to Nginx"：说明 Nginx 没配置好 `proxy_pass`，或者没重启。
    *   如果无法访问 (超时)：检查阿里云/腾讯云后台的 **安全组 (防火墙)**，确保 **80 端口** 是开放的。

---

## 方案 B：使用 Vercel (最简单 - 但有掉备案风险)
**适用场景**：完全免费，无需运维，操作极简。
**风险提示**：Vercel 服务器在海外。根据规定，已备案域名如果长期未解析到国内接入商的服务器，**备案号可能会被注销**，导致域名在国内无法访问。请自行评估风险。

### 1. 推送代码到 GitHub
你需要先将本地代码推送到 GitHub 仓库。
```bash
# 我已经帮你完成了 git init 和 commit
# 你只需要运行以下命令进行推送 (需要验证 GitHub 账号):
git push -u origin main
```

### 2. 在 Vercel 导入项目
1.  访问 [vercel.com](https://vercel.com) 并使用 GitHub 登录。
2.  点击 "Add New..." -> "Project"。
3.  选择 `root370/sheyingShow` 仓库。
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
