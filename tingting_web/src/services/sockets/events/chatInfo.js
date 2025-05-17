// Gửi yêu cầu đăng ký userId
export const registerUser = (socket, userId) => {
  if (!socket.connected) {
    console.error("Socket is not connected");
    return;
  }
  socket.emit("registerUser", { userId });
};

// Gửi yêu cầu lấy thông tin chat
export const getChatInfo = (socket, data, callback) => {
  if (!socket.connected) {
    console.error("Socket is not connected");
    return;
  }
  socket.emit("getChatInfo", data, callback);
};

// Lắng nghe thông tin chat
export const onChatInfo = (socket, callback) => {
  socket.on("chatInfo", callback);
};

// Ngừng lắng nghe thông tin chat
export const offChatInfo = (socket) => {
  socket.off("chatInfo");
};

// Lắng nghe cập nhật thông tin chat
export const onChatInfoUpdated = (socket, callback) => {
  socket.on("chatInfoUpdated", callback);
};

// Ngừng lắng nghe cập nhật thông tin chat
export const offChatInfoUpdated = (socket) => {
  socket.off("chatInfoUpdated");
};

// Gửi yêu cầu cập nhật tên chat
export const updateChatName = (socket, data, callback) => {
  if (!socket.connected) {
    console.error("Socket is not connected");
    return;
  }
  socket.emit("updateChatName", data, callback);
};

// Gửi yêu cầu thêm thành viên vào nhóm
export const addParticipant = (socket, data, callback) => {
  if (!socket.connected) {
    console.error("Socket is not connected");
    return;
  }
  socket.emit("addParticipant", data, callback);
};

// Gửi yêu cầu xóa thành viên khỏi nhóm
export const removeParticipant = (socket, data, callback) => {
  if (!socket.connected) {
    console.error("Socket is not connected");
    return;
  }
  socket.emit("removeParticipant", data, callback);
};

// Gửi yêu cầu thay đổi vai trò thành viên
export const changeParticipantRole = (socket, data, callback) => {
  if (!socket.connected) {
    console.error("Socket is not connected");
    return;
  }
  socket.emit("changeParticipantRole", data, callback);
};

// Gửi yêu cầu chuyển giao quyền admin nhóm
export const transferGroupAdmin = (socket, data, callback) => {
  if (!socket.connected) {
    console.error("Socket is not connected");
    return;
  }
  socket.emit("transferGroupAdmin", data, callback);
};

// Gửi yêu cầu lấy danh sách media của chat
export const getChatMedia = (socket, data, callback) => {
  if (!socket.connected) {
    console.error("Socket is not connected");
    return;
  }
  socket.emit("getChatMedia", data, callback);
};

// Lắng nghe danh sách media của chat
export const onChatMedia = (socket, callback) => {
  socket.on("chatMedia", callback);
};

// Ngừng lắng nghe danh sách media của chat
export const offChatMedia = (socket) => {
  socket.off("chatMedia");
};

// Gửi yêu cầu lấy danh sách file của chat
export const getChatFiles = (socket, data, callback) => {
  if (!socket.connected) {
    console.error("Socket is not connected");
    return;
  }
  socket.emit("getChatFiles", data, callback);
};

// Lắng nghe danh sách file của chat
export const onChatFiles = (socket, callback) => {
  socket.on("chatFiles", callback);
};

// Ngừng lắng nghe danh sách file của chat
export const offChatFiles = (socket) => {
  socket.off("chatFiles");
};

// Gửi yêu cầu lấy danh sách link của chat
export const getChatLinks = (socket, data, callback) => {
  if (!socket.connected) {
    console.error("Socket is not connected");
    return;
  }
  socket.emit("getChatLinks", data, callback);
};

// Lắng nghe danh sách link của chat
export const onChatLinks = (socket, callback) => {
  socket.on("chatLinks", callback);
};

// Ngừng lắng nghe danh sách link của chat
export const offChatLinks = (socket) => {
  socket.off("chatLinks");
};

// Gửi yêu cầu lấy dung lượng lưu trữ của chat
export const getChatStorage = (socket, data, callback) => {
  if (!socket.connected) {
    console.error("Socket is not connected");
    return;
  }
  socket.emit("getChatStorage", data, callback);
};

// Lắng nghe dung lượng lưu trữ của chat
export const onChatStorage = (socket, callback) => {
  socket.on("chatStorage", callback);
};

// Ngừng lắng nghe dung lượng lưu trữ của chat
export const offChatStorage = (socket) => {
  socket.off("chatStorage");
};

// Gửi yêu cầu ghim chat
export const pinChat = (socket, data, callback) => {
  if (!socket.connected) {
    console.error("Socket is not connected");
    return;
  }
  socket.emit("pinChat", data, callback);
};

// Gửi yêu cầu cập nhật thông báo (mute/unmute)
export const updateNotification = (socket, data, callback) => {
  if (!socket.connected) {
    console.error("Socket is not connected");
    return;
  }
  socket.emit("updateNotification", data, callback);
};

// Gửi yêu cầu ẩn chat
export const hideChat = (socket, data, callback) => {
  if (!socket.connected) {
    console.error("Socket is not connected");
    return;
  }
  socket.emit("hideChat", data, callback);
};

// Gửi yêu cầu lấy danh sách nhóm chung
export const getCommonGroups = (socket, data, callback) => {
  if (!socket.connected) {
    console.error("Socket is not connected");
    return;
  }
  socket.emit("getCommonGroups", data, callback);
};

