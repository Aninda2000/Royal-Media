'use client';

import React from 'react';

export interface NotificationSettingsProps {
  className?: string;
}

export const NotificationSettings: React.FC<NotificationSettingsProps> = ({ 
  className 
}) => {
  return (
    <div className={className}>
      <div className="notification-settings">
        {/* Notification settings implementation */}
        <h1>Notification Settings</h1>
        <p>Configure your notification preferences...</p>
      </div>
    </div>
  );
};