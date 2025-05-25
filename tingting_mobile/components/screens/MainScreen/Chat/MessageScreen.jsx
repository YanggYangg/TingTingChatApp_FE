import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Alert,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { Ionicons } from "@expo/vector-icons";
import { useSelector, useDispatch } from "react-redux"; // Thêm useDispatch
import { useSocket } from "../../../../contexts/SocketContext";
import MessageItem from "../../../chatitems/MessageItem";
import ChatFooter from "./ChatFooter";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { Api_Profile } from "../../../../apis/api_profile";
import { Api_chatInfo } from "../../../../apis/Api_chatInfo";
import ShareModal from "../Chat/chatInfoComponent/ShareModal";
import {
  onConversationUpdate,
  offConversationUpdate,
  joinConversation,
  onConversationRemoved,
} from "../../../../services/sockets/events/conversation";
import {
  onChatInfoUpdated,
  offChatInfoUpdated,
  onGroupLeft,
  offGroupLeft,
} from "../../../../services/sockets/events/chatInfo";
import { setChatInfoUpdate } from "../../../../redux/slices/chatSlice"; // Import setChatInfoUpdate

const ChatScreen = ({ route, navigation }) => {
  const { socket, userId: currentUserId } = useSocket();
  const dispatch = useDispatch(); // Thêm dispatch
  const flatListRef = useRef(null);
  const [messages, setMessages] = useState([]);
  const [replyingTo, setReplyingTo] = useState(null);
  const [showOptions, setShowOptions] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [userCache, setUserCache] = useState({});
  const [isShareModalVisible, setIsShareModalVisible] = useState(false);
  const [messageToForward, setMessageToForward] = useState(null);
  const [conversationInfo, setConversationInfo] = useState({
    name: "",
    isGroup: false,
    participants: [],
    imageGroup: null,
  });
  const [isOnline, setIsOnline] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);

  const { message, user } = route?.params || {};
  const conversationId = message?.id || null;
  const userId = currentUserId || null;
  const selectedMessageData = useSelector((state) => state.chat.selectedMessage);
  const chatInfoUpdate = useSelector((state) => state.chat.chatInfoUpdate); // Lấy chatInfoUpdate từ Redux
  const isGroupChat = message?.isGroup === true;
  // const memberCount = message?.members || 0;
  const memberCount = message?.participants?.length || 0;
  const selectedMessageId = selectedMessageData?.id;
  const receiverId = Object.keys(userCache)[0];
  // Thêm: State để quản lý phân trang và tải tin nhắn
  const [page, setPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [totalMessages, setTotalMessages] = useState(0);

  // Thêm state cho tìm kiếm
  const [searchKeyword, setSearchKeyword] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchModalVisible, setIsSearchModalVisible] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [totalResults, setTotalResults] = useState(0); // Thêm state để lưu tổng số kết quả

  // Thêm state cho bộ lọc và danh sách người gửi
const [filterSender, setFilterSender] = useState("all"); // Lọc theo người gửi
const [filterStartDate, setFilterStartDate] = useState(""); // Ngày bắt đầu
const [filterEndDate, setFilterEndDate] = useState(""); // Ngày kết thúc
const [senders, setSenders] = useState([]); // Danh sách người gửi
const [highlightedMessageId, setHighlightedMessageId] = useState(null);


  // console.log("ChatScreen params:", {
  //   userId,
  //   conversationId,
  //   message,
  //   user,
  //   routeParams: route.params,
  // });

  // Fetch user info

  // useEffect(() => {
  //   console.log("ChatScreen route.params:", route.params);
  //   console.log("ChatScreen message:", message);
  // }, [route.params, message]);

  // tải tin nhắn ban đầu
useEffect(() => {
    const loadInitialMessages = async () => {
      if (!conversationId || !currentUserId) return;
      try {
        const response = await Api_chatInfo.searchMessages({
          conversationId,
          searchTerm: "",
          page: 1,
          limit: 20,
          userId: currentUserId,
          senderId: null,
          startDate: null,
          endDate: null,
        });
        console.log("Nhi đang tìm tin nhắn:", response);
        if (response.success) {
          setMessages(response.messages);
          setTotalMessages(response.total);
          setPage(1);
        }
      } catch (error) {
        console.error("Error loading initial messages:", error);
       
      }
    };

    loadInitialMessages();
  }, [conversationId, currentUserId]);

  useEffect(() => {
    console.log("ChatScreen route.params:", route.params);
    console.log("ChatScreen message:", message);
    console.log("ChatScreen conversationId:", conversationId);
    console.log("ChatScreen userId:", userId);
    if (!conversationId) {
      console.warn("conversationId is missing or invalid");
      Alert.alert("Lỗi", "Không tìm thấy ID cuộc trò chuyện. Vui lòng thử lại.");
      navigation.goBack();
    }
  }, [route.params, message, conversationId, userId, navigation]);



