/**
 * Socket.IO methods for ChatInfo-related events
 */

// Update chat info (đổi tên nhóm, xóa hình nhóm, ghim, ẩn, tắt thông báo, v.v.)
export const updateChatInfo = (socket, data) => {
    socket.emit("updateChatInfo", data); // data: { conversationId, name, imageGroup, pinnedUsers, hiddenUsers, mutedUsers, v.v. }
  };
  
  // Listen for chat info updates
  export const onChatInfoUpdated = (socket, callback) => {
    socket.on("chatInfoUpdated", callback);
  };
  
  // Stop listening for chat info updates
  export const offChatInfoUpdated = (socket) => {
    socket.off("chatInfoUpdated");
  };
  
  // Delete a message (liên quan đến ChatInfo vì cần cập nhật danh sách file/link)
  export const deleteMessage = (socket, data) => {
    socket.emit("messageDeleted", data); // data: { messageId, messageType }
  };
  
  // Listen for deleted messages
  export const onMessageDeleted = (socket, callback) => {
    socket.on("messageDeleted", callback);
  };
  
  // Stop listening for deleted messages
  export const offMessageDeleted = (socket) => {
    socket.off("messageDeleted");
  };
  
  // Remove a member from the group
  export const removeMember = (socket, data) => {
    socket.emit("removeMember", data); // data: { conversationId, userId }
  };
  
  // Listen for member removal
  export const onMemberRemoved = (socket, callback) => {
    socket.on("memberRemoved", callback);
  
    return () => {
      socket.off("memberRemoved");
    };
  };
  
  // Stop listening for member removal
  export const offMemberRemoved = (socket) => {
    socket.off("memberRemoved");
  };
  
  // Disband a group
  export const disbandGroup = (socket, data) => {
    socket.emit("disbandGroup", data); // data: { conversationId }
  };
  
  // Listen for group disbandment
  export const onGroupDisbanded = (socket, callback) => {
    socket.on("groupDisbanded", callback);
  };
  
  // Stop listening for group disbandment
  export const offGroupDisbanded = (socket) => {
    socket.off("groupDisbanded");
  };
  
  // Leave a group
  export const leaveGroup = (socket, data) => {
    socket.emit("leaveGroup", data); // data: { conversationId, userId }
  };
  
  // Listen for user leaving group
  export const onUserLeftGroup = (socket, callback) => {
    socket.on("userLeftGroup", callback);
  };
  
  // Stop listening for user leaving group
  export const offUserLeftGroup = (socket) => {
    socket.off("userLeftGroup");
  };
  
  // Handle errors related to ChatInfo
  export const onError = (socket, callback) => {
    socket.on("error", callback);
  };
  
  // Stop listening for errors
  export const offError = (socket) => {
    socket.off("error");
  };