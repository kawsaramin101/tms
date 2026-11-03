import app from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./lib/logger.js";
import { runReminderScan } from "./modules/notifications/notification.service.js";

app.listen(env.port, () => {
  logger.info(`Server running at http://localhost:${env.port}`);
  // Run once at startup and then every 24 hours. Database uniqueness prevents duplicates.
  void runReminderScan().catch((error) => logger.error("Initial notification scan failed", error));
  setInterval(() => {
    void runReminderScan().catch((error) => logger.error("Scheduled notification scan failed", error));
  }, 24 * 60 * 60 * 1000).unref();
});