const fetchUserInfo = async (userId) => {
  if (!userId) {
    console.warn("ChatScreen: userId is undefined or null");
    return { name: "Người dùng ẩn danh", avatar: "https://picsum.photos/200" };
  }

  if (userCache[userId]) {
    console.log("ChatScreen: Lấy thông tin người dùng từ cache", { userId, userInfo: userCache[userId] });
    return userCache[userId];
  }

  try {
    const response = await Api_Profile.getProfile(userId);
    let userInfo;
    if (response?.data?.user) {
      userInfo = {
        name: `${response.data.user.firstname || ''} ${response.data.user.surname || ''}`.trim() || `Người dùng ${userId.slice(-4)}`,
        avatar: response.data.user.avatar || "https://picsum.photos/200",
      };
    } else {
      userInfo = { name: `Người dùng ${userId.slice(-4)}`, avatar: "https://picsum.photos/200" };
    }
    console.log("ChatScreen: Nhận thông tin người dùng từ API", { userId, userInfo });
    setUserCache((prev) => ({ ...prev, [userId]: userInfo }));
    return userInfo;
  } catch (error) {
    console.error("ChatScreen: Lỗi khi lấy thông tin người dùng", { userId, error });
    const userInfo = { name: `Người dùng ${userId.slice(-4)}`, avatar: "https://picsum.photos/200" };
    setUserCache((prev) => ({ ...prev, [userId]: userInfo }));
    return userInfo;
  }
};

  useEffect(() => {
  const loadUserInfos = async () => {
    const userIds = [
      ...new Set(
        messages.map((msg) => msg.userId).filter((id) => id !== currentUserId)
      ),
    ];
    console.log("ChatPage: Tải thông tin người dùng", { userIds });
    for (const userId of userIds) {
      await fetchUserInfo(userId);
    }
    if (selectedMessage?.participants) {
      const participantIds = selectedMessage.participants
        .map((p) => p.userId)
        .filter((id) => id !== currentUserId && !userCache[id]);
      for (const userId of participantIds) {
        await fetchUserInfo(userId);
      }
    }
  };

  if (messages.length > 0 || selectedMessage?.participants) {
    loadUserInfos();
  }
}, [messages, selectedMessage, currentUserId, userCache]);
  useEffect(() => {
    const fetchConversationDetails = async () => {
      if (!message || !currentUserId) {
        console.warn("Thiếu message hoặc currentUserId", { message, currentUserId });
        setConversationInfo({
          name: "Unknown",
          isGroup: false,
          participants: [],
          imageGroup: null,
        });
        return;
      }

      let name = message.name || "Unknown";
      let imageGroup = message.imageGroup || "https://picsum.photos/200";
      let participants = message.participants || [];
      let isGroup = message.isGroup || false;

      if (!isGroup && (!name || name === "Unknown")) {
        const otherParticipant = message.participants?.find(
          (p) => p.userId !== currentUserId
        );
        if (otherParticipant?.userId) {
          const userInfo = await fetchUserInfo(otherParticipant.userId);
          name = userInfo.name || `Người dùng ${otherParticipant.userId.slice(-4)}`;
          imageGroup = userInfo.avatar || imageGroup;
        }
      }

      console.log("Cập nhật conversationInfo", { name, isGroup, participants, imageGroup });
      setConversationInfo({
        name,
        isGroup,
        participants,
        imageGroup,
      });
    };

    fetchConversationDetails();
  }, [message, currentUserId]);
  // Load user info when messages change
  useEffect(() => {
    const loadUserInfos = async () => {
      const userIds = [
        ...new Set(
          messages
            .map((msg) => msg.userId)
            .filter((id) => id !== currentUserId && id)
        ),
      ];
      for (const userId of userIds) {
        await fetchUserInfo(userId);
      }
    };

    if (messages.length > 0) {
      loadUserInfos();
    }
  }, [messages, currentUserId]);

  // Initialize conversation info
  useEffect(() => {
    if (message) {
      setConversationInfo({
        name: message.name || user?.name || "",
        isGroup: message.isGroup || false,
        participants: message.participants || [],
        imageGroup: message.imageGroup || null,
      });
    }
  }, [message, user]);

  // Đồng bộ conversationInfo với chatInfoUpdate từ Redux
  useEffect(() => {
    if (chatInfoUpdate && chatInfoUpdate._id === conversationId) {
      console.log("Cập nhật conversationInfo từ chatInfoUpdate:", chatInfoUpdate);
      setConversationInfo((prev) => ({
        ...prev,
        name: chatInfoUpdate.name || prev.name,
        isGroup: chatInfoUpdate.isGroup ?? prev.isGroup,
        participants: chatInfoUpdate.participants || prev.participants,
        imageGroup: chatInfoUpdate.imageGroup || prev.imageGroup,
      }));
    }
  }, [chatInfoUpdate, conversationId]);

  // Socket.IO setup
  useEffect(() => {
    if (!socket || !selectedMessageId || !currentUserId) {
      console.warn("Socket setup skipped: missing socket, selectedMessageId, or currentUserId", {
        socket: !!socket,
        selectedMessageId,
        currentUserId,
      });
      return;
    }

    if (!socket.connected) {
      console.warn("Socket not connected, attempting to connect", { socketId: socket.id });
      socket.connect();
    }

    console.log("Joining conversation with ID:", selectedMessageId);
    joinConversation(socket, selectedMessageId);

    socket.on("loadMessages", (data) => {
      // console.log("Received loadMessages:", data);
      setMessages(data);
    });

    socket.on("receiveMessage", (newMessage) => {
      console.log("Received receiveMessage:", newMessage);
      setMessages((prev) =>
        prev.some((msg) => msg._id === newMessage._id)
          ? prev
          : [...prev, newMessage]
      );
    });

    socket.on("messageSent", (newMessage) => {
      console.log("Received messageSent:", newMessage);
      setMessages((prev) =>
        prev.some((msg) => msg._id === newMessage._id)
          ? prev
          : [...prev, newMessage]
      );
    });

    socket.on("messageRevoked", ({ messageId }) => {
      console.log("Received messageRevoked for messageId:", messageId);
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === messageId ? { ...msg, isRevoked: true } : msg
        )
      );
    });

    // socket.on("messageDeleted", ({ messageId }) => {
    //   console.log("Received messageDeleted for messageId:", messageId);
    //   setMessages((prev) => prev.filter((msg) => msg._id !== messageId));
    // });
    // Sai thì Alo Nhi, cái này Nhi làm để xóa trong kho lưu trữ nếu xóa lẻ từng hình trong mảng 
    socket.on("messageDeleted", ({ messageId, urlIndex, isMessageDeleted, deletedBy }) => {
      console.log("ChatScreen: Nhận messageDeleted", { messageId, urlIndex, isMessageDeleted, deletedBy });
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg._id === messageId) {
            if (isMessageDeleted) {
              return {
                ...msg,
                deletedBy: [...(msg.deletedBy || []), deletedBy]
              };
            } else if (urlIndex !== null && Array.isArray(msg.linkURL)) {
              const updatedLinkURL = [...msg.linkURL];
              updatedLinkURL.splice(urlIndex, 1);
              return {
                ...msg,
                linkURL: updatedLinkURL
              };
            }
          }
          return msg;
        })
      );
    });

    socket.on("deleteMessageError", (error) => {
      console.error("Delete message error:", error);
      Alert.alert("Lỗi", error.message || "Không thể xóa tin nhắn");
    });

    // Sự kiện xóa lịch sử trò chuyện
    socket.on("deleteAllChatHistory", ({ conversationId: deletedConversationId, deletedBy }) => {
      console.log("ChatScreen: Nhận deleteAllChatHistory", { deletedConversationId, deletedBy });
      if (deletedConversationId === selectedMessageId) {
        setMessages([]);
        Alert.alert("Thông báo", "Lịch sử trò chuyện đã được xóa!", [
          {
            text: "OK",
            onPress: () => {
              navigation.navigate("Main", { screen: "ChatScreen", params: { refresh: true } });
            },
          },
        ]);
      }
    });
    // Sự kiện giải tán nhóm
    socket.on("disbandGroup", ({ conversationId: disbandedConversationId }) => {
      console.log("ChatScreen: Nhận disbandGroup", { disbandedConversationId });
      if (disbandedConversationId === selectedMessageId) {
        Alert.alert("Thông báo", "Nhóm đã bị giải tán!", [
          {
            text: "OK",
            onPress: () => {
              setConversationInfo({
                name: "",
                isGroup: false,
                participants: [],
                imageGroup: null,
              });
              dispatch(setSelectedMessage(null));
              navigation.navigate("Main", { screen: "ChatScreen", params: { refresh: true } });
            },
          },
        ]);
      }
    });

    // Sự kiện rời nhóm hoặc bị xóa khỏi nhóm
    socket.on("groupLeft", ({ conversationId: leftConversationId, userId: leftUserId }) => {
      console.log("ChatScreen: Nhận groupLeft", { leftConversationId, leftUserId });
      if (leftConversationId === selectedMessageId && leftUserId === currentUserId) {
        Alert.alert("Thông báo", "Bạn đã rời khỏi nhóm hoặc bị xóa khỏi nhóm!", [
          {
            text: "OK",
            onPress: () => {
              setConversationInfo({
                name: "",
                isGroup: false,
                participants: [],
                imageGroup: null,
              });
              dispatch(setSelectedMessage(null));
              navigation.navigate("Main", { screen: "ChatScreen", params: { refresh: true } });
            },
          },
        ]);
      } else if (leftConversationId === selectedMessageId) {
        // Cập nhật danh sách thành viên nếu thành viên khác rời nhóm
        setConversationInfo((prev) => ({
          ...prev,
          participants: prev.participants.filter((p) => p.userId !== leftUserId),
        }));
        dispatch(
          setChatInfoUpdate({
            ...chatInfoUpdate,
            participants: chatInfoUpdate?.participants?.filter((p) => p.userId !== leftUserId) || [],
          })
        );
      }
    });

    // Sự kiện ẩn trò chuyện
    socket.on("chatHidden", ({ conversationId: hiddenConversationId, userId: hiddenByUserId, isHidden }) => {
      console.log("ChatScreen: Nhận chatHidden", { hiddenConversationId, hiddenByUserId, isHidden });
      if (hiddenConversationId === selectedMessageId && hiddenByUserId === currentUserId && isHidden) {
        Alert.alert("Thông báo", "Cuộc trò chuyện đã được ẩn. Vui lòng xác thực lại!", [
          {
            text: "OK",
            onPress: () => {
              dispatch(setSelectedMessage(null));
              navigation.navigate("Main", { screen: "ChatScreen", params: { refresh: true } });
            },
          },
        ]);
      }
    });


    // Sự kiện cập nhật thông tin nhóm
    onChatInfoUpdated(socket, (updatedInfo) => {
      console.log("ChatScreen: Nhận chatInfoUpdated", updatedInfo);
      if (updatedInfo._id === selectedMessageId) {
        // Kiểm tra xem người dùng có còn trong nhóm không
        if (!updatedInfo.participants?.some((p) => p.userId === currentUserId)) {
          Alert.alert("Thông báo", "Bạn đã bị xóa khỏi nhóm!", [
            {
              text: "OK",
              onPress: () => {
                setConversationInfo({
                  name: "",
                  isGroup: false,
                  participants: [],
                  imageGroup: null,
                });
                dispatch(setSelectedMessage(null));
                navigation.navigate("Main", { screen: "ChatScreen", params: { refresh: true } });
              },
            },
          ]);
          return;
        }

        // Kiểm tra xem nhóm có bị giải tán không
        if (!updatedInfo.participants || updatedInfo.participants.length === 0) {
          Alert.alert("Thông báo", "Nhóm đã bị giải tán!", [
            {
              text: "OK",
              onPress: () => {
                setConversationInfo({
                  name: "",
                  isGroup: false,
                  participants: [],
                  imageGroup: null,
                });
                dispatch(setSelectedMessage(null));
                navigation.navigate("Main", { screen: "ChatScreen", params: { refresh: true } });
              },
            },
          ]);
          return;
        }

        // Cập nhật thông tin nhóm
        setConversationInfo((prev) => ({
          ...prev,
          name: updatedInfo.name || prev.name,
          isGroup: updatedInfo.isGroup ?? prev.isGroup,
          participants: updatedInfo.participants || prev.participants,
          imageGroup: updatedInfo.imageGroup || prev.imageGroup,
        }));
        dispatch(setChatInfoUpdate(updatedInfo));
      }
    });

    onConversationUpdate(socket, (updatedConversation) => {
      console.log("ChatScreen: Received conversationUpdate:", updatedConversation);
      setConversationInfo((prev) => ({
        ...prev,
        name: updatedConversation.name || prev.name,
        lastMessage: updatedConversation.lastMessage?.content || "",
        lastMessageType: updatedConversation.lastMessage?.messageType || "text",
        lastMessageSenderId: updatedConversation.lastMessage?.userId || null,
        time: new Date(updatedConversation.updatedAt).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      }));
    });

    onChatInfoUpdated(socket, (updatedInfo) => {
      console.log("ChatScreen: Received chatInfoUpdated:", updatedInfo);
      if (updatedInfo._id === selectedMessageId) {
        setConversationInfo((prev) => ({
          ...prev,
          name: updatedInfo.name || prev.name,
          isGroup: updatedInfo.isGroup ?? prev.isGroup,
          participants: updatedInfo.participants || prev.participants,
          imageGroup: updatedInfo.imageGroup || prev.imageGroup,
        }));
        // Dispatch để cập nhật Redux
        dispatch(setChatInfoUpdate(updatedInfo));
      }
    });

    onConversationRemoved(socket, (data) => {
      console.log("ChatScreen: Received conversationRemoved:", data);
      if (data.conversationId === selectedMessageId) {
        Alert.alert("Thông báo", "Cuộc trò chuyện đã bị xóa!", [
          {
            text: "OK",
            onPress: () => {
              dispatch(setSelectedMessage(null));
              navigation.navigate("Main", { screen: "ChatScreen", params: { refresh: true } });
            },
          },
        ]);
      }
    });

    socket.on("userTyping", async ({ userId, conversationId }) => {
      console.log("User typing:", userId, conversationId);
      if (conversationId === selectedMessageId && userId !== currentUserId) {
        const userInfo = await fetchUserInfo(userId);
        setTypingUsers((prev) => {
          if (!prev.some((user) => user.userId === userId)) {
            return [...prev, { userId, name: userInfo.name }];
          }
          return prev;
        });
      }
    });

    socket.on("userStopTyping", ({ userId, conversationId }) => {
      if (conversationId === selectedMessageId) {
        setTypingUsers((prev) => prev.filter((user) => user.userId !== userId));
      }
    });

    return () => {
      console.log("Cleaning up socket listeners for ChatScreen");
      socket.off("loadMessages");
      socket.off("receiveMessage");
      socket.off("messageSent");
      socket.off("messageRevoked");
      socket.off("messageDeleted");
      socket.off("deleteMessageError");
      socket.off("deleteAllChatHistory");
      offConversationUpdate(socket);
      offChatInfoUpdated(socket);
      offGroupLeft(socket);
      onConversationRemoved(socket);
      socket.off("userTyping");
      socket.off("userStopTyping");
    };
  }, [socket, selectedMessageId, currentUserId, navigation, dispatch]);

  // Online status
  useEffect(() => {
    if (!socket) return;

    socket.emit("getOnlineUsers");
    socket.on("getOnlineUsers", (users) => {
      console.log("Received online users:", users);
      setOnlineUsers(users);
      if (receiverId) {
        setIsOnline(users.includes(receiverId));
      }
    });

    return () => {
      socket.off("getOnlineUsers");
    };
  }, [socket, receiverId]);


  useEffect(() => {
  const preloadParticipants = async () => {
    if (message?.participants) {
      const userIds = message.participants
        .map((p) => p.userId)
        .filter((id) => id !== currentUserId && !userCache[id]);
      console.log("ChatScreen: Preload thông tin người dùng cho participants", { userIds });
      for (const userId of userIds) {
        await fetchUserInfo(userId);
      }
    }
  };
  preloadParticipants();
}, [message, currentUserId, userCache]);
// Hàm khởi tạo danh sách senders
const initializeSenders = () => {
  if (message?.participants) {
    const senderList = [
      { userId: "all", name: "Tất cả" },
      ...message.participants.map((participant) => {
        const userId = participant.userId;
        return {
          userId,
          name: userId === currentUserId
            ? "Bạn"
            : userCache[userId]?.name || `Người dùng ${userId.slice(-4)}`,
        };
      }),
    ];
    console.log("ChatScreen: Khởi tạo danh sách senders", senderList);
    setSenders(senderList);

    // Preload thông tin người dùng cho participants
    const userIds = message.participants
      .map((p) => p.userId)
      .filter((id) => id !== currentUserId && !userCache[id]);
    console.log("ChatScreen: Tải thông tin người dùng cho participants", { userIds });
    userIds.forEach((userId) => fetchUserInfo(userId));
  } else {
    console.warn("ChatScreen: Không có participants để khởi tạo senders");
    setSenders([{ userId: "all", name: "Tất cả" }]);
  }
};;

