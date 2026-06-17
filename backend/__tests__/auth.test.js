const request = require('supertest');
const app = require('../app');

describe('Auth API Endpoints', () => {
  describe('POST /api/auth/login', () => {
    it('should login successfully with valid email and password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.token).toBe('mock-jwt-token-123');
      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe('test@example.com');
    });

    it('should return 400 if email is missing', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          password: 'password123'
        });
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Email and password required');
    });

    it('should return 400 if password is missing', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com'
        });
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Email and password required');
    });
  });
});
