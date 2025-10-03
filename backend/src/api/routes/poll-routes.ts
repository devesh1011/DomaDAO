import { Router, Request, Response } from "express";
import { pool } from "../../db/connection.js";
import { PollEventRepository } from "../../db/repositories/poll-events.js";
import { pollConsumer } from "../../services/poll-consumer/consumer.js";
import { logger } from "../../utils/logger.js";

const router = Router();
const eventRepository = new PollEventRepository(pool);

/**
 * GET /api/poll/events
 * Get poll events with optional filters
 */
router.get("/events", async (req: Request, res: Response) => {
  try {
    const {
      event_type,
      name,
      token_id,
      processing_status,
      from_event_id,
      to_event_id,
      limit = "100",
      offset = "0",
    } = req.query;

    const events = await eventRepository.find({
      event_type: event_type as string,
      name: name as string,
      token_id: token_id as string,
      processing_status: processing_status as string,
      from_event_id: from_event_id
        ? parseInt(from_event_id as string)
        : undefined,
      to_event_id: to_event_id ? parseInt(to_event_id as string) : undefined,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    });

    res.json({
      success: true,
      data: events,
      count: events.length,
    });
  } catch (error) {
    logger.error({ error }, "Error fetching poll events");
    res.status(500).json({
      success: false,
      error: "Failed to fetch poll events",
    });
  }
});

/**
 * GET /api/poll/events/:uniqueId
 * Get a specific event by unique ID
 */
router.get(
  "/events/:uniqueId",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { uniqueId } = req.params;

      const query = "SELECT * FROM poll_events WHERE unique_id = $1";
      const result = await pool.query(query, [uniqueId]);

      if (result.rows.length === 0) {
        res.status(404).json({
          success: false,
          error: "Event not found",
        });
        return;
      }

      res.json({
        success: true,
        data: result.rows[0],
      });
    } catch (error) {
      logger.error({ error }, "Error fetching poll event");
      res.status(500).json({
        success: false,
        error: "Failed to fetch poll event",
      });
    }
  }
);

/**
 * GET /api/poll/stats
 * Get poll event statistics
 */
router.get("/stats", async (_req: Request, res: Response) => {
  try {
    const stats = await pollConsumer.getStats();

    res.json({
      success: true,
      data: {
        ...stats,
        lastAcknowledgedId: pollConsumer.getLastAcknowledgedId(),
        isRunning: pollConsumer.isConsumerRunning(),
      },
    });
  } catch (error) {
    logger.error({ error }, "Error fetching poll stats");
    res.status(500).json({
      success: false,
      error: "Failed to fetch poll stats",
    });
  }
});

/**
 * GET /api/poll/events/by-name/:name
 * Get all events for a specific domain name
 */
router.get("/events/by-name/:name", async (req: Request, res: Response) => {
  try {
    const { name } = req.params;
    const { limit = "100" } = req.query;

    const events = await eventRepository.find({
      name,
      limit: parseInt(limit as string),
    });

    res.json({
      success: true,
      data: events,
      count: events.length,
    });
  } catch (error) {
    logger.error({ error }, "Error fetching events by name");
    res.status(500).json({
      success: false,
      error: "Failed to fetch events by name",
    });
  }
});

/**
 * GET /api/poll/events/by-token/:tokenId
 * Get all events for a specific token ID
 */
router.get("/events/by-token/:tokenId", async (req: Request, res: Response) => {
  try {
    const { tokenId } = req.params;
    const { limit = "100" } = req.query;

    const events = await eventRepository.find({
      token_id: tokenId,
      limit: parseInt(limit as string),
    });

    res.json({
      success: true,
      data: events,
      count: events.length,
    });
  } catch (error) {
    logger.error({ error }, "Error fetching events by token");
    res.status(500).json({
      success: false,
      error: "Failed to fetch events by token",
    });
  }
});

/**
 * POST /api/poll/reset
 * Reset poll cursor (admin only)
 */
router.post("/reset", async (req: Request, res: Response) => {
  try {
    const { eventId = 0 } = req.body;

    await pollConsumer.reset(eventId);

    res.json({
      success: true,
      message: `Poll cursor reset to event ID ${eventId}`,
      data: {
        resetToEventId: eventId,
      },
    });
  } catch (error) {
    logger.error({ error }, "Error resetting poll cursor");
    res.status(500).json({
      success: false,
      error: "Failed to reset poll cursor",
    });
  }
});

/**
 * GET /api/poll/health
 * Health check for poll consumer
 */
router.get("/health", async (_req: Request, res: Response) => {
  try {
    const isRunning = pollConsumer.isConsumerRunning();
    const lastAcknowledgedId = pollConsumer.getLastAcknowledgedId();

    res.json({
      success: true,
      data: {
        status: isRunning ? "running" : "stopped",
        lastAcknowledgedId,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error({ error }, "Error checking poll health");
    res.status(500).json({
      success: false,
      error: "Failed to check poll health",
    });
  }
});

export default router;