// Hàm đặt lại bộ lọc
const resetFilters = () => {
    console.log("ChatScreen: Đặt lại bộ lọc");
    setFilterSender("all");
    setFilterStartDate("");
    setFilterEndDate("");
    setSearchKeyword("");
    initializeSenders();
    setIsSearchModalVisible(false);
  };

  useEffect(() => {
    initializeSenders();
  }, [message, userCache]);

useEffect(() => {
  initializeSenders();
}, [message, userCache]);
  // Hàm tìm kiếm tin nhắn trong ChatScreen
const searchMessages = async () => {
  console.log("ChatScreen: Bắt đầu tìm kiếm", {
    conversationId,
    searchTerm: searchKeyword.trim(),
    userId: currentUserId,
    filterSender,
    filterStartDate,
    filterEndDate,
  });

  if (!conversationId) {
    console.warn("ChatScreen: Thiếu conversationId");
    Alert.alert("Lỗi", "Không tìm thấy ID cuộc trò chuyện.");
    setIsSearching(false);
    return;
  }
  if (!searchKeyword.trim()) {
    console.warn("ChatScreen: Từ khóa tìm kiếm rỗng");
    Alert.alert("Lỗi", "Vui lòng nhập từ khóa tìm kiếm.");
    setIsSearching(false);
    return;
  }
  if (!currentUserId) {
    console.warn("ChatScreen: Thiếu userId");
    Alert.alert("Lỗi", "Không thể xác định người dùng hiện tại.");
    setIsSearching(false);
    return;
  }

  setIsSearching(true);
  try {
    const response = await Api_chatInfo.searchMessages({
      conversationId,
      searchTerm: searchKeyword.trim(),
      page: 1,
      limit: 20,
      userId: currentUserId,
      senderId: filterSender === "all" ? null : filterSender,
      startDate: filterStartDate || null,
      endDate: filterEndDate || null,
    });
    console.log("ChatScreen: Kết quả tìm kiếm", response);

    if (response.success) {
      const filteredMessages = response.messages.filter(
        (msg) => !msg.deletedBy?.includes(currentUserId)
      );
      setSearchResults(filteredMessages);
      setTotalResults(response.total);

      // Preload thông tin người dùng cho các userId trong kết quả tìm kiếm
      const userIds = [
        ...new Set(
          filteredMessages
            .map((msg) => {
              const userId = typeof msg.userId === 'object' && msg.userId?._id
                ? msg.userId._id
                : msg.userId;
              return userId;
            })
            .filter((id) => id && id !== currentUserId && !userCache[id])
        ),
      ];
      console.log("ChatScreen: Tải thông tin người dùng cho search results", { userIds });
      for (const userId of userIds) {
        const userInfo = await fetchUserInfo(userId);
        console.log("ChatScreen: Đã tải thông tin người dùng", { userId, userInfo });
      }

      setIsSearchModalVisible(true);
    } else {
      console.warn("ChatScreen: Tìm kiếm thất bại", response.error);
      Alert.alert("Lỗi", response.error || "Không tìm thấy tin nhắn phù hợp.");
    }
  } catch (error) {
    console.error("ChatScreen: Lỗi khi tìm kiếm", {
      message: error.message,
      response: error.response,
    });
    let errorMessage = "Không thể tìm kiếm tin nhắn. Vui lòng thử lại.";
    if (error.message.includes("Network Error")) {
      errorMessage = "Lỗi kết nối mạng. Vui lòng kiểm tra kết nối internet.";
    } else if (error.response?.error) {
      errorMessage = error.response.error;
    }
    Alert.alert("Lỗi", errorMessage);
  } finally {
    setIsSearching(false);
  }
};

