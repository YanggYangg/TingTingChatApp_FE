import { View, Text, StyleSheet } from "react-native"

type DateHeaderProps = {
  date: string
}

const DateHeader = ({ date }: DateHeaderProps) => {
  return (
    <View style={styles.container}>
      <View style={styles.dateContainer}>
        <Text style={styles.dateText}>{date}</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 10,
    paddingLeft: 30,
  },
  dateContainer: {
    backgroundColor: "#eee",
    paddingVertical: 5,
    paddingHorizontal: 15,
    borderRadius: 15,
  },
  dateText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#555",
  },
})

export default DateHeader
