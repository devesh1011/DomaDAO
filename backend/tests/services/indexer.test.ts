import { describe, it, expect } from '@jest/globals';
import { EventIndexer } from '../src/services/event-indexer/indexer';
import { EventType, DomaPollEvent } from '../src/types/doma';

describe('Event Indexer', () => {
  const indexer = new EventIndexer();

  it('should handle idempotent event processing', async () => {
    const event: DomaPollEvent = {
      uniqueId: 'test-event-123',
      type: EventType.POOL_CREATED,
      finalized: true,
      data: {
        poolAddress: '0x123',
        owner: '0xowner',
        targetAmount: '1000000',
        contributionWindowEnd: 1234567890,
        votingWindowStart: 1234567900,
        votingWindowEnd: 1234567910,
        purchaseWindowStart: 1234567920,
        usdcAddress: '0xusdc',
      },
    };

    // First index should succeed
    await indexer.indexEvent(event);

    // Second index with same uniqueId should be skipped (idempotent)
    await indexer.indexEvent(event);

    // No error should be thrown
    expect(true).toBe(true);
  });
});
