export const transformConversationsToMessages = (conversations, currentUserId, profiles) => {
    console.log("Transforming conversations:", conversations);
    console.log("profiles", profiles);

    return conversations.map(conversation => {
        // Tìm ID người còn lại (nếu không phải group)
        const otherParticipantId = conversation.participants
            .find(p => p.userId !== currentUserId)?.userId;

        // Tìm profile tương ứng từ danh sách profiles
        const otherParticipantProfile = profiles.find(
            p => p?.data?.user?._id === otherParticipantId
        )?.data?.user;

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
            imageGroup: conversation.imageGroup || 'https://picsum.photos/200',
            name: conversation.isGroup
                ? conversation.name
                : `${otherParticipantProfile?.firstname || 'Unknown'} ${otherParticipantProfile?.surname || ''}`.trim(),
            avatar: conversation.isGroup
                ? conversation.imageGroup
                : otherParticipantProfile?.avatar || 'https://picsum.photos/200',
            type: conversation.isGroup ? 'group' : 'personal',
            lastMessage: lastMessage?.content || '',
            lastMessageType: lastMessage?.messageType || 'text',
            lastMessageSenderId: lastMessage?.userId || null,
            isCall: lastMessage?.messageType === 'call',
            time: formattedTime,
            createAt: conversation.createAt,
            updateAt: conversation.updateAt,
            members: conversation.isGroup ? conversation.participants.length : 0,
            // unreadCount: conversation.unreadCount || 0
        };
    });
};
