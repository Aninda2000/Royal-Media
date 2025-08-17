'use client';

import React from 'react';

export interface NotificationDropdownProps {
  className?: string;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ 
  className 
}) => {
  return (
    <div className={className}>
      <div className="notification-dropdown">
        {/* Notification dropdown implementation */}
        <p>Notifications</p>
      </div>
    </div>
  );
};