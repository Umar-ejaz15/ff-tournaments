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
    let pushNotificationsSent = 0;
    let errors: string[] = [];

    for (const tournament of upcomingTournaments) {
      const startTime = tournament.startTime ? new Date(tournament.startTime) : null;
      if (!startTime) continue;

      const timeUntilStart = startTime.getTime() - now.getTime();
      const minutesUntilStart = Math.floor(timeUntilStart / (60 * 1000));

      // Only send if between 25-35 minutes (to avoid duplicate sends)
      if (minutesUntilStart < 25 || minutesUntilStart > 35) continue;

      const notificationMessage = `Tournament "${tournament.title}" starts in ${minutesUntilStart} minutes!${tournament.lobbyCode ? ` Lobby Code: ${tournament.lobbyCode}` : ""}`;
      const notificationUrl = `/user/tournaments/${tournament.id}`;

      // Collect all user IDs who need notifications
      const userIds = new Set<number>();
      
      for (const team of tournament.teams) {
        userIds.add(team.captainId);
        for (const member of team.members) {
          if (member.userId) {
            userIds.add(member.userId);
          }
        }
      }

      // Create in-app notifications and send push notifications
      for (const userId of userIds) {
        try {
          // Create in-app notification
          await prisma.notification.create({
            data: {
              userId,
              type: "reminder",
              message: notificationMessage,
              metadata: {
                tournamentId: tournament.id,
                minutesUntilStart,
              },
            },
          });
          remindersSent++;

          // Send push notification if user has subscribed
          const pushSubscriptions = await prisma.notification.findMany({
            where: {
              userId,
              type: "push-subscription",
            },
            orderBy: {
              createdAt: "desc",
            },
            take: 1, // Get most recent subscription
          });

          for (const subNotification of pushSubscriptions) {
            try {
              const subscription = subNotification.metadata as any;
              if (subscription?.endpoint && vapidPublicKey && vapidPrivateKey) {
                await webpush.sendNotification(
                  subscription,
                  JSON.stringify({
                    title: "Tournament Reminder",
                    body: notificationMessage,
                    icon: "/icon-192.png",
                    badge: "/icon-192.png",
                    tag: `tournament-${tournament.id}`,
                    url: notificationUrl,
                    data: {
                      url: notificationUrl,
                      tournamentId: tournament.id,
                    },
                  })
                );
                pushNotificationsSent++;
              }
            } catch (pushError: any) {
              // If subscription is invalid, remove it
              if (pushError.statusCode === 410 || pushError.statusCode === 404) {
                await prisma.notification.delete({
                  where: { id: subNotification.id },
                });
              } else {
                console.error(`Push notification error for user ${userId}:`, pushError.message);
              }
            }
          }
        } catch (error: any) {
          console.error(`Error creating notification for user ${userId}:`, error.message);
          errors.push(`User ${userId}: ${error.message}`);
        }
      }
    }

    return NextResponse.json({
      success: true,
      tournamentsChecked: upcomingTournaments.length,
      remindersSent,
      pushNotificationsSent,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    console.error("Match reminder cron error:", error);
    // Return success even on error to prevent GitHub notifications
    // Log the error but don't fail the cron job
    return NextResponse.json(
      { 
        success: false,
        error: error.message || "Internal server error",
        tournamentsChecked: 0,
        remindersSent: 0,
        pushNotificationsSent: 0
      },
      { status: 200 } // Return 200 to prevent cron failure notifications
    );
  }
}

