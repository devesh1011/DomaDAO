import axios, { AxiosInstance } from 'axios';
import { pollLogger as logger } from '../../utils/logger.js';
import { config } from '../../config/index.js';
import {
  DomaPollEvent,
  PollResponse,
  PollParams,
  EventType,
} from '../../types/doma.js';

export class PollConsumer {
  private client: AxiosInstance;
  private lastAcknowledgedId: number = 0;
  private isRunning: boolean = false;
  private pollInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: config.domaApi.baseURL,
      headers: {
        'Api-Key': config.domaApi.apiKey,
        'Content-Type': 'application/json',
      },
      timeout: config.api.timeoutMs,
    });
  }

  /**
   * Start polling for events
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn('Poll consumer is already running');
      return;
    }

    logger.info({
      intervalMs: config.pollApi.intervalMs,
      batchSize: config.pollApi.batchSize,
    }, 'Starting poll consumer');

    this.isRunning = true;
    await this.poll(); // Initial poll

    // Set up recurring poll
    this.pollInterval = setInterval(
      () => this.poll(),
      config.pollApi.intervalMs
    );
  }

  /**
   * Stop polling
   */
  stop(): void {
    logger.info('Stopping poll consumer');
    this.isRunning = false;

    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }

  /**
   * Poll for new events
   */
  private async poll(): Promise<void> {
    if (!this.isRunning) return;

    try {
      const params: PollParams = {
        limit: config.pollApi.batchSize,
        finalizedOnly: true,
      };

      // Add event type filter if configured
      if (config.pollApi.eventTypes) {
        params.eventTypes = config.pollApi.eventTypes
          .split(',')
          .map(t => t.trim()) as EventType[];
      }

      logger.debug({ params }, 'Polling for events');

      const response = await this.client.get<PollResponse>('/v1/poll', {
        params,
      });

      const { events, lastId, hasMoreEvents } = response.data;

      if (events.length === 0) {
        logger.debug('No new events');
        return;
      }

      logger.info({
        eventCount: events.length,
        lastId,
        hasMoreEvents,
      }, 'Received events from poll');

      // Process events
      await this.processEvents(events);

      // Acknowledge events
      await this.acknowledgeEvents(lastId);

      // If there are more events, poll again immediately
      if (hasMoreEvents) {
        logger.debug('More events available, polling again');
        setImmediate(() => this.poll());
      }
    } catch (error) {
      logger.error({ error }, 'Error polling for events');
    }
  }

  /**
   * Process received events
   * Override this method or emit events for external handlers
   */
  private async processEvents(events: DomaPollEvent[]): Promise<void> {
    for (const event of events) {
      try {
        logger.info({
          eventId: event.id,
          type: event.type,
          name: event.name,
          tokenId: event.tokenId,
          uniqueId: event.uniqueId,
        }, 'Processing event');

        // Emit event for external handlers (indexer, webhooks, etc.)
        this.emit('event', event);

        // Type-specific processing
        await this.handleEvent(event);
      } catch (error) {
        logger.error({
          error,
          eventId: event.id,
          uniqueId: event.uniqueId,
        }, 'Error processing event');
      }
    }
  }

  /**
   * Handle individual event based on type
   */
  private async handleEvent(event: DomaPollEvent): Promise<void> {
    switch (event.type) {
      case 'NAME_TOKEN_MINTED':
        logger.debug({ event }, 'Domain NFT minted');
        this.emit('token:minted', event);
        break;

      case 'NAME_TOKEN_TRANSFERRED':
        logger.debug({ event }, 'Domain NFT transferred');
        this.emit('token:transferred', event);
        break;

      case 'NAME_TOKEN_RENEWED':
        logger.debug({ event }, 'Domain renewed');
        this.emit('token:renewed', event);
        break;

      case 'NAME_TOKEN_BURNED':
        logger.debug({ event }, 'Domain NFT burned');
        this.emit('token:burned', event);
        break;

      case 'LOCK_STATUS_CHANGED':
        logger.debug({ event }, 'Transfer lock status changed');
        this.emit('token:lock_changed', event);
        break;

      case 'METADATA_UPDATED':
        logger.debug({ event }, 'Token metadata updated');
        this.emit('token:metadata_updated', event);
        break;

      default:
        logger.warn({ eventType: event.type }, 'Unknown event type');
    }
  }

  /**
   * Acknowledge processed events
   */
  private async acknowledgeEvents(lastEventId: number): Promise<void> {
    try {
      await this.client.post(`/v1/poll/ack/${lastEventId}`);
      this.lastAcknowledgedId = lastEventId;
      logger.debug({ lastEventId }, 'Acknowledged events');
    } catch (error) {
      logger.error({ error, lastEventId }, 'Error acknowledging events');
      throw error;
    }
  }

  /**
   * Reset poll cursor to a specific event ID
   * Useful for reprocessing events
   */
  async reset(eventId: number = 0): Promise<void> {
    try {
      await this.client.post(`/v1/poll/reset/${eventId}`);
      this.lastAcknowledgedId = eventId;
      logger.info({ eventId }, 'Reset poll cursor');
    } catch (error) {
      logger.error({ error, eventId }, 'Error resetting poll cursor');
      throw error;
    }
  }

  /**
   * Get last acknowledged event ID
   */
  getLastAcknowledgedId(): number {
    return this.lastAcknowledgedId;
  }

  /**
   * Check if consumer is running
   */
  isConsumerRunning(): boolean {
    return this.isRunning;
  }

  // Simple event emitter for external handlers
  private listeners: Map<string, Array<(event: any) => void>> = new Map();

  on(eventName: string, listener: (event: any) => void): void {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, []);
    }
    this.listeners.get(eventName)!.push(listener);
  }

  private emit(eventName: string, data: any): void {
    const listeners = this.listeners.get(eventName);
    if (listeners) {
      listeners.forEach(listener => listener(data));
    }
  }
}

export const pollConsumer = new PollConsumer();