// Hàm tải thêm tin nhắn khi cuộn đến cuối danh sách
  const fetchMoreMessages = async (messageId) => {
    if (isLoadingMore || messages.length >= totalMessages) return;
    setIsLoadingMore(true);

    try {
      console.log(`Fetching more messages to find messageId: ${messageId}, page: ${page + 1}`);
      const response = await Api_chatInfo.searchMessages({
        conversationId,
        searchTerm: "",
        page: page + 1,
        limit: 20,
        userId: currentUserId,
        senderId: null,
        startDate: null,
        endDate: null,
      });

      console.log("Fetch more messages response:", response);

      if (response.success && response.messages.length > 0) {
        const newMessages = response.messages.filter(
          (msg) => !msg.deletedBy?.includes(currentUserId)
        );
        setMessages((prev) => {
          const combinedMessages = [...prev, ...newMessages];
          return Array.from(new Map(combinedMessages.map((msg) => [msg._id, msg])).values());
        });
        setTotalMessages(response.total);
        setPage((prev) => prev + 1);

        const filteredMessages = [...messages, ...newMessages].filter(
          (msg) => !msg.deletedBy?.includes(currentUserId)
        );
        const newIndex = filteredMessages.findIndex((msg) => msg._id === messageId);

        if (newIndex !== -1) {
          setTimeout(() => {
            flatListRef.current?.scrollToIndex({ index: newIndex, animated: true });
            setHighlightedMessageId(messageId);
            setIsSearchModalVisible(false);
            setSearchKeyword("");
            setTimeout(() => setHighlightedMessageId(null), 3000);
          }, 100);
        } else if (messages.length + newMessages.length < response.total) {
          await fetchMoreMessages(messageId);
        } else {
          Alert.alert("Lỗi", "Không tìm thấy tin nhắn.");
        }
      } else {
        Alert.alert("Lỗi", "Không thể tải thêm tin nhắn.");
      }
    } catch (error) {
      console.error("Error fetching more messages:", error);
      Alert.alert("Lỗi", "Không thể tải thêm tin nhắn. Vui lòng thử lại.");
    } finally {
      setIsLoadingMore(false);
    }
  };
  // Cuộn đến tin nhắn được chọn
