import { View, FlatList, StyleSheet } from "react-native"
import Post from "./Post"
import DateHeader from "./DateHeader"
import type { Post as PostType } from "../types/post"
import { groupPostsByDate } from "../utils/dateUtils"

type PostFeedProps = {
  posts: PostType[]
}

const PostFeed = ({ posts }: PostFeedProps) => {
  const groupedPosts = groupPostsByDate(posts)

  // Convert grouped posts to a flat array with date headers
  const flattenedData = Object.entries(groupedPosts).flatMap(([date, datePosts]) => {
    return [{ id: `date-${date}`, type: "date", date }, ...datePosts.map((post) => ({ ...post, type: "post" }))]
  })

  const renderItem = ({ item }: { item: any }) => {
    if (item.type === "date") {
      return <DateHeader date={item.date} />
    }
    return <Post post={item} />
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={flattenedData}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 20,
  },
})

export default PostFeed
