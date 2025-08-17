// Initialize the Royal-Media database with collections and indexes
db = db.getSiblingDB('royal_media');

print('Initializing Royal-Media database...');

// Create collections
db.createCollection('users');
db.createCollection('posts');
db.createCollection('comments');
db.createCollection('conversations');
db.createCollection('messages');
db.createCollection('notifications');
db.createCollection('activities');
db.createCollection('media');
db.createCollection('hashtags');
db.createCollection('friendrequests');
db.createCollection('blocks');
db.createCollection('reports');

print('Collections created successfully');

// Create indexes for users collection
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ handle: 1 }, { unique: true });
db.users.createIndex({ firstName: 'text', lastName: 'text', handle: 'text' });
db.users.createIndex({ createdAt: -1 });
db.users.createIndex({ isOnline: 1, lastSeen: -1 });
db.users.createIndex({ emailVerificationToken: 1 });
db.users.createIndex({ passwordResetToken: 1 });
db.users.createIndex({ googleId: 1 }, { sparse: true });
db.users.createIndex({ 'privacySettings.profileVisibility': 1 });

// Create indexes for posts collection
db.posts.createIndex({ authorId: 1, createdAt: -1 });
db.posts.createIndex({ text: 'text' });
db.posts.createIndex({ hashtags: 1 });
db.posts.createIndex({ mentions: 1 });
db.posts.createIndex({ createdAt: -1 });
db.posts.createIndex({ likeCount: -1 });
db.posts.createIndex({ visibility: 1, createdAt: -1 });
db.posts.createIndex({ 'originalPost': 1 }); // For reposts

// Create indexes for comments collection
db.comments.createIndex({ postId: 1, createdAt: -1 });
db.comments.createIndex({ authorId: 1, createdAt: -1 });
db.comments.createIndex({ parentCommentId: 1 });

// Create indexes for conversations collection
db.conversations.createIndex({ participantIds: 1 });
db.conversations.createIndex({ lastMessageAt: -1 });
db.conversations.createIndex({ type: 1 });

// Create indexes for messages collection
db.messages.createIndex({ conversationId: 1, createdAt: -1 });
db.messages.createIndex({ senderId: 1, createdAt: -1 });
db.messages.createIndex({ 'readBy.userId': 1 });

// Create indexes for notifications collection
db.notifications.createIndex({ recipientId: 1, createdAt: -1 });
db.notifications.createIndex({ recipientId: 1, isRead: 1, createdAt: -1 });
db.notifications.createIndex({ type: 1 });
db.notifications.createIndex({ actorId: 1 });

// Create indexes for activities collection
db.activities.createIndex({ userId: 1, createdAt: -1 });
db.activities.createIndex({ type: 1, createdAt: -1 });

// Create indexes for media collection
db.media.createIndex({ ownerId: 1, createdAt: -1 });
db.media.createIndex({ type: 1 });
db.media.createIndex({ createdAt: -1 });

// Create indexes for hashtags collection
db.hashtags.createIndex({ tag: 1 }, { unique: true });
db.hashtags.createIndex({ count: -1 });
db.hashtags.createIndex({ trending: 1, count: -1 });
db.hashtags.createIndex({ lastUsed: -1 });

// Create indexes for friend requests collection
db.friendrequests.createIndex({ senderId: 1, receiverId: 1 }, { unique: true });
db.friendrequests.createIndex({ receiverId: 1, status: 1 });
db.friendrequests.createIndex({ senderId: 1, status: 1 });
db.friendrequests.createIndex({ createdAt: -1 });

// Create indexes for blocks collection
db.blocks.createIndex({ blockerId: 1, blockedId: 1 }, { unique: true });
db.blocks.createIndex({ blockerId: 1 });
db.blocks.createIndex({ blockedId: 1 });

// Create indexes for reports collection
db.reports.createIndex({ reporterId: 1, entityType: 1, entityId: 1 });
db.reports.createIndex({ status: 1, createdAt: -1 });
db.reports.createIndex({ entityType: 1, entityId: 1 });

print('Indexes created successfully');

// Insert sample data for development
const sampleUsers = [
  {
    email: 'admin@royal-media.com',
    firstName: 'Admin',
    lastName: 'User',
    handle: 'admin',
    bio: 'System Administrator',
    isVerified: true,
    emailVerified: true,
    privacySettings: {
      profileVisibility: 'public',
      postsVisibility: 'public',
      friendsListVisible: true,
      allowFollowRequests: true,
      allowMessages: 'everyone'
    },
    providers: ['local'],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    email: 'demo@royal-media.com',
    firstName: 'Demo',
    lastName: 'User',
    handle: 'demouser',
    bio: 'This is a demo account for Royal-Media',
    emailVerified: true,
    privacySettings: {
      profileVisibility: 'public',
      postsVisibility: 'public',
      friendsListVisible: true,
      allowFollowRequests: true,
      allowMessages: 'everyone'
    },
    providers: ['local'],
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// Insert sample users (only if they don't exist)
sampleUsers.forEach(user => {
  const existing = db.users.findOne({ email: user.email });
  if (!existing) {
    db.users.insertOne(user);
    print(`Created user: ${user.email}`);
  }
});

// Insert sample hashtags
const sampleHashtags = [
  { tag: 'royalmedia', count: 0, trending: true, lastUsed: new Date(), createdAt: new Date() },
  { tag: 'socialmedia', count: 0, trending: true, lastUsed: new Date(), createdAt: new Date() },
  { tag: 'welcome', count: 0, trending: false, lastUsed: new Date(), createdAt: new Date() },
  { tag: 'technology', count: 0, trending: false, lastUsed: new Date(), createdAt: new Date() },
  { tag: 'community', count: 0, trending: false, lastUsed: new Date(), createdAt: new Date() }
];

sampleHashtags.forEach(hashtag => {
  const existing = db.hashtags.findOne({ tag: hashtag.tag });
  if (!existing) {
    db.hashtags.insertOne(hashtag);
    print(`Created hashtag: #${hashtag.tag}`);
  }
});

print('Royal-Media database initialized successfully!');
print('Database: royal_media');
print('Collections: users, posts, comments, conversations, messages, notifications, activities, media, hashtags, friendrequests, blocks, reports');
print('Sample users: admin@royal-media.com, demo@royal-media.com');
print('© Design and Developed by Aninda Sundar Roy');