import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import { createApp } from '../src/api/index';

describe('API Routes', () => {
  let app: any;

  beforeAll(() => {
    app = createApp();
  });

  describe('Health Check', () => {
    it('GET /health should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('services');
    });

    it('GET /status should return detailed status', async () => {
      const response = await request(app)
        .get('/status')
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('success');
    });
  });

  describe('Pools API', () => {
    it('GET /api/pools should return pools list', async () => {
      const response = await request(app)
        .get('/api/pools')
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('GET /api/pools/:address should return 404 for non-existent pool', async () => {
      await request(app)
        .get('/api/pools/0xinvalid')
        .expect(404);
    });
  });

  describe('Domains API', () => {
    it('GET /api/domains/:name should fetch domain details', async () => {
      const response = await request(app)
        .get('/api/domains/test.eth')
        .expect('Content-Type', /json/);

      // May return 404 if domain doesn't exist, which is valid
      expect([200, 404]).toContain(response.status);
    });

    it('GET /api/domains/search should require query parameter', async () => {
      await request(app)
        .get('/api/domains/search')
        .expect(400);
    });
  });
});
