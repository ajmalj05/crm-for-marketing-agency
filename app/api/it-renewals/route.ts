import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { fromMongoDoc } from "@/lib/types";

const RENEWAL_DAYS = 15;
const ALERT_EMAIL = "agencygrowith@gmail.com";

export async function GET() {
  try {
    const from = new Date();
    const to = new Date();
    to.setDate(to.getDate() + RENEWAL_DAYS);

    const db = await getDb();
    const credentials = await db
      .collection("ITCredential")
      .find({
        renewalDate: { $gte: from, $lte: to },
      })
      .sort({ renewalDate: 1 })
      .toArray();

    if (credentials.length === 0) {
      return NextResponse.json({ count: 0, sent: false, message: "No items expiring in the next 15 days." });
    }

    const clientIds = Array.from(new Set(credentials.map((c) => c.clientId)));
    const clientObjectIds = clientIds.map((id) => new ObjectId(id));
    const clientDocs = await db
      .collection("Client")
      .find({ _id: { $in: clientObjectIds } })
      .toArray();
    const clientMap = new Map<string, string>();
    for (const c of clientDocs) {
      const { id, name } = fromMongoDoc(c);
      clientMap.set(id, name);
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (apiKey) {
      const body = credentials
        .map(
          (c) =>
            `- ${clientMap.get(c.clientId) ?? "Unknown"}: ${c.providerName} (${c.platformType}) — ${c.renewalDate.toLocaleDateString()}`
        )
        .join("\n");
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM_EMAIL || "ARM <onboarding@resend.dev>",
          to: [ALERT_EMAIL],
          subject: `[ARM] ${credentials.length} item(s) expiring in ${RENEWAL_DAYS} days`,
          text: `The following domain/hosting credentials are expiring within ${RENEWAL_DAYS} days:\n\n${body}`,
        }),
      });
      if (!res.ok) {
        const err = await res.text();
        return NextResponse.json({
          count: credentials.length,
          sent: false,
          message: `Failed to send email: ${err}`,
        });
      }
      return NextResponse.json({ count: credentials.length, sent: true });
    }

    return NextResponse.json({
      count: credentials.length,
      sent: false,
      message: `Set RESEND_API_KEY (and optionally RESEND_FROM_EMAIL) to send alerts to ${ALERT_EMAIL}. ${credentials.length} item(s) expiring in ${RENEWAL_DAYS} days.`,
    });
  } catch (e) {
    console.error("it-renewals error:", e);
    const isDbError =
      e instanceof Error &&
      (e.message.includes("Authentication") ||
        e.message.includes("ConnectorError") ||
        e.message.includes("SCRAM") ||
        e.message.includes("Connection"));
    if (isDbError) {
      return NextResponse.json({
        count: 0,
        sent: false,
        message:
          "Database unavailable. Check DATABASE_URL and MongoDB credentials (e.g. SCRAM auth).",
      });
    }
    return NextResponse.json(
      { message: e instanceof Error ? e.message : "Server error" },
      { status: 500 }
    );
  }
}
