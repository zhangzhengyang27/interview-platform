import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDueReviewQuestions } from "@/lib/review-scheduler";
import { sendMail } from "@/lib/mailer";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * POST /api/reminders/digest — 发送复习提醒邮件摘要（定时任务端点）
 *
 * 由外部 cron 调度（如每天早上 8 点）：
 *   curl -X POST -H "x-cron-secret: $CRON_SECRET" https://<host>/api/reminders/digest
 *
 * 为所有开启 reminderEnabled 的用户计算到期复习数量并发送邮件；
 * 未配置 SMTP 时 sendMail 自动降级为控制台输出，不会报错中断。
 */
export async function POST(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "CRON_SECRET 未配置，摘要端点不可用" },
      { status: 503 }
    );
  }
  if (request.headers.get("x-cron-secret") !== secret) {
    return NextResponse.json({ error: "无权调用" }, { status: 401 });
  }

  try {
    const users = await prisma.user.findMany({
      where: { reminderEnabled: true, banned: false },
      select: { id: true, email: true, name: true },
    });

    let sent = 0;
    let skipped = 0;
    for (const user of users) {
      if (!user.email) {
        skipped++;
        continue;
      }
      const due = await getDueReviewQuestions(user.id, 5);
      if (due.length === 0) {
        skipped++;
        continue;
      }

      const items = due
        .map(
          (d) =>
            `· ${d.title}（逾期 ${d.daysOverdue} 天，第 ${d.stage + 1} 阶段）`
        )
        .join("\n");

      const ok = await sendMail({
        to: user.email,
        subject: `【面试网】今日待复习：${due.length} 道题到期`,
        text: `你好 ${user.name ?? ""}：\n\n今天有 ${due.length} 道题目到期复习：\n${items}\n\n前往首页「待复习」开始今天的学习：${
          process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
        }/`,
      });
      if (ok) sent++;
      else skipped++;
    }

    return NextResponse.json({ success: true, users: users.length, sent, skipped });
  } catch (error) {
    console.error("POST /api/reminders/digest error:", error);
    return NextResponse.json({ error: "发送摘要失败" }, { status: 500 });
  }
}