const scrollToMessage = async (messageId) => {
    const filteredMessages = messages.filter(
      (msg) => !msg.deletedBy?.includes(currentUserId)
    );
    const index = filteredMessages.findIndex((msg) => msg._id === messageId);
    console.log(`scrollToMessage: Finding message with ID ${messageId}, index: ${index}, filtered messages length: ${filteredMessages.length}`);

    if (index === -1) {
      console.warn(`Tin nhắn với ID ${messageId} không tìm thấy trong danh sách hiện tại`);
      Alert.alert("Thông báo", "Tin nhắn không tìm thấy. Đang tải thêm tin nhắn...");
      await fetchMoreMessages(messageId);
      return;
    }

    try {
      flatListRef.current?.scrollToIndex({ index, animated: true });
      setHighlightedMessageId(messageId);
      setIsSearchModalVisible(false);
      setSearchKeyword("");
      setTimeout(() => setHighlightedMessageId(null), 3000);
    } catch (error) {
      console.error("Error scrolling to index:", error);
      Alert.alert("Lỗi", "Không thể cuộn đến tin nhắn. Vui lòng thử lại.");
    }
  };

 const renderSearchResult = ({ item }) => {
  const messageUserId = typeof item.userId === 'object' && item.userId?._id
    ? item.userId._id
    : item.userId;
  const senderName = messageUserId === currentUserId
    ? "Bạn"
    : userCache[messageUserId]?.name || `Người dùng ${messageUserId?.slice(-4) || 'ẩn danh'}`;

  console.log("ChatScreen: Render search result", {
    msgId: item._id,
    messageUserId,
    senderName,
    isCurrentUser: messageUserId === currentUserId,
    userCacheKeys: Object.keys(userCache),
  });

  return (
    <TouchableOpacity
      style={styles.searchResultItem}
      onPress={() => scrollToMessage(item._id)}
    >
      <Text style={styles.searchResultSender}>{senderName}</Text>
      <Text style={styles.searchResultContent} numberOfLines={2}>
        {item.content}
      </Text>
      <Text style={styles.searchResultTime}>
        {new Date(item.createdAt).toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </Text>
    </TouchableOpacity>
  );
};


  const sendMessage = (payload) => {
    if (!payload.content && !payload.linkURL) return;

    const socketPayload = {
      conversationId: selectedMessageId,
      message: {
        content: payload.content,
        messageType: payload.messageType,
        ...(payload.linkURL && { linkURL: payload.linkURL }),
        ...(payload.replyMessageId && {
          replyMessageId: payload.replyMessageId,
        }),
      },
    };

    socket.emit("sendMessage", socketPayload);
  };

  const handleLongPress = (msg) => {
    if (msg.isRevoked) return;
    console.log("Selected message:", msg);
    setSelectedMessage(msg);
    setShowOptions(true);
  };

  const handleReply = () => {
    setReplyingTo(selectedMessage);
    setShowOptions(false);
  };

  const handleRevoke = () => {
    Alert.alert("Thu hồi tin nhắn", "Bạn có chắc muốn thu hồi tin nhắn này?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Thu hồi",
        style: "destructive",
        onPress: () => {
          socket.emit("messageRevoked", {
            messageId: selectedMessage._id,
            conversationId: selectedMessageId,
          });
          setMessages((prev) =>
            prev.map((msg) =>
              msg._id === selectedMessage._id
                ? { ...msg, isRevoked: true }
                : msg
            )
          );
          setShowOptions(false);
        },
      },
    ]);
  };

  const handleDelete = () => {
    if (!socket?.connected) {
      console.warn("Socket is not connected");
      Alert.alert("Lỗi", "Không thể kết nối đến server");
      return;
    }
    Alert.alert(
      "Xóa tin nhắn",
      "Bạn có chắc muốn xóa tin nhắn này? Nếu muốn xóa cả hai bên thì hãy nhấn vào nút thu hồi.",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: () => {
            console.log(
              "Sending messageDeleted event for messageId:",
              selectedMessage._id
            );
            socket.emit("messageDeleted", {
              messageId: selectedMessage._id,
              conversationId: selectedMessageId,
            });
            setMessages((prev) =>
              prev.filter((msg) => msg._id !== selectedMessage._id)
            );
            setShowOptions(false);
          },
        },
      ]
    );
  };

  const handleForward = () => {
    if (!selectedMessage?._id) {
      Alert.alert("Lỗi", "Không thể chuyển tiếp: Tin nhắn không hợp lệ.");
      return;
    }
    setMessageToForward(selectedMessage);
    setIsShareModalVisible(true);
    setShowOptions(false);
    console.log("Mở ShareModal để chuyển tiếp:", selectedMessage);
  };

  const handleShare = (selectedConversations, content) => {
    if (selectedConversations.length === 0) {
      Alert.alert(
        "Lỗi",
        "Vui lòng chọn ít nhất một cuộc trò chuyện để chia sẻ."
      );
      return;
    }
    console.log(
      "Chuyển tiếp tin nhắn đến:",
      selectedConversations,
      "với ghi chú:",
      content
    );
  };

  const formatTime = (createdAt) => {
    return new Date(createdAt).toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDateSeparator = (dateString) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };


  // Add markMessageAsRead function
  const markMessageAsRead = (messageId) => {
    console.log('Marking message as read:', {
      messageId,
      selectedMessageId,
      currentUserId,
      socket: !!socket
    });

    if (!socket || !selectedMessageId || !messageId) {
      console.log('Cannot mark as read - missing required data');
      return;
    }

    // Find the message
    const msg = messages.find((m) => m._id === messageId);
    if (!msg) {
      console.log('Message not found');
      return;
    }

    console.log('Message found:', {
      userId: msg.userId,
      currentUserId,
      readBy: msg.status?.readBy
    });

    // Only mark as read if the message is not from the current user and not already read
    if (
      msg.userId !== currentUserId &&
      (!msg.status?.readBy || !msg.status.readBy.includes(currentUserId))
    ) {
      console.log('Emitting readMessage event');
      socket.emit("readMessage", {
        conversationId: selectedMessageId,
        messageId,
        userId: currentUserId,
      });
    } else {
      console.log('Message already read or from current user');
    }
  };

  // Add socket listener for message read status
  useEffect(() => {
    if (!socket || !selectedMessageId) return;

    const handleMessageRead = ({ messageId, userId, readBy }) => {
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg._id === messageId
            ? {
              ...msg,
              status: {
                ...msg.status,
                readBy: readBy,
              },
            }
            : msg
        )
      );
    };

    socket.on("messageRead", handleMessageRead);

    return () => {
      socket.off("messageRead", handleMessageRead);
    };
  }, [socket, selectedMessageId]);

  // Auto mark last message as read if it's from another user
  useEffect(() => {
    if (messages.length > 0 && selectedMessageId && socket && currentUserId) {
      const filteredMessages = messages.filter(
        (msg) =>
          msg.conversationId === selectedMessageId &&
          !msg.deletedBy?.includes(currentUserId)
      );

      if (filteredMessages.length > 0) {
        const lastMsg = filteredMessages[filteredMessages.length - 1];
        console.log('Checking last message for read status:', {
          messageId: lastMsg._id,
          senderId: lastMsg.userId,
          currentUserId,
          status: lastMsg.status
        });

        if (
          lastMsg.userId !== currentUserId &&
          (!lastMsg.status?.readBy || !lastMsg.status.readBy.includes(currentUserId))
        ) {
          console.log('Marking last message as read');
          markMessageAsRead(lastMsg._id);
        }
      }
    }
  }, [messages, selectedMessageId, socket, currentUserId]);

