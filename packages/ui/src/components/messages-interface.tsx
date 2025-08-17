'use client';

import React from 'react';

export interface MessagesInterfaceProps {
  className?: string;
}

export const MessagesInterface: React.FC<MessagesInterfaceProps> = ({ 
  className 
}) => {
  return (
    <div className={className}>
      <div className="messages-interface">
        {/* Messages interface implementation */}
        <h1>Messages</h1>
        <p>Messages interface coming soon...</p>
      </div>
    </div>
  );
};