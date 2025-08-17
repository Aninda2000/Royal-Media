import mongoose from 'mongoose'
import dotenv from 'dotenv'
import { Post } from '../models/Post'
import { User } from '../models/User'

// Load environment variables
dotenv.config()

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/royal_media'

const sampleUsers = [
  {
    _id: new mongoose.Types.ObjectId(),
    firstName: 'Alice',
    lastName: 'Johnson',
    username: 'alice_j',
    handle: 'alice_j',
    email: 'alice@example.com',
    profileImage: '/avatars/alice.jpg',
    isVerified: true
  },
  {
    _id: new mongoose.Types.ObjectId(),
    firstName: 'Bob',
    lastName: 'Smith',
    username: 'bob_smith',
    handle: 'bob_smith',
    email: 'bob@example.com',
    profileImage: '/avatars/bob.jpg',
    isVerified: false
  },
  {
    _id: new mongoose.Types.ObjectId(),
    firstName: 'Carol',
    lastName: 'Davis',
    username: 'carol_d',
    handle: 'carol_d',
    email: 'carol@example.com',
    profileImage: '/avatars/carol.jpg',
    isVerified: true
  },
  {
    _id: new mongoose.Types.ObjectId(),
    firstName: 'David',
    lastName: 'Wilson',
    username: 'david_w',
    handle: 'david_w',
    email: 'david@example.com',
    profileImage: '/avatars/david.jpg',
    isVerified: false
  },
  {
    _id: new mongoose.Types.ObjectId(),
    firstName: 'Emma',
    lastName: 'Brown',
    username: 'emma_b',
    handle: 'emma_b',
    email: 'emma@example.com',
    profileImage: '/avatars/emma.jpg',
    isVerified: true
  }
]

const samplePosts = [
  {
    author: sampleUsers[0]._id,
    content: "Just launched my new project! 🚀 Excited to share it with everyone. What do you think? #RoyalMedia #TechNews #Innovation",
    images: ['/posts/project.jpg'],
    hashtags: ['RoyalMedia', 'TechNews', 'Innovation'],
    isPublic: true,
    likesCount: 24,
    commentsCount: 8,
    sharesCount: 3,
    bookmarksCount: 12,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
  },
  {
    author: sampleUsers[1]._id,
    content: "Beautiful sunset today! Nature never fails to amaze me 🌅 Taking a moment to appreciate the simple things in life.",
    images: ['/posts/sunset.jpg'],
    hashtags: ['Nature', 'Sunset', 'Photography'],
    isPublic: true,
    likesCount: 156,
    commentsCount: 23,
    sharesCount: 12,
    bookmarksCount: 45,
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000) // 4 hours ago
  },
  {
    author: sampleUsers[2]._id,
    content: "Great meeting with the team today. We're making amazing progress on our goals! 💪 #teamwork #progress #RoyalMedia",
    hashtags: ['teamwork', 'progress', 'RoyalMedia'],
    isPublic: true,
    likesCount: 89,
    commentsCount: 15,
    sharesCount: 7,
    bookmarksCount: 22,
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000) // 6 hours ago
  },
  {
    author: sampleUsers[3]._id,
    content: "Learning something new every day! Today I dove deep into microservices architecture. The possibilities are endless! #Programming #Learning #TechNews",
    hashtags: ['Programming', 'Learning', 'TechNews'],
    isPublic: true,
    likesCount: 67,
    commentsCount: 12,
    sharesCount: 5,
    bookmarksCount: 18,
    createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000) // 8 hours ago
  },
  {
    author: sampleUsers[4]._id,
    content: "Coffee and code - the perfect combination for a productive morning! ☕️💻 What's your favorite coding fuel? #Programming #Coffee #Design",
    hashtags: ['Programming', 'Coffee', 'Design'],
    isPublic: true,
    likesCount: 134,
    commentsCount: 28,
    sharesCount: 9,
    bookmarksCount: 31,
    createdAt: new Date(Date.now() - 10 * 60 * 60 * 1000) // 10 hours ago
  },
  {
    author: sampleUsers[0]._id,
    content: "Excited to announce that Royal Media is growing! We're building something amazing together. Thank you to everyone who's been part of this journey! 🎉 #RoyalMedia #Growth #Community",
    hashtags: ['RoyalMedia', 'Growth', 'Community'],
    isPublic: true,
    likesCount: 298,
    commentsCount: 45,
    sharesCount: 23,
    bookmarksCount: 67,
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000) // 12 hours ago
  },
  {
    author: sampleUsers[1]._id,
    content: "Weekend vibes! Time to disconnect and recharge. Sometimes the best ideas come when you're not actively looking for them. 🌟 #WeekendVibes #Inspiration",
    hashtags: ['WeekendVibes', 'Inspiration'],
    isPublic: true,
    likesCount: 78,
    commentsCount: 19,
    sharesCount: 6,
    bookmarksCount: 24,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
  },
  {
    author: sampleUsers[2]._id,
    content: "Just finished reading an amazing book on product design. The intersection of technology and human psychology is fascinating! 📚 #Design #ProductDesign #UX",
    hashtags: ['Design', 'ProductDesign', 'UX'],
    isPublic: true,
    likesCount: 112,
    commentsCount: 21,
    sharesCount: 8,
    bookmarksCount: 35,
    createdAt: new Date(Date.now() - 1.5 * 24 * 60 * 60 * 1000) // 1.5 days ago
  }
]

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...')
    
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI)
    console.log('✅ Connected to MongoDB')

    // Clear existing data
    await Post.deleteMany({})
    await User.deleteMany({})
    console.log('🗑️  Cleared existing data')

    // Create sample users
    await User.insertMany(sampleUsers)
    console.log('👥 Created sample users')

    // Create sample posts
    await Post.insertMany(samplePosts)
    console.log('📝 Created sample posts')

    console.log('🎉 Database seeding completed successfully!')
    console.log(`Created ${sampleUsers.length} users and ${samplePosts.length} posts`)

  } catch (error) {
    console.error('❌ Error seeding database:', error)
    process.exit(1)
  } finally {
    await mongoose.disconnect()
    console.log('🔌 Disconnected from MongoDB')
    process.exit(0)
  }
}

// Run the seed function
if (require.main === module) {
  seedDatabase()
}

export { seedDatabase }