const renderItem = ({ item, index }) => {
    const filteredMessages = messages.filter(
      (msg) => !msg.deletedBy?.includes(currentUserId)
    );
    const currentDate = formatDateSeparator(item.createdAt);
    const prevMessage = index > 0 ? filteredMessages[index - 1] : null; // là tin nhắn trước đó
    const prevDate = prevMessage ? formatDateSeparator(prevMessage.createdAt) : null;
    const showDateSeparator = index === 0 || currentDate !== prevDate;
    const isLastMessage = index === filteredMessages.length - 1;

    return (
      <>
        {showDateSeparator && (
          <View style={styles.dateSeparatorContainer}>
            <Text style={styles.dateSeparatorText}>{currentDate}</Text>
          </View>
        )}
        <MessageItem
          key={item._id}
          msg={{
            ...item,
            sender:
              item.userId === currentUserId
                ? "Bạn"
                : userCache[item.userId]?.name || "Người dùng ẩn danh",
            time: formatTime(item.createdAt),
            messageType: item.messageType || "text",
            content: item.content || "",
            linkURL: item.linkURL || [],
            userId: item.userId,
            status: item.status || { readBy: [] }
          }}
          currentUserId={currentUserId}
          messages={filteredMessages}
          onLongPress={handleLongPress}
          markMessageAsRead={markMessageAsRead}
          participants={message?.participants || []}
          userCache={userCache}
          isLastMessage={isLastMessage}
          highlightedMessageId={highlightedMessageId}
        />
      </>
    );
  };
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={60}
    >
      <View style={styles.headerContainer}>
        <View style={styles.leftContainer}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back-outline" size={28} color="#fff" />
          </TouchableOpacity>
          <View style={styles.nameContainer}>
            {/* <Text style={styles.headerText}>
              {message?.isGroup 
                ? (message.name || conversationInfo.name || "Nhóm chat")
                : (message?.participants?.find(p => p.userId !== currentUserId)?.name 
                  || userCache[message?.participants?.find(p => p.userId !== currentUserId)?.userId]?.name 
                  || "Cuộc trò chuyện")}
            </Text> */}
            <Text style={styles.headerText}>
              {conversationInfo.name || "Cuộc trò chuyện"}
            </Text>
            <View style={styles.statusContainer}>
              {isGroupChat ? (
                <Text style={styles.statusText}>{memberCount} thành viên</Text>
              ) : (
                <>
                  <Text style={styles.statusText}>
                    {isOnline ? "Đang hoạt động " : "Đang offline "}
                  </Text>
                  <View
                    style={[
                      styles.statusDot,
                      { backgroundColor: isOnline ? "#4CAF50" : "#9E9E9E" },
                    ]}
                  />
                </>
              )}
            </View>
          </View>
        </View>
        <View style={styles.rightContainer}>
          <TouchableOpacity
            onPress={() => console.log("Call")}
            style={{ marginLeft: 15 }}
          >
            <Ionicons name="call-outline" size={28} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => console.log("Video Call")}
            style={{ marginLeft: 15 }}
          >
            <Ionicons name="videocam-outline" size={28} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              console.log("Navigating to ChatInfo with:", {
                userId,
                conversationId,
                socket,
              });
              if (!userId || !conversationId || !socket) {
                console.warn(
                  "Cannot navigate to ChatInfo: missing userId or conversationId"
                );
                Alert.alert(
                  "Lỗi",
                  "Không thể mở thông tin chat do thiếu userId hoặc conversationId."
                );
                return;
              }
              navigation.push("ChatInfo", { userId, conversationId, socket });
            }}
            style={{ marginLeft: 15 }}
          >
            <Ionicons name="menu-outline" size={28} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm kiếm tin nhắn..."
          value={searchKeyword}
          onChangeText={setSearchKeyword}
          onSubmitEditing={searchMessages}
        />
        <TouchableOpacity onPress={searchMessages} disabled={isSearching}>
          <Ionicons
            name="search"
            size={24}
            color={isSearching || !searchKeyword.trim() ? "#ccc" : "#0196fc"}
          />
        </TouchableOpacity>
      </View>
     <FlatList
        ref={flatListRef}
        data={messages.filter((msg) => !msg.deletedBy?.includes(currentUserId))}
        renderItem={renderItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ padding: 10 }}
        onContentSizeChange={() =>
          flatListRef.current?.scrollToEnd({ animated: true })
        }
        getItemLayout={(data, index) => ({
          length: 100,
          offset: 100 * index,
          index,
        })}
        initialNumToRender={20}
        maxToRenderPerBatch={20}
        windowSize={21}
        extraData={highlightedMessageId} // Thêm extraData
        ListFooterComponent={
          isLoadingMore ? (
            <ActivityIndicator size="small" color="#0196fc" style={{ padding: 10 }} />
          ) : null
        }
      />
      {typingUsers.length > 0 && (
        <View style={{ padding: 10 }}>
          <Text style={{ fontSize: 14, color: "#555" }}>
            {typingUsers.map((user) => user.name).join(", ")} đang gõ...
          </Text>
        </View>
      )}
      <ChatFooter
        sendMessage={sendMessage}
        replyingTo={replyingTo}
        setReplyingTo={setReplyingTo}
        conversationId={selectedMessageId}
      />
      {/* Modal hiển thị kết quả tìm kiếm */}
      <Modal
  visible={isSearchModalVisible}
  animationType="slide"
  onRequestClose={() => setIsSearchModalVisible(false)}
