# Reality Key Generator

[中文](README.md) | English

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/yourusername/reality-keygen)

A lightweight Cloudflare Worker for generating X25519 key pairs used in Reality protocol (e.g., for Sing-box, Xray, or Clash Meta configurations). Supports two modes: 
- **Random Generation**: Create a new private-public key pair on-the-fly.
- **Public Key Computation**: Input a Base64URL-encoded private key to derive the corresponding public key (with RFC 7748 clamping for security).

Built with Web Crypto API for secure, client-side computation. No server-side storage—keys are ephemeral.

## Features

- **Secure Key Derivation**: Uses `crypto.subtle` for X25519 operations, including private key clamping per RFC 7748.
- **Base64URL Encoding**: Outputs keys in URL-safe Base64 (no padding), compatible with Reality configs.
- **Dual Input Modes**: GET query param or POST JSON body for flexibility.
- **Pretty JSON Output**: Formatted with 4-space indentation for readability.
- **Error Handling**: Validates input (e.g., 32-byte private keys) and returns clear HTTP errors.
- **No Dependencies**: Pure JavaScript, runs efficiently on Workers.

Example Input (Private Key): `UPO3FWlg6YDJbASYi7KIESibPec_K46edTvDPbqEYFk`  
Example Output (Public Key): `62oH-GCCD4Acd2BGZeLyRmjVKZ6rOd_Xcd4k600HPGw`

## Usage

Deploy the Worker to a subdomain (e.g., `reality-keygen.youraccount.workers.dev`) and call the API via HTTP.

### Generate a New Key Pair
- **GET Request**: `https://your-worker.workers.dev/`  
  Returns a random pair.

- **POST Request**:
  ```bash
  curl -X POST https://your-worker.workers.dev/ \
    -H "Content-Type: application/json" \
    -d '{}'
  ```

**Example Response**:
```json
{
    "privateKey": "random-private-key-in-base64url",
    "publicKey": "corresponding-public-key-in-base64url"
}
```

### Compute Public Key from Private Key
- **GET Request**: `https://your-worker.workers.dev/?privateKey=UPO3FWlg6YDJbASYi7KIESibPec_K46edTvDPbqEYFk`

- **POST Request**:
  ```bash
  curl -X POST https://your-worker.workers.dev/ \
    -H "Content-Type: application/json" \
    -d '{"privateKey": "UPO3FWlg6YDJbASYi7KIESibPec_K46edTvDPbqEYFk"}'
  ```

**Example Response**:
```json
{
    "privateKey": "UPO3FWlg6YDJbASYi7KIESibPec_K46edTvDPbqEYFk",
    "publicKey": "62oH-GCCD4Acd2BGZeLyRmjVKZ6rOd_Xcd4k600HPGw"
}
```

### Error Responses
- **Invalid Input**: `400 Bad Request` (e.g., "Invalid JSON body" or non-32-byte key).
- **Computation Error**: `500 Internal Server Error` (e.g., "Private key must decode to exactly 32 bytes").

## Deployment

### Prerequisites
- A [Cloudflare Account](https://dash.cloudflare.com/sign-up) with Workers enabled.
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/) installed (`npm install -g wrangler`).

### Quick Deploy
1. Fork/Clone this repo.
2. Copy the code to `index.js` (or use the [Deploy Button](#) above for one-click setup).
3. Authenticate: `wrangler login`.
4. Publish: `wrangler deploy`.
   - Customize `wrangler.toml` for bindings, routes, or env vars if needed (e.g., custom domain).

### Manual Dashboard Deploy
1. Go to [Cloudflare Dashboard > Workers & Pages > Overview > Create Application > Workers](https://dash.cloudflare.com/?to=/:account/workers).
2. Paste the code into the editor.
3. Save and Deploy.
4. Bind to a route (e.g., `yourdomain.com/reality-keygen/*`).

### Testing Locally
- Run `wrangler dev` to preview at `http://localhost:8787`.
- Test with curl as shown above.

## Security Notes
- **Private Keys**: Treat as sensitive—use HTTPS and avoid logging inputs in production.
- **No Persistence**: Workers are stateless; keys aren't stored.
- **Clamping**: Automatically applied to prevent weak keys (e.g., clears low bits).
- **Limitations**: Relies on browser/Web Crypto compatibility; test with your target configs (e.g., Sing-box `reality_private_key` / `reality_public_key`).

## Contributing
Pull requests welcome! For issues, open a ticket with repro steps.

## License
MIT License. See [LICENSE](LICENSE) for details.