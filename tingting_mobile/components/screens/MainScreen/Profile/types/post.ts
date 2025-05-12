export type Media = {
  url: string
  type: "image" | "video"
  thumbnailUrl?: string
}

export type Reactions = {
  like: number
  love: number
  haha: number
  angry: number
}

export type Post = {
  id: string
  profileId: string
  content: string
  media: Media[]
  privacy: "public" | "friends" | "private"
  tags: string[]
  reactions: Reactions
  commentsCount: number
  isHidden: boolean
  createdAt: string
  updatedAt: string
}