>
  <View style={styles.searchModalContainer}>
    <View style={styles.searchModalHeader}>
      <TouchableOpacity onPress={() => setIsSearchModalVisible(false)}>
        <Ionicons name="close" size={28} color="#000" />
      </TouchableOpacity>
      <Text style={styles.searchModalTitle}>
        Kết quả tìm kiếm ({totalResults})
      </Text>
    </View>
    <View style={styles.filterContainer}>
      <Text style={styles.filterLabel}>Người gửi</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={filterSender}
          onValueChange={(itemValue) => setFilterSender(itemValue)}
          style={styles.picker}
        >
          {senders.map((sender) => (
            <Picker.Item
              key={sender.userId}
              label={sender.name}
              value={sender.userId}
            />
          ))}
        </Picker>
      </View>
      <View style={styles.dateContainer}>
        <View style={styles.dateInput}>
          <Text style={styles.filterLabel}>Từ ngày</Text>
          <TextInput
            style={styles.dateInputField}
            value={filterStartDate}
            onChangeText={setFilterStartDate}
            placeholder="Chọn ngày"
          />
        </View>
        <View style={styles.dateInput}>
          <Text style={styles.filterLabel}>Đến ngày</Text>
          <TextInput
            style={styles.dateInputField}
            value={filterEndDate}
            onChangeText={setFilterEndDate}
            placeholder="Chọn ngày"
          />
        </View>
      </View>
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.applyButton}
          onPress={searchMessages}
          disabled={isSearching}
        >
          <Text style={styles.applyButtonText}>Áp dụng bộ lọc</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.resetButton}
          onPress={resetFilters}
        >
          <Text style={styles.resetButtonText}>Xóa bộ lọc</Text>
        </TouchableOpacity>
      </View>
    </View>
    {isSearching ? (
      <ActivityIndicator size="large" color="#0196fc" />
    ) : searchResults.length === 0 ? (
      <Text style={styles.noResultsText}>Không tìm thấy tin nhắn</Text>
    ) : (
      <FlatList
        data={searchResults}
        renderItem={renderSearchResult}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ padding: 10 }}
      />
    )}
  </View>
