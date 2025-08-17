#!/usr/bin/env node

/**
 * Development setup script for Royal Media Auth Service
 * Creates initial admin user and sample data
 * 
 * © Design and Developed by Aninda Sundar Roy
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { config } from 'dotenv';
import { createLogger } from '../utils/common';
import { User } from '../models/User';

// Load environment variables
config();

const logger = createLogger('setup-script');

const ADMIN_USER = {
  email: process.env.ADMIN_EMAIL || 'admin@royal-media.com',
  password: process.env.ADMIN_PASSWORD || 'AdminPassword123!',
  username: 'admin',
  handle: 'admin',
  firstName: 'Admin',
  lastName: 'User',
  role: 'super_admin',
  isVerified: true,
  isActive: true,
};

const SAMPLE_USERS = [
  {
    email: 'moderator@royal-media.com',
    password: 'ModeratorPass123!',
    username: 'moderator',
    handle: 'moderator',
    firstName: 'Moderator',
    lastName: 'User',
    role: 'moderator',
    isVerified: true,
    isActive: true,
  },
  {
    email: 'user@royal-media.com',
    password: 'UserPassword123!',
    username: 'testuser',
    handle: 'testuser',
    firstName: 'Test',
    lastName: 'User',
    role: 'user',
    isVerified: true,
    isActive: true,
  },
  {
    email: 'premium@royal-media.com',
    password: 'PremiumPass123!',
    username: 'premiumuser',
    handle: 'premiumuser',
    firstName: 'Premium',
    lastName: 'User',
    role: 'premium',
    isVerified: true,
    isActive: true,
  },
];

async function createUser(userData: any) {
  try {
    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [
        { email: userData.email },
        { username: userData.username }
      ]
    });

    if (existingUser) {
      logger.info(`User already exists: ${userData.email}`);
      return existingUser;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, 12);

    // Create user
    const user = new User({
      ...userData,
      password: hashedPassword,
    });

    await user.save();
    logger.info(`Created user: ${userData.email} (${userData.role})`);
    return user;

  } catch (error) {
    logger.error(`Failed to create user ${userData.email}:`, error);
    throw error;
  }
}

async function setupDatabase() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/royal-media-auth';
    await mongoose.connect(mongoUri);
    logger.info('Connected to MongoDB');

    // Create admin user
    logger.info('Creating admin user...');
    await createUser(ADMIN_USER);

    // Create sample users if in development
    if (process.env.NODE_ENV === 'development' && process.env.DEV_SEED_DATA === 'true') {
      logger.info('Creating sample users...');
      for (const userData of SAMPLE_USERS) {
        await createUser(userData);
      }
    }

    logger.info('Database setup completed successfully!');

    // Display login credentials
    console.log('\n' + '='.repeat(50));
    console.log('🚀 ROYAL MEDIA AUTH SERVICE SETUP COMPLETE');
    console.log('='.repeat(50));
    console.log('\n📋 Login Credentials:');
    console.log(`Admin: ${ADMIN_USER.email} / ${ADMIN_USER.password}`);
    
    if (process.env.NODE_ENV === 'development') {
      console.log('\n🧪 Development Users:');
      SAMPLE_USERS.forEach(user => {
        console.log(`${user.role}: ${user.email} / ${user.password}`);
      });
    }

    console.log('\n🔗 Service URL: http://localhost:' + (process.env.PORT || '3001'));
    console.log('📚 API Docs: http://localhost:' + (process.env.PORT || '3001') + '/api-docs');
    console.log('\n' + '='.repeat(50));
    console.log('© Design and Developed by Aninda Sundar Roy');
    console.log('='.repeat(50) + '\n');

  } catch (error) {
    logger.error('Database setup failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
  }
}

// Run setup if this file is executed directly
if (require.main === module) {
  setupDatabase();
}

export { setupDatabase, createUser };