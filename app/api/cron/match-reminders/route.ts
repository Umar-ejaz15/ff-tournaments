/**
 * Match Reminders API Route
 * 
 * VERCEL HOBBY PLAN: Cron jobs are not available (Pro plan feature)
 * 
 * To use this endpoint, set up an external cron service (free):
 * 1. cron-job.org (free tier - can run every 10-30 minutes)
 * 2. EasyCron (free tier available)
 * 3. UptimeRobot (free tier available)
 * 
 * Setup:
 * - URL: https://your-app.vercel.app/api/cron/match-reminders
 * - Method: GET
 * - Headers: Authorization: Bearer YOUR_CRON_SECRET
 * - Schedule: Every 10-30 minutes (depending on service limits)
 * 
 * Or call manually via:
 * curl -X GET https://your-app.vercel.app/api/cron/match-reminders \
 *   -H "Authorization: Bearer YOUR_CRON_SECRET"
 */

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

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
    const twentyFourHoursFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const thirtyMinutesFromNow = new Date(now.getTime() + 30 * 60 * 1000);

    // Find tournaments starting in the next 24 hours (for daily cron job)
    // We check a wider window since this only runs once per day on Hobby plan
    const upcomingTournaments = await prisma.tournament.findMany({
      where: {
        startTime: {
          gte: now,
          lte: twentyFourHoursFromNow,
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
    let errors: string[] = [];

    for (const tournament of upcomingTournaments) {
      const startTime = tournament.startTime ? new Date(tournament.startTime) : null;
      if (!startTime) continue;

      const timeUntilStart = startTime.getTime() - now.getTime();
      const minutesUntilStart = Math.floor(timeUntilStart / (60 * 1000));
      const hoursUntilStart = Math.floor(minutesUntilStart / 60);

      // Since this runs once per day, send reminders for tournaments:
      // - Starting in the next 24 hours (for advance notice)
      // - Or starting within the next 30 minutes (immediate reminder)
      // This ensures users get reminders even with daily cron limit
      if (minutesUntilStart < 0 || minutesUntilStart > 24 * 60) continue;
      
      // Format message based on time until start
      let timeMessage = "";
      if (minutesUntilStart < 60) {
        timeMessage = `${minutesUntilStart} minute${minutesUntilStart !== 1 ? 's' : ''}`;
      } else if (hoursUntilStart < 24) {
        const remainingMinutes = minutesUntilStart % 60;
        timeMessage = `${hoursUntilStart} hour${hoursUntilStart !== 1 ? 's' : ''}${remainingMinutes > 0 ? ` and ${remainingMinutes} minute${remainingMinutes !== 1 ? 's' : ''}` : ''}`;
      } else {
        continue; // Skip if more than 24 hours
      }

      const notificationMessage = `Tournament "${tournament.title}" starts in ${timeMessage}!${tournament.lobbyCode ? ` Lobby Code: ${tournament.lobbyCode}` : ""}`;
      const notificationUrl = `/user/tournaments/${tournament.id}`;

      // Collect all user IDs who need notifications
      const userIds = new Set<string>();
      
      for (const team of tournament.teams) {
        userIds.add(team.captainId);
        for (const member of team.members) {
          if (member.userId) {
            userIds.add(member.userId);
          }
        }
      }

      // Create in-app notifications
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
                hoursUntilStart,
              },
            },
          });
          remindersSent++;
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
        remindersSent: 0
      },
      { status: 200 } // Return 200 to prevent cron failure notifications
    );
  }
}