</Modal>
      <Modal visible={showOptions} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setShowOptions(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.optionBox}>
              <TouchableOpacity onPress={handleReply}>
                <Text style={styles.optionText}>Trả lời</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleForward}>
                <Text style={styles.optionText}>Chuyển tiếp</Text>
              </TouchableOpacity>
              {selectedMessage?.userId === currentUserId && (
                <>
                  <TouchableOpacity onPress={handleDelete}>
                    <Text style={styles.optionText}>Xóa</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleRevoke}>
                    <Text style={styles.optionText}>Thu hồi</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
      <ShareModal
        isOpen={isShareModalVisible}
        onClose={() => {
          setIsShareModalVisible(false);
          setMessageToForward(null);
          console.log("Đóng ShareModal");
        }}
        onShare={handleShare}
        messageToForward={messageToForward}
        userId={currentUserId}
        messageId={messageToForward?._id}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9f9f9" },
  headerContainer: {
    backgroundColor: "#0196fc",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    height: 60,
    paddingHorizontal: 16,
   
  },
  leftContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  nameContainer: {
    marginLeft: 12,
    width: "50%",
  },
  headerText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  statusText: {
    fontSize: 12,
    color: "#fff",
    opacity: 0.8,
  },
  rightContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  dateSeparatorContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginVertical: 16,
  },
  dateSeparatorText: {
    backgroundColor: "#e5e7eb",
    color: "#6b7280",
    fontSize: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  optionBox: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 8,
    width: 200,
  },
  optionText: {
    fontSize: 16,
    paddingVertical: 8,
    textAlign: "center",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  searchInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 20,
    paddingHorizontal: 15,
    marginRight: 10,
  },
  searchModalContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  searchModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  searchModalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 20,
    flex: 1, // Để chiếm không gian còn lại
  },
  searchResultItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  searchResultSender: {
    fontWeight: "bold",
    fontSize: 14,
  },
  searchResultContent: {
    fontSize: 14,
    color: "#333",
    marginVertical: 5,
  },
  searchResultTime: {
    fontSize: 12,
    color: "#666",
  },
  noResultsText: {
    textAlign: "center",
    marginTop: 20,
    fontSize: 16,
    color: "#666",
  },
  filterContainer: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 5,
    color: "#333",
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    marginBottom: 10,
  },
  picker: {
    height: 40,
  },
  dateContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  dateInput: {
    flex: 1,
    marginRight: 5,
  },
  dateInputField: {
    height: 40,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    paddingHorizontal: 10,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  applyButton: {
    flex: 1,
    backgroundColor: "#0196fc",
    padding: 10,
    borderRadius: 5,
    marginRight: 5,
  },
  applyButtonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
  },
  resetButton: {
    flex: 1,
    backgroundColor: "#ccc",
    padding: 10,
    borderRadius: 5,
    marginLeft: 5,
  },
  resetButtonText: {
    color: "#333",
    textAlign: "center",
    fontWeight: "bold",
  },
});

export default ChatScreen;