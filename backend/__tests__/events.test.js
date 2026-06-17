const request = require('supertest');
const app = require('../app');

describe('Events API Endpoints', () => {
  let createdEventId;
  let testSubmissionId;

  describe('GET /api/events', () => {
    it('should return a list of published events', async () => {
      const response = await request(app).get('/api/events');
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/events/:id', () => {
    it('should return a single event by ID', async () => {
      const response = await request(app).get('/api/events/e1');
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe('e1');
      expect(response.body.data.title).toBe('Global Hack 2026');
    });

    it('should return 404 for an invalid event ID', async () => {
      const response = await request(app).get('/api/events/invalid_id');
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Event not found');
    });
  });

  describe('POST /api/events', () => {
    it('should create a new event successfully', async () => {
      const newEvent = {
        title: 'Jest Testing Workshop',
        category: 'Workshops',
        date: '2026-11-20T10:00:00Z',
        location: 'Virtual',
        mode: 'Online',
        maxCapacity: 100,
        status: 'Published'
      };

      const response = await request(app)
        .post('/api/events')
        .send(newEvent);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Event Published!');
      expect(response.body.data.id).toBeDefined();
      createdEventId = response.body.data.id;
    });
  });

  describe('POST /api/events/:id/advance', () => {
    it('should advance the event round index', async () => {
      const response = await request(app).post(`/api/events/e1/advance`);
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Advanced to');
    });

    it('should return 404 when advancing a non-existent event', async () => {
      const response = await request(app).post(`/api/events/invalid_id/advance`);
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/events/:eventId/register', () => {
    it('should register a user for the event successfully', async () => {
      const regPayload = {
        userId: 'user_test',
        customAnswers: {
          'T-Shirt size': 'L'
        },
        autoFilledProfile: {
          name: 'Test Student',
          institution: 'University of Code',
          department: 'Computer Science',
          academicYear: 'Third Year',
          skills: ['Javascript', 'Jest'],
          resumeUrl: 'https://example.com/resume.pdf',
          links: {}
        }
      };

      const response = await request(app)
        .post('/api/events/e1/register')
        .send(regPayload);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Registration Successful');
      expect(response.body.data.id).toBeDefined();
      expect(response.body.data.status).toBe('Approved');
    });
  });

  describe('POST /api/events/:id/submit-project', () => {
    it('should submit a project successfully', async () => {
      const projectPayload = {
        userId: 'user_test',
        links: [
          { type: 'GitHub', url: 'https://github.com/test/project' }
        ],
        isFinalLock: true
      };

      const response = await request(app)
        .post('/api/events/e1/submit-project')
        .send(projectPayload);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Project Locked and Submitted');
      expect(response.body.data.id).toBeDefined();
      testSubmissionId = response.body.data.id;
    });
  });

  describe('GET /api/events/:id/submissions', () => {
    it('should retrieve submissions for the event', async () => {
      const response = await request(app).get('/api/events/e1/submissions');
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('POST /api/events/:id/submissions/:submissionId/evaluate', () => {
    it('should evaluate and shortlist a submission', async () => {
      const evalPayload = {
        rubricScores: {
          codeQuality: 9,
          completeness: 8
        },
        feedback: 'Great job, code matches guidelines.',
        isShortlisted: true
      };

      const response = await request(app)
        .post(`/api/events/e1/submissions/${testSubmissionId}/evaluate`)
        .send(evalPayload);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Evaluation Saved Successfully');
      expect(response.body.data.status).toBe('Shortlisted');
    });
  });
});
