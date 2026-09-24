import nodemailer from "nodemailer";

// SMTP 配置需在 .env.local 中提供：
// SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASS(授权码)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 465,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * 通用邮件发送。
 * 未配置 SMTP 或发送失败时降级为控制台输出，返回 false（不抛错）。
 */
export async function sendMail(options: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}): Promise<boolean> {
  const hasSmtp = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS;
  if (!hasSmtp) {
    console.warn(
      `[mailer] 未配置 SMTP，邮件降级输出到控制台：${options.to} <- ${options.subject}`
    );
    return false;
  }
  try {
    await transporter.sendMail({
      from: `"面试网" <${process.env.SMTP_USER}>`,
      ...options,
    });
    return true;
  } catch (e) {
    const errMsg = e instanceof Error ? e.message : String(e);
    console.warn(`[mailer] 邮件发送失败：${options.to} <- ${options.subject}（${errMsg}）`);
    return false;
  }
}

/**
 * 发送注册验证码邮件。
 * 若未配置 SMTP，则降级为控制台输出验证码（便于本地联调）。
 */
export async function sendVerificationCode(
  to: string,
  code: string
): Promise<void> {
  const hasSmtp = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS;

  if (!hasSmtp) {
    console.warn(`[mailer] 未配置 SMTP，验证码降级输出到控制台：${to} -> ${code}`);
    return;
  }

  try {
    await transporter.sendMail({
      from: `"面试网" <${process.env.SMTP_USER}>`,
      to,
      subject: "面试网注册验证码",
      text: `您的注册验证码是：${code}，5 分钟内有效。`,
      html: `
        <div style="font-family:sans-serif;max-width:420px;margin:auto;border:1px solid #eee;border-radius:8px;padding:24px">
          <h2 style="margin-top:0">面试网邮箱验证</h2>
          <p>您正在注册面试网账号，请使用以下验证码完成注册：</p>
          <p style="font-size:28px;font-weight:bold;letter-spacing:6px;color:#2563eb">${code}</p>
          <p style="color:#888;font-size:13px">验证码 5 分钟内有效，请勿泄露给他人。若非本人操作，请忽略本邮件。</p>
        </div>
      `,
    });
  } catch (e) {
    // 邮件发送失败（如收件人不存在/网络抖动）不阻断注册流程，
    // 验证码已写入数据库，降级输出到控制台便于排查与本地联调。
    const errMsg = e instanceof Error ? e.message : String(e);
    console.warn(
      `[mailer] 邮件发送失败，验证码降级输出到控制台：${to} -> ${code}（${errMsg}）`
    );
  }
}
