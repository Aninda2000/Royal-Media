'use client';

import React from 'react';

interface NotificationProviderProps {
  children: React.ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  // Simple provider that just renders children
  // Individual components can handle their own notification logic
  return <>{children}</>;
};