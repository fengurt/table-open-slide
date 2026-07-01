# 董家大院报告页 — 腾讯云静态部署

源文件：`dongreport20260525.html`（单文件，依赖 cdnjs 的 html2canvas / Font Awesome，需公网可访问 CDN）。

## 本地预览

```bash
# 方式 A：html-lab（推荐）
pnpm dev:html-lab
# 浏览器打开：
#   http://localhost:3333/?path=landing01/dong/dongreport20260525.html
# 或直接预览 HTML：
#   http://localhost:3333/api/preview?path=landing01/dong/dongreport20260525.html

# 方式 B：打包目录 + 本地静态服务
pnpm pack:dong-report
npx serve landing01/dong/dist -p 8765
# http://localhost:8765/dongreport20260525.html
```

## 打包上传目录

```bash
pnpm pack:dong-report
# 产出：landing01/dong/dist/dongreport20260525.html
```

## 腾讯云 COS 静态网站（推荐）

### 1. 创建存储桶

- 地域：按受众选择（如 **ap-guangzhou**）
- 访问权限：**公有读私有写**（或私有桶 + CDN 回源鉴权，见下）
- 开启 **静态网站**，索引文档：`dongreport20260525.html`，错误文档可同索引

### 2. 配置环境变量

```bash
export TENCENT_COS_BUCKET="your-bucket-1250000000"
export TENCENT_COS_REGION="ap-guangzhou"
export TENCENT_COS_PREFIX="dong/"   # 可选，上传到桶内子目录
# 密钥（CAM 子账号，仅 COS 读写）
export TENCENT_SECRET_ID="AKID..."
export TENCENT_SECRET_KEY="..."
```

### 3. 上传

需安装 [COSCLI](https://cloud.tencent.com/document/product/436/63143) 或 coscmd：

```bash
pnpm pack:dong-report
./scripts/deploy-dong-tencent-cos.sh
```

脚本默认用 `coscli`；若无 CLI，可在 [COS 控制台](https://console.cloud.tencent.com/cos) → 文件列表 → 上传 `landing01/dong/dist/` 内文件。

### 4. 访问地址

- **静态网站域名**（控制台 → 基础配置 → 静态网站）：  
  `https://<bucket-appid>.cos-website.<region>.myqcloud.com/<prefix>dongreport20260525.html`
- 若绑定 **自定义域名 + CDN**：在 CDN 控制台将源站设为 COS 静态网站域名，HTTPS 证书绑定后即可用自有域名访问。

### 5. 检查清单

| 项 | 说明 |
| --- | --- |
| CDN 外链 | 页面引用 cdnjs，国内一般可访问；若需离线，改为桶内静态资源并改 HTML 内 URL |
| CORS | 纯静态页，无后端 API |
| 缓存 | 更新 HTML 后刷新 CDN 缓存（目录刷新或 URL 带版本 `?v=20260525`） |
| 备案 | 自定义域名在中国大陆需 ICP 备案 |

## CVM + Nginx（备选）

将 `dist/dongreport20260525.html` 放到 `/var/www/dong/`，Nginx：

```nginx
server {
    listen 80;
    server_name report.example.com;
    root /var/www/dong;
    index dongreport20260525.html;
    location / {
        try_files $uri $uri/ /dongreport20260525.html;
    }
}
```

HTTPS 使用腾讯云 SSL 证书或 Let’s Encrypt。

## 回滚

保留上一版 HTML 为 `dongreport20260525.v1.html`，上传后切换静态网站索引或 CDN 回源路径即可。
