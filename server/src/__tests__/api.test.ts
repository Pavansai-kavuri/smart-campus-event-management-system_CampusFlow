import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { connectDatabase, disconnectDatabase } from '../config/database.js';
import { runSeed } from '../utils/seed.js';

const app = createApp();

describe('CampusFlow Full-Stack API & MongoDB Integration Suite', () => {
  let studentToken = '';
  let organizerToken = '';
  let adminToken = '';

  beforeAll(async () => {
    await connectDatabase();
    await runSeed();

    const studentRes = await request(app)
      .post('/api/auth/demo-login')
      .send({ role: 'STUDENT' });
    studentToken = studentRes.body.token;

    const orgRes = await request(app)
      .post('/api/auth/demo-login')
      .send({ role: 'ORGANIZER' });
    organizerToken = orgRes.body.token;

    const adminRes = await request(app)
      .post('/api/auth/demo-login')
      .send({ role: 'ADMIN' });
    adminToken = adminRes.body.token;
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  it('verifies local MongoDB connection health endpoint', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.database.connected).toBe(true);
    expect(res.body.database.dbName).toBe('campusflow');
  });

  it('returns real student dashboard statistics and trending events for Pavan', async () => {
    const res = await request(app)
      .get('/api/dashboard/student')
      .set('Authorization', `Bearer ${studentToken}`);
    expect(res.status).toBe(200);
    expect(res.body.stats.upcomingEvents).toBeGreaterThanOrEqual(4);
    expect(res.body.stats.myRegistrations).toBeGreaterThanOrEqual(2);
    expect(res.body.stats.certificates).toBeGreaterThanOrEqual(2);
    expect(res.body.trendingEvents.length).toBeGreaterThan(0);
  });

  it('enforces role permissions on Admin dashboard endpoint', async () => {
    const forbidden = await request(app)
      .get('/api/dashboard/admin')
      .set('Authorization', `Bearer ${studentToken}`);
    expect(forbidden.status).toBe(403);

    const allowed = await request(app)
      .get('/api/dashboard/admin')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(allowed.status).toBe(200);
    expect(allowed.body.stats.totalEvents).toBeGreaterThanOrEqual(6);
  });

  it('rejects duplicate event registrations with 409 Conflict', async () => {
    const eventsRes = await request(app).get('/api/events?search=TECHFEST');
    const techfest = eventsRes.body.events[0];
    expect(techfest).toBeDefined();

    const dupRes = await request(app)
      .post('/api/registrations')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ eventId: techfest._id });
    expect(dupRes.status).toBe(409);
  });

  it('validates QR attendance pass idempotently and handles duplicate scans safely', async () => {
    const firstScan = await request(app)
      .post('/api/attendance/scan')
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({ qrToken: 'CFPASS-PEER01-TECHFEST2026' });
    expect(firstScan.status).toBe(200);
    expect(firstScan.body.success).toBe(true);

    const duplicateScan = await request(app)
      .post('/api/attendance/scan')
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({ qrToken: 'CFPASS-PEER01-TECHFEST2026' });
    expect(duplicateScan.status).toBe(200);
    expect(duplicateScan.body.alreadyScanned).toBe(true);
  });

  it('verifies issued digital certificates via public endpoint', async () => {
    const res = await request(app).get('/api/certificates/verify/CF2026TEF12345');
    expect(res.status).toBe(200);
    expect(res.body.verified).toBe(true);
    expect(res.body.certificate.participantName).toBe('Pavan Sai Ram Likhith');
  });
});
