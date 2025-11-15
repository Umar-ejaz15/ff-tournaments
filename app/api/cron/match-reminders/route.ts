/**
 * Cron Job API Route for Match Reminders
 * 
 * This endpoint should be called by a cron service (e.g., Vercel Cron, cron-job.org)
 * every 5-10 minutes to check for upcoming matches and send reminders
 * 
 * Setup:
 * 1. Add to vercel.json for Vercel Cron
 * 2. Or use external service like cron-job.org to call this endpoint
 */

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendWhatsAppMessage, formatPhoneNumber } from "@/lib/whatsapp-bot";
import webpush from "web-push";

// Configure web-push
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || "";
const vapidEmail = process.env.VAPID_EMAIL || "mailto:admin@ff-tournaments.com";

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidEmail, vapidPublicKey, vapidPrivateKey);
}

// Secret key to protect this endpoint (set in environment variables)
const CRON_SECRET = process.env.CRON_SECRET || "your-secret-key-change-this";

export async function GET(req: Request) {
  try {
    // Verify cron secret
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const thirtyMinutesFromNow = new Date(now.getTime() + 30 * 60 * 1000);

    // Find tournaments starting in the next 30 minutes
    const upcomingTournaments = await prisma.tournament.findMany({
      where: {
        startTime: {
          gte: now,
          lte: thirtyMinutesFromNow,
        },
        status: {
          in: ["upcoming", "live"],
        },
        isOpen: true,
      },
      include: {
        teams: {
          include: {
            members: {
              include: {
                user: true,
              },
            },
            captain: true,
          },
        },
      },
    });

    let remindersSent = 0;
    let errors = [];

    for (const tournament of upcomingTournaments) {
      const startTime = tournament.startTime ? new Date(tournament.startTime) : null;
      if (!startTime) continue;

      const timeUntilStart = startTime.getTime() - now.getTime();
      const minutesUntilStart = Math.floor(timeUntilStart / (60 * 1000));

      // Only send if between 25-35 minutes (to avoid duplicate sends)
      if (minutesUntilStart < 25 || minutesUntilStart > 35) continue;

      // Collect all unique phone numbers from team members
      const phoneNumbers = new Set<string>();

      for (const team of tournament.teams) {
        // Add captain's phone if available
        if (team.captain.phone) {
          phoneNumbers.add(formatPhoneNumber(team.captain.phone));
        }

        // Add team members' phones
        for (const member of team.members) {
          if (member.phone) {
            phoneNumbers.add(formatPhoneNumber(member.phone));
          }
          // Also check if user has phone in their profile
          if (member.user?.phone) {
            phoneNumbers.add(formatPhoneNumber(member.user.phone));
          }
        }
      }

      // Send WhatsApp reminders
      const message = `🎮 FF Tournaments Reminder\n\nTournament: ${tournament.title}\nMode: ${tournament.mode}\nGame Type: ${tournament.gameType}\nStarts in: ${minutesUntilStart} minutes\n\n${tournament.lobbyCode ? `Lobby Code: ${tournament.lobbyCode}\n\n` : ""}Get ready to compete! Good luck! 🏆`;

      for (const phone of phoneNumbers) {
        try {
          const sent = await sendWhatsAppMessage({
            to: phone,
            message: message,
          });

          if (sent) {
            remindersSent++;
          }
        } catch (error) {
          console.error(`Failed to send WhatsApp to ${phone}:`, error);
          errors.push(`Failed to send to ${phone}`);
        }
      }

      // Also send push notifications to users who have subscribed
      // This would require storing push subscriptions in the database
      // For now, we'll create in-app notifications
      for (const team of tournament.teams) {
        // Create notification for captain
        await prisma.notification.create({
          data: {
            userId: team.captainId,
            type: "reminder",
            message: `Tournament "${tournament.title}" starts in ${minutesUntilStart} minutes!${tournament.lobbyCode ? ` Lobby Code: ${tournament.lobbyCode}` : ""}`,
            metadata: {
              tournamentId: tournament.id,
              minutesUntilStart,
            },
          },
        });

        // Create notifications for team members
        for (const member of team.members) {
          if (member.userId) {
            await prisma.notification.create({
              data: {
                userId: member.userId,
                type: "reminder",
                message: `Tournament "${tournament.title}" starts in ${minutesUntilStart} minutes!${tournament.lobbyCode ? ` Lobby Code: ${tournament.lobbyCode}` : ""}`,
                metadata: {
                  tournamentId: tournament.id,
                  minutesUntilStart,
                },
              },
            });
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      tournamentsChecked: upcomingTournaments.length,
      remindersSent,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    console.error("Match reminder cron error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

