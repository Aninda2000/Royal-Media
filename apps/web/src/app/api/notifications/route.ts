import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { recipientId, type, title, message, actorId, entityType, entityId, data, priority } = body;

    // Validate required fields
    if (!recipientId || !type || !title || !message) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Forward to notification service
    const notificationServiceUrl = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3005';
    
    const response = await fetch(`${notificationServiceUrl}/api/notifications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.NOTIFICATION_SERVICE_API_KEY || 'dev-api-key'}`,
      },
      body: JSON.stringify({
        recipientId,
        type,
        title,
        message,
        actorId,
        entityType,
        entityId,
        data,
        priority: priority || 'normal',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { success: false, message: errorData.message || 'Failed to create notification' },
        { status: response.status }
      );
    }

    const result = await response.json();
    return NextResponse.json(result);

  } catch (error) {
    console.error('Error in notification API:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}