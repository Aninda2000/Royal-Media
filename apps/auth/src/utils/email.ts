import * as nodemailer from 'nodemailer';
import { env } from '../config/env';
import { createLogger } from '../utils/common';

const logger = createLogger('auth-service');

// Create transporter
const createTransporter = () => {
  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS) {
    logger.warn('Email configuration missing, emails will not be sent');
    return null;
  }

  return nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: parseInt(env.SMTP_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  });
};

const transporter = createTransporter();

export const sendVerificationEmail = async (
  email: string,
  token: string
): Promise<void> => {
  if (!transporter) {
    logger.warn('Email transporter not configured, skipping verification email');
    return;
  }

  const verificationUrl = `${env.FRONTEND_URL}/verify-email/${token}`;

  const mailOptions = {
    from: `"${env.FROM_NAME || 'Royal-Media'}" <${env.FROM_EMAIL}>`,
    to: email,
    subject: 'Verify your Royal-Media account',
    html: `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; background: linear-gradient(135deg, #8B5CF6 0%, #3B82F6 100%); padding: 2px; border-radius: 12px;">
        <div style="background: white; padding: 40px; border-radius: 10px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #8B5CF6; font-size: 28px; margin-bottom: 10px;">Welcome to Royal-Media!</h1>
            <p style="color: #666; font-size: 16px;">Connect with the world</p>
          </div>
          
          <p style="color: #333; font-size: 16px; line-height: 1.6;">
            Thank you for joining Royal-Media! Please verify your email address by clicking the button below:
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" 
               style="display: inline-block; background: linear-gradient(135deg, #8B5CF6 0%, #3B82F6 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
              Verify Email Address
            </a>
          </div>
          
          <p style="color: #666; font-size: 14px;">
            If the button doesn't work, you can copy and paste this link into your browser:
          </p>
          <p style="word-break: break-all; color: #8B5CF6; font-size: 14px;">${verificationUrl}</p>
          
          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center;">
            <p style="color: #999; font-size: 12px;">
              This link will expire in 24 hours. If you didn't create an account, you can safely ignore this email.
            </p>
            <p style="color: #999; font-size: 11px; margin-top: 10px;">
              © Design and Developed by Aninda Sundar Roy
            </p>
          </div>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    logger.info('Verification email sent successfully', { email });
  } catch (error) {
    logger.error('Failed to send verification email:', error);
    throw error;
  }
};

export const sendPasswordResetEmail = async (
  email: string,
  token: string
): Promise<void> => {
  if (!transporter) {
    logger.warn('Email transporter not configured, skipping password reset email');
    return;
  }

  const resetUrl = `${env.FRONTEND_URL}/reset-password/${token}`;

  const mailOptions = {
    from: `"${env.FROM_NAME || 'Royal-Media'}" <${env.FROM_EMAIL}>`,
    to: email,
    subject: 'Reset your Royal-Media password',
    html: `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%); padding: 2px; border-radius: 12px;">
        <div style="background: white; padding: 40px; border-radius: 10px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #EF4444; font-size: 28px; margin-bottom: 10px;">Password Reset</h1>
            <p style="color: #666; font-size: 16px;">Royal-Media Security</p>
          </div>
          
          <p style="color: #333; font-size: 16px; line-height: 1.6;">
            You requested to reset your password. Click the button below to set a new password:
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="display: inline-block; background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
              Reset Password
            </a>
          </div>
          
          <p style="color: #666; font-size: 14px;">
            If the button doesn't work, you can copy and paste this link into your browser:
          </p>
          <p style="word-break: break-all; color: #EF4444; font-size: 14px;">${resetUrl}</p>
          
          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center;">
            <p style="color: #999; font-size: 12px;">
              This link will expire in 10 minutes. If you didn't request a password reset, you can safely ignore this email.
            </p>
            <p style="color: #999; font-size: 11px; margin-top: 10px;">
              © Design and Developed by Aninda Sundar Roy
            </p>
          </div>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    logger.info('Password reset email sent successfully', { email });
  } catch (error) {
    logger.error('Failed to send password reset email:', error);
    throw error;
  }
};

export const sendWelcomeEmail = async (
  email: string,
  firstName: string
): Promise<void> => {
  if (!transporter) {
    logger.warn('Email transporter not configured, skipping welcome email');
    return;
  }

  const mailOptions = {
    from: `"${env.FROM_NAME || 'Royal-Media'}" <${env.FROM_EMAIL}>`,
    to: email,
    subject: 'Welcome to Royal-Media!',
    html: `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; background: linear-gradient(135deg, #10B981 0%, #059669 100%); padding: 2px; border-radius: 12px;">
        <div style="background: white; padding: 40px; border-radius: 10px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #10B981; font-size: 28px; margin-bottom: 10px;">Welcome to Royal-Media, ${firstName}! 🎉</h1>
            <p style="color: #666; font-size: 16px;">Your journey begins now</p>
          </div>
          
          <p style="color: #333; font-size: 16px; line-height: 1.6;">
            Your email has been verified and your account is now active! You're all set to explore Royal-Media.
          </p>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #333; margin-bottom: 15px;">You can now:</h3>
            <ul style="color: #666; line-height: 1.8; margin: 0; padding-left: 20px;">
              <li>Create and share posts with photos and videos</li>
              <li>Follow friends and discover new people</li>
              <li>Send messages and chat in real-time</li>
              <li>Customize your profile and privacy settings</li>
              <li>Join conversations and engage with the community</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${env.FRONTEND_URL}" 
               style="display: inline-block; background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
              Start Exploring
            </a>
          </div>
          
          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center;">
            <p style="color: #666; font-size: 14px;">
              Thanks for joining our community! If you have any questions, feel free to reach out.
            </p>
            <p style="color: #999; font-size: 11px; margin-top: 10px;">
              © Design and Developed by Aninda Sundar Roy
            </p>
          </div>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    logger.info('Welcome email sent successfully', { email });
  } catch (error) {
    logger.error('Failed to send welcome email:', error);
    // Don't throw error for welcome emails
  }
};