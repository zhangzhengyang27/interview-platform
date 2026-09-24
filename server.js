/**
 * HTTPS 开发服务器（用于本地 mkcert 证书，解锁浏览器麦克风/摄像头 API）
 *
 * navigator.mediaDevices 只在「安全上下文」（HTTPS 或 localhost）下可用。
 * 局域网设备（手机等）通过 https://192.168.1.4:3001 访问时，
 * 需要 HTTPS 才能使用语音输入的麦克风、视频面试的摄像头。
 *
 * 用法：npm run dev:https
 */
const { createServer } = require("https");
const { parse } = require("url");
const next = require("next");
const fs = require("fs");
const path = require("path");

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME || "0.0.0.0";
const port = parseInt(process.env.PORT || "3001", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

const httpsOptions = {
  key: fs.readFileSync(path.join(__dirname, "certs", "localhost-key.pem")),
  cert: fs.readFileSync(path.join(__dirname, "certs", "localhost.pem")),
};

app.prepare().then(() => {
  createServer(httpsOptions, (req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  }).listen(port, hostname, (err) => {
    if (err) throw err;
    console.log(`> HTTPS 服务器已就绪: https://localhost:${port}`);
    console.log(`> 局域网访问: https://192.168.1.4:${port}`);
  });
});
