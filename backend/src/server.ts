import http from "http";
import { createApp } from "./app";
import { env } from "./config/env";
import { logger } from "./config/logger";
import { initRealtimeGateway } from "./modules/realtime/realtime.gateway";
import { startQueueConsumer } from "./modules/queue/queue.consumer";
import { prisma } from "./config/prisma";

async function bootstrap() {
  // ── 1. Verify database connection BEFORE accepting traffic ───
  try {
    await prisma.$connect();
    logger.info("✅ Database connected");
  } catch (error) {
    logger.error({ error }, "❌ Database connection failed — cannot start server");
    logger.error(
      "Check that PostgreSQL is running and DATABASE_URL in .env is correct"
    );
    process.exit(1);
  }

  // ── 2. Start optional queue consumer ─────────────────────────
  if (env.queueEnabled && env.rabbitmqUrl) {
    startQueueConsumer().catch((error) => {
      logger.warn({ error }, "Queue consumer failed to start (non-fatal)");
    });
  } else {
    logger.warn("Queue consumer disabled (RabbitMQ not configured)");
  }

  // ── 3. Create HTTP server ─────────────────────────────────────
  const app = createApp();
  const server = http.createServer(app);

  // ── 4. Attach WebSocket gateway ───────────────────────────────
  initRealtimeGateway(server);
  logger.info("WebSocket gateway initialized");

  // ── 5. Start listening ────────────────────────────────────────
  server.listen(env.port, "0.0.0.0", () => {
    logger.info(`🚀 Server running on http://0.0.0.0:${env.port}`);
    logger.info(`   Environment : ${env.nodeEnv}`);
  });

  // ── 6. Graceful shutdown ──────────────────────────────────────
  const shutdown = async (signal: string) => {
    logger.info(`${signal} received — shutting down gracefully`);
    server.close(async () => {
      await prisma.$disconnect();
      logger.info("Server and database connections closed");
      process.exit(0);
    });

    // Force exit after 10 seconds if graceful shutdown hangs
    setTimeout(() => {
      logger.error("Forced shutdown after timeout");
      process.exit(1);
    }, 10_000);
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));

  process.on("unhandledRejection", (reason) => {
    logger.error({ reason }, "Unhandled Promise Rejection");
  });

  process.on("uncaughtException", (error) => {
    logger.error({ error }, "Uncaught Exception — shutting down");
    process.exit(1);
  });
}

bootstrap();
