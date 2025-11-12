# Reality 密钥生成器

中文 | [English](README_EN.md)

[![部署到 Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/yourusername/reality-keygen)

这是一个轻量级的 Cloudflare Worker，用于生成 Reality 协议（例如 Sing-box、Xray 或 Clash Meta 配置）中使用的 X25519 密钥对。支持两种模式：
- **随机生成**：即时创建新的私钥-公钥对。
- **公钥计算**：输入 Base64URL 编码的私钥，推导对应的公钥（符合 RFC 7748 的私钥钳制以确保安全性）。

使用 Web Crypto API 进行安全的客户端计算。无服务器端存储——密钥为临时性。

## 功能特点

- **安全密钥推导**：利用 `crypto.subtle` 进行 X25519 操作，包括私钥钳制（RFC 7748）。
- **Base64URL 编码**：输出密钥为 URL 安全的 Base64（无填充），兼容 Reality 配置。
- **双输入模式**：支持 GET 查询参数或 POST JSON 主体，灵活便捷。
- **美观 JSON 输出**：使用 4 空格缩进，便于阅读。
- **错误处理**：验证输入（例如 32 字节私钥），返回清晰的 HTTP 错误。
- **无依赖**：纯 JavaScript，在 Workers 上高效运行。

示例输入（私钥）：`UPO3FWlg6YDJbASYi7KIESibPec_K46edTvDPbqEYFk`  
示例输出（公钥）：`62oH-GCCD4Acd2BGZeLyRmjVKZ6rOd_Xcd4k600HPGw`

## 使用方法

将 Worker 部署到子域名（例如 `reality-keygen.youraccount.workers.dev`），然后通过 HTTP 调用 API。

### 生成新的密钥对
- **GET 请求**：`https://your-worker.workers.dev/`  
  返回随机密钥对。

- **POST 请求**：
  ```bash
  curl -X POST https://your-worker.workers.dev/ \
    -H "Content-Type: application/json" \
    -d '{}'
  ```

**示例响应**：
```json
{
    "privateKey": "random-private-key-in-base64url",
    "publicKey": "corresponding-public-key-in-base64url"
}
```

### 从私钥计算公钥
- **GET 请求**：`https://your-worker.workers.dev/?privateKey=UPO3FWlg6YDJbASYi7KIESibPec_K46edTvDPbqEYFk`

- **POST 请求**：
  ```bash
  curl -X POST https://your-worker.workers.dev/ \
    -H "Content-Type: application/json" \
    -d '{"privateKey": "UPO3FWlg6YDJbASYi7KIESibPec_K46edTvDPbqEYFk"}'
  ```

**示例响应**：
```json
{
    "privateKey": "UPO3FWlg6YDJbASYi7KIESibPec_K46edTvDPbqEYFk",
    "publicKey": "62oH-GCCD4Acd2BGZeLyRmjVKZ6rOd_Xcd4k600HPGw"
}
```

### 错误响应
- **无效输入**：`400 Bad Request`（例如 “Invalid JSON body” 或非 32 字节密钥）。
- **计算错误**：`500 Internal Server Error`（例如 “Private key must decode to exactly 32 bytes”）。

## 部署方法

### 前置条件
- [Cloudflare 账户](https://dash.cloudflare.com/sign-up)，启用 Workers。
- 安装 [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/)（`npm install -g wrangler`）。

### 快速部署
1. Fork/克隆此仓库。
2. 将代码复制到 `index.js`（或使用上面的 [部署按钮](#) 一键设置）。
3. 认证：`wrangler login`。
4. 发布：`wrangler deploy`。
   - 如需自定义 `wrangler.toml`，用于绑定、路由或环境变量（例如自定义域名）。

### 仪表板手动部署
1. 访问 [Cloudflare 仪表板 > Workers & Pages > Overview > Create Application > Workers](https://dash.cloudflare.com/?to=/:account/workers)。
2. 将代码粘贴到编辑器。
3. 保存并部署。
4. 绑定路由（例如 `yourdomain.com/reality-keygen/*`）。

### 本地测试
- 运行 `wrangler dev` 在 `http://localhost:8787` 预览。
- 使用上述 curl 示例测试。


## 安全注意事项
- **私钥**：视为敏感信息——使用 HTTPS，并在生产环境中避免记录输入。
- **无持久化**：Workers 为无状态，密钥不存储。
- **钳制**：自动应用以防止弱密钥（例如清除低位）。
- **限制**：依赖浏览器/Web Crypto 兼容性；请在目标配置中测试（例如 Sing-box 的 `reality_private_key` / `reality_public_key`）。

## 贡献
欢迎 Pull Requests！如有问题，请开 issue 并提供复现步骤。

## 许可证
MIT 许可证。详见 [LICENSE](LICENSE)。