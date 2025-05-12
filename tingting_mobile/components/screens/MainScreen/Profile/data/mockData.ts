import type { Post } from "../types/post"

// Current date for reference
const now = new Date()

// Helper to create dates in the past
const daysAgo = (days: number): string => {
  const date = new Date(now)
  date.setDate(date.getDate() - days)
  return date.toISOString()
}

// Mock profile IDs
const profileId1 = "60d21b4667d0d8992e610c85"
const profileId2 = "60d21b4667d0d8992e610c86"

// Mock posts data with varying dates
export const mockPosts: Post[] = [
  // Today's posts
  {
    id: "1",
    profileId: profileId1,
    content: "Aaaaa",
    media: [],
    privacy: "public",
    tags: [],
    reactions: { like: 5, love: 2, haha: 0, angry: 0 },
    commentsCount: 1,
    isHidden: false,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  },
  {
    id: "2",
    profileId: profileId2,
    content: "Đơn hàng mới đã đến!",
    media: [
      {
        url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330",
        type: "image",
      },
      {
        url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330",
        type: "image",
      },
      {
        url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330",
        type: "image",
      },
      {
        url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330",
        type: "image",
      },
      {
        url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330",
        type: "image",
      },
    ],
    privacy: "public",
    tags: [],
    reactions: { like: 12, love: 3, haha: 1, angry: 0 },
    commentsCount: 3,
    isHidden: false,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  },

  // Yesterday's posts
  {
    id: "3",
    profileId: profileId1,
    content: "Hôm nay thật là một ngày tuyệt vời!",
    media: [
      {
        url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330",
        type: "image",
      },
    ],
    privacy: "public",
    tags: [],
    reactions: { like: 8, love: 4, haha: 0, angry: 0 },
    commentsCount: 2,
    isHidden: false,
    createdAt: daysAgo(1),
    updatedAt: daysAgo(1),
  },

  // 3 days ago
  {
    id: "4",
    profileId: profileId2,
    content: "Đi chơi với bạn bè cuối tuần này ai tham gia không?",
    media: [],
    privacy: "friends",
    tags: [profileId1],
    reactions: { like: 15, love: 7, haha: 2, angry: 0 },
    commentsCount: 8,
    isHidden: false,
    createdAt: daysAgo(3),
    updatedAt: daysAgo(3),
  },

  // 5 days ago
  {
    id: "5",
    profileId: profileId1,
    content: "Món ăn mới tôi vừa nấu, trông ngon không?",
    media: [
      {
        url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330",
        type: "image",
      },
      {
        url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330",
        type: "image",
      },
    ],
    privacy: "public",
    tags: [],
    reactions: { like: 25, love: 12, haha: 0, angry: 0 },
    commentsCount: 5,
    isHidden: false,
    createdAt: daysAgo(5),
    updatedAt: daysAgo(5),
  },
]
