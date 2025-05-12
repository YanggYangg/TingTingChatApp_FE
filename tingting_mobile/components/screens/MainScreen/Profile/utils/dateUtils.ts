import type { Post } from "../types/post"

// Format date to display
export const formatDate = (date: Date): string => {
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (isSameDay(date, today)) {
    return "Hôm nay"
  } else if (isSameDay(date, yesterday)) {
    return "Hôm qua"
  } else {
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`
  }
}

// Check if two dates are the same day
export const isSameDay = (date1: Date, date2: Date): boolean => {
  return (
    date1.getDate() === date2.getDate() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getFullYear() === date2.getFullYear()
  )
}

// Group posts by date
export const groupPostsByDate = (posts: Post[]): Record<string, Post[]> => {
  const grouped: Record<string, Post[]> = {}

  // Sort posts by createdAt (newest first)
  const sortedPosts = [...posts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  sortedPosts.forEach((post) => {
    const date = new Date(post.createdAt)
    const formattedDate = formatDate(date)

    if (!grouped[formattedDate]) {
      grouped[formattedDate] = []
    }

    grouped[formattedDate].push(post)
  })

  return grouped
}
