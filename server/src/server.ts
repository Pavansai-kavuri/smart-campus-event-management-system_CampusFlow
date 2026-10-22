import dotenv from 'dotenv';
import { createApp } from './app.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { runAutomatedEventReminders } from './services/reminderService.js';
import { ensureSeedDataIfEmpty } from './utils/seed.js';

dotenv.config();

const PORT = Number(process.env.PORT || 5001);

async function startServer() {
  try {
    await connectDatabase();
    // Safe non-destructive seed if the campusflow database has no users yet
    await ensureSeedDataIfEmpty();

    const app = createApp();
    const server = app.listen(PORT, () => {
      console.log(`[CampusFlow Server] Listening on http://localhost:${PORT}`);
    });

    // Background reminder job every 15 minutes
    const reminderInterval = setInterval(() => {
      runAutomatedEventReminders().catch((err) =>
        console.error('[CampusFlow Reminder Job Error]:', err)
      );
    }, 15 * 60 * 1000);

    const shutdown = async (signal: string) => {
      console.log(`\n[CampusFlow Server] Received ${signal}. Shutting down gracefully...`);
      clearInterval(reminderInterval);
      server.close(async () => {
        await disconnectDatabase();
        process.exit(0);
      });
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  } catch (err) {
    console.error('[CampusFlow Server] Failed to start:', err);
    process.exit(1);
  }
}

startServer();
