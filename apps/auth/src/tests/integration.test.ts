import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { createLogger } from '../utils/common';
import app from '../server';
import { User } from '../models/User';

const logger = createLogger('auth-test');

// Test database setup
const TEST_DB_URI = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/royal-media-auth-test';

describe('Auth Service Integration Tests', () => {
  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(TEST_DB_URI);
    logger.info('Connected to test database');
  });

  afterAll(async () => {
    // Clean up and disconnect
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    logger.info('Test database cleaned and disconnected');
  });

  beforeEach(async () => {
    // Clear all collections before each test
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  });

  describe('Health Check', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Auth service is healthy',
        service: 'auth-service',
      });
    });
  });

  describe('User Registration', () => {
    const validUserData = {
      email: 'test@example.com',
      password: 'TestPassword123!',
      confirmPassword: 'TestPassword123!',
      username: 'testuser',
      firstName: 'Test',
      lastName: 'User',
      termsAccepted: true,
    };

    it('should register a new user successfully', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(validUserData)
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        message: expect.stringContaining('registered successfully'),
      });

      // Verify user was created in database
      const user = await User.findOne({ email: validUserData.email });
      expect(user).toBeTruthy();
      expect(user?.email).toBe(validUserData.email);
      expect(user?.username).toBe(validUserData.username);
    });

    it('should reject registration with invalid email', async () => {
      const invalidData = { ...validUserData, email: 'invalid-email' };
      
      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidData)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        code: 'VALIDATION_ERROR',
      });
    });

    it('should reject registration with weak password', async () => {
      const invalidData = { ...validUserData, password: '123', confirmPassword: '123' };
      
      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidData)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        code: 'VALIDATION_ERROR',
      });
    });

    it('should reject registration with mismatched passwords', async () => {
      const invalidData = { ...validUserData, confirmPassword: 'DifferentPassword123!' };
      
      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidData)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        code: 'VALIDATION_ERROR',
      });
    });

    it('should reject duplicate email registration', async () => {
      // Register first user
      await request(app)
        .post('/api/auth/register')
        .send(validUserData)
        .expect(201);

      // Try to register with same email
      const duplicateData = { ...validUserData, username: 'differentusername' };
      
      const response = await request(app)
        .post('/api/auth/register')
        .send(duplicateData)
        .expect(409);

      expect(response.body).toMatchObject({
        success: false,
        code: 'EMAIL_EXISTS',
      });
    });
  });

  describe('User Login', () => {
    const userData = {
      email: 'login@example.com',
      password: 'LoginPassword123!',
      confirmPassword: 'LoginPassword123!',
      username: 'loginuser',
      firstName: 'Login',
      lastName: 'User',
      termsAccepted: true,
    };

    beforeEach(async () => {
      // Register a user for login tests
      await request(app)
        .post('/api/auth/register')
        .send(userData);
    });

    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: userData.password,
        })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: expect.stringContaining('Login successful'),
        data: {
          user: {
            email: userData.email,
            username: userData.username,
          },
          tokens: {
            accessToken: expect.any(String),
            refreshToken: expect.any(String),
          },
        },
      });
    });

    it('should reject login with invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: userData.password,
        })
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        code: 'INVALID_CREDENTIALS',
      });
    });

    it('should reject login with invalid password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: 'WrongPassword123!',
        })
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        code: 'INVALID_CREDENTIALS',
      });
    });
  });

  describe('Rate Limiting', () => {
    it('should apply rate limiting to login attempts', async () => {
      const invalidCredentials = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      // Make multiple rapid requests
      const requests = Array(6).fill(null).map(() =>
        request(app)
          .post('/api/auth/login')
          .send(invalidCredentials)
      );

      const responses = await Promise.all(requests);
      
      // Some requests should be rate limited
      const rateLimitedResponses = responses.filter(res => res.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });

  describe('Middleware Security', () => {
    it('should include security headers', async () => {
      const response = await request(app)
        .get('/api')
        .expect(200);

      // Check for security headers
      expect(response.headers).toMatchObject({
        'x-content-type-options': 'nosniff',
        'x-frame-options': 'DENY',
        'x-xss-protection': '0',
      });
    });

    it('should sanitize input', async () => {
      const maliciousInput = {
        email: 'test@example.com<script>alert("xss")</script>',
        password: 'Password123!',
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(maliciousInput);

      // Should not contain script tags in any response
      const responseString = JSON.stringify(response.body);
      expect(responseString).not.toContain('<script>');
      expect(responseString).not.toContain('alert(');
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 errors gracefully', async () => {
      const response = await request(app)
        .get('/api/nonexistent')
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        code: 'ROUTE_NOT_FOUND',
        message: 'Route not found',
      });
    });

    it('should handle validation errors gracefully', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({}) // Empty body
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        code: 'VALIDATION_ERROR',
        errors: expect.any(Array),
      });
    });
  });
});