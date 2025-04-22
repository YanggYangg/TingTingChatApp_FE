/**
 * Transform conversation data from backend format to MessageList format
 * @param {Array} conversations - Array of conversations from backend
 * @param {string} currentUserId - Current user's ID
 * @returns {Array} Transformed messages in MessageList format
 */
export const transformConversationsToMessages = (
  conversations,
  currentUserId
) => {
  // console.log("Transforming conversations:", conversations);

  return conversations.map((conversation) => {
    // Tìm người còn lại trong cuộc trò chuyện cá nhân
    const otherParticipant = conversation.participants.find(
      (p) => p.userId !== currentUserId
    )?.userId;

    const lastMessage = conversation.lastMessage;

    const lastMessageDate = lastMessage?.createdAt
      ? new Date(lastMessage.createdAt)
      : null;

    const today = new Date();
    const isToday = lastMessageDate
      ? lastMessageDate.toDateString() === today.toDateString()
      : false;

    const formattedTime = lastMessageDate
      ? isToday
        ? lastMessageDate.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })
        : lastMessageDate.toLocaleDateString([], {
            day: "2-digit",
            month: "2-digit",
            year: "2-digit",
          })
      : "";

    return {
      id: conversation._id,
      participants: conversation.participants,
      isGroup: conversation.isGroup,
      imageGroup: conversation.imageGroup || "https://picsum.photos/200",
      name: conversation.isGroup
        ? conversation.name
        : otherParticipant?.name || "Unknown",
      avatar: conversation.isGroup
        ? conversation.imageGroup
        : otherParticipant?.avatar || "https://picsum.photos/200",
      type: conversation.isGroup ? "group" : "personal",
      lastMessage: lastMessage?.content || "",
      lastMessageType: lastMessage?.messageType || "text",
      lastMessageSenderId: lastMessage?.userId || null,
      isCall: lastMessage?.messageType === "call",
      time: formattedTime,
      createAt: conversation.createAt,
      updateAt: conversation.updateAt,
      members: conversation.isGroup ? conversation.participants.length : 0,
      // unreadCount: conversation.unreadCount || 0 // Nếu backend trả về
    };
  });
};
