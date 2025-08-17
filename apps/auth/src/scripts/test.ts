#!/usr/bin/env node

/**
 * Quick test script for Royal Media Auth Service
 * Tests basic functionality without requiring external setup
 * 
 * © Design and Developed by Aninda Sundar Roy
 */

import axios from 'axios';
import { createLogger } from '../utils/common';

const logger = createLogger('test-script');
const BASE_URL = 'http://localhost:3001';

interface TestResult {
  name: string;
  success: boolean;
  error?: string;
  data?: any;
}

class ServiceTester {
  private results: TestResult[] = [];

  async runTests() {
    console.log('🚀 Starting Royal Media Auth Service Tests...\n');

    await this.testHealthCheck();
    await this.testRegistration();
    await this.testLogin();
    await this.testAuthenticatedEndpoint();

    this.printResults();
  }

  private async testHealthCheck() {
    try {
      const response = await axios.get(`${BASE_URL}/health`);
      
      this.results.push({
        name: 'Health Check',
        success: response.status === 200 && response.data.success,
        data: response.data,
      });
    } catch (error: any) {
      this.results.push({
        name: 'Health Check',
        success: false,
        error: error.message,
      });
    }
  }

  private async testRegistration() {
    try {
      const userData = {
        email: `test${Date.now()}@example.com`,
        password: 'TestPassword123!',
        confirmPassword: 'TestPassword123!',
        username: `testuser${Date.now()}`,
        firstName: 'Test',
        lastName: 'User',
        termsAccepted: true,
      };

      const response = await axios.post(`${BASE_URL}/api/auth/register`, userData);
      
      this.results.push({
        name: 'User Registration',
        success: response.status === 201 && response.data.success,
        data: {
          user: response.data.data?.user,
          message: response.data.message,
        },
      });
    } catch (error: any) {
      this.results.push({
        name: 'User Registration',
        success: false,
        error: error.response?.data?.message || error.message,
      });
    }
  }

  private async testLogin() {
    try {
      // First register a user
      const userData = {
        email: `login${Date.now()}@example.com`,
        password: 'LoginPassword123!',
        confirmPassword: 'LoginPassword123!',
        username: `loginuser${Date.now()}`,
        firstName: 'Login',
        lastName: 'User',
        termsAccepted: true,
      };

      await axios.post(`${BASE_URL}/api/auth/register`, userData);

      // Then login
      const loginData = {
        email: userData.email,
        password: userData.password,
      };

      const response = await axios.post(`${BASE_URL}/api/auth/login`, loginData);
      
      this.results.push({
        name: 'User Login',
        success: response.status === 200 && response.data.success && !!response.data.data?.tokens,
        data: {
          hasTokens: !!response.data.data?.tokens,
          user: response.data.data?.user,
        },
      });
    } catch (error: any) {
      this.results.push({
        name: 'User Login',
        success: false,
        error: error.response?.data?.message || error.message,
      });
    }
  }

  private async testAuthenticatedEndpoint() {
    try {
      // First register and login to get a token
      const userData = {
        email: `auth${Date.now()}@example.com`,
        password: 'AuthPassword123!',
        confirmPassword: 'AuthPassword123!',
        username: `authuser${Date.now()}`,
        firstName: 'Auth',
        lastName: 'User',
        termsAccepted: true,
      };

      await axios.post(`${BASE_URL}/api/auth/register`, userData);

      const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
        email: userData.email,
        password: userData.password,
      });

      const token = loginResponse.data.data?.tokens?.accessToken;

      if (!token) {
        throw new Error('No access token received');
      }

      // Test authenticated endpoint
      const response = await axios.get(`${BASE_URL}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      this.results.push({
        name: 'Authenticated Endpoint',
        success: response.status === 200 && response.data.success,
        data: {
          user: response.data.data?.user,
        },
      });
    } catch (error: any) {
      this.results.push({
        name: 'Authenticated Endpoint',
        success: false,
        error: error.response?.data?.message || error.message,
      });
    }
  }

  private printResults() {
    console.log('\n📊 Test Results:');
    console.log('='.repeat(50));

    const passed = this.results.filter(r => r.success).length;
    const total = this.results.length;

    this.results.forEach(result => {
      const status = result.success ? '✅ PASS' : '❌ FAIL';
      console.log(`${status} ${result.name}`);
      
      if (!result.success && result.error) {
        console.log(`   Error: ${result.error}`);
      }
      
      if (result.data && Object.keys(result.data).length > 0) {
        console.log(`   Data: ${JSON.stringify(result.data, null, 2).substring(0, 100)}...`);
      }
      
      console.log('');
    });

    console.log('='.repeat(50));
    console.log(`Summary: ${passed}/${total} tests passed`);
    
    if (passed === total) {
      console.log('🎉 All tests passed! Auth service is working correctly.');
    } else {
      console.log('⚠️  Some tests failed. Check the service configuration.');
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('© Design and Developed by Aninda Sundar Roy');
    console.log('='.repeat(50));
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const tester = new ServiceTester();
  tester.runTests().catch(console.error);
}

export { ServiceTester };