// Lắng nghe danh sách nhóm chung
export const onCommonGroups = (socket, callback) => {
  socket.on("commonGroups", callback);
};

// Ngừng lắng nghe danh sách nhóm chung
export const offCommonGroups = (socket) => {
  socket.off("commonGroups");
};

// Gửi yêu cầu tìm kiếm tin nhắn trong chat
export const findMessages = (socket, data, callback) => {
  if (!socket.connected) {
    console.error("Socket is not connected");
    return;
  }
  socket.emit("findMessages", data, callback);
};

// Lắng nghe kết quả tìm kiếm tin nhắn
export const onFoundMessages = (socket, callback) => {
  socket.on("foundMessages", callback);
};

// Ngừng lắng nghe kết quả tìm kiếm tin nhắn
export const offFoundMessages = (socket) => {
  socket.off("foundMessages");
};

// Gửi yêu cầu tạo nhóm
export const createConversation = (socket, groupData, callback) => {
  if (!socket.connected) {
    console.error("Socket is not connected");
    return;
  }
  socket.emit("createConversation", groupData, callback);
};

// Gửi yêu cầu chuyển tiếp tin nhắn
export const forwardMessage = (socket, forwardData, callback) => {
  if (!socket.connected) {
    console.error("Socket is not connected");
    return;
  }
  socket.emit("forwardMessage", forwardData, callback);
};

// Lắng nghe kết quả chuyển tiếp tin nhắn
export const onMessageForwarded = (socket, callback) => {
  socket.on("messageForwarded", callback);
};

// Ngừng lắng nghe kết quả chuyển tiếp tin nhắn
export const offMessageForwarded = (socket) => {
  socket.off("messageForwarded");
};

// Gửi yêu cầu xóa tin nhắn
export const deleteMessage = (socket, data, callback) => {
  if (!socket.connected) {
    console.error("Socket is not connected");
    return;
  }
  socket.emit("deleteMessage", data, callback);
};

// Lắng nghe sự kiện xóa tin nhắn
export const onMessageDeleted = (socket, callback) => {
  socket.on("messageDeleted", callback);
};

// Ngừng lắng nghe sự kiện xóa tin nhắn
export const offMessageDeleted = (socket) => {
  socket.off("messageDeleted");
};

// Lắng nghe sự kiện nhóm được tạo
export const onConversationCreated = (socket, callback) => {
  socket.on("conversationCreated", callback);
};

// Ngừng lắng nghe sự kiện nhóm được tạo
export const offConversationCreated = (socket) => {
  socket.off("conversationCreated");
};

// Lắng nghe sự kiện bị xóa khỏi cuộc trò chuyện
export const onConversationRemoved = (socket, callback) => {
  socket.on("conversationRemoved", callback);
};

// Ngừng lắng nghe sự kiện bị xóa khỏi cuộc trò chuyện
export const offConversationRemoved = (socket) => {
  socket.off("conversationRemoved");
};

// Lắng nghe lỗi từ server
export const onError = (socket, callback) => {
  socket.on("error", callback);
};

// Ngừng lắng nghe lỗi từ server
export const offError = (socket) => {
  socket.off("error");
};

// Gửi yêu cầu giải tán nhóm
export const disbandGroup = (socket, data, callback) => {
  if (!socket.connected) {
    console.error("Socket is not connected");
    return;
  }
  socket.emit("disbandGroup", data, callback);
};

// Lắng nghe sự kiện nhóm bị giải tán
export const onGroupDisbanded = (socket, callback) => {
  socket.on("groupDisbanded", callback);
};

// Ngừng lắng nghe sự kiện nhóm bị giải tán
export const offGroupDisbanded = (socket) => {
  socket.off("groupDisbanded");
};

// Gửi yêu cầu rời nhóm
export const leaveGroup = (socket, data, callback) => {
  if (!socket.connected) {
    console.error("Socket is not connected");
    return;
  }
  socket.emit("leaveGroup", data, callback);
};

// Lắng nghe sự kiện rời nhóm
export const onGroupLeft = (socket, callback) => {
  socket.on("groupLeft", callback);
};

// Ngừng lắng nghe sự kiện rời nhóm
export const offGroupLeft = (socket) => {
  socket.off("groupLeft");
};

// Gửi yêu cầu cập nhật ảnh nhóm
export const updateGroupImage = (socket, data, callback) => {
  if (!socket.connected) {
    console.error("Socket is not connected");
    return;
  }
  socket.emit("updateGroupImage", data, callback || ((response) => {
    console.log("updateGroupImage response:", response);
  }));
};

// Gửi yêu cầu xóa toàn bộ lịch sử chat
export const deleteAllChatHistory = (socket, data, callback) => {
  if (!socket.connected) {
    console.error("Socket is not connected");
    return;
  }
  socket.emit("deleteAllChatHistory", data, callback);
};

// Gửi yêu cầu xóa tin nhắn trong storage
export const deleteMessageChatInfo = (socket, data, callback) => {
  if (!socket.connected) {
    console.error("Socket is not connected");
    return;
  }
  socket.emit("deleteMessageChatInfo", data, callback);
};

// Lắng nghe phản hồi từ addParticipant
export const onAddParticipantResponse = (socket, callback) => {
  socket.on("addParticipantResponse", callback);
};

// Gỡ lắng nghe phản hồi addParticipant
export const offAddParticipantResponse = (socket) => {
  socket.off("addParticipantResponse");
};

