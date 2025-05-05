// // MemberListModal.tsx
// import React, { useState, useEffect } from 'react';
// import {
//   View,
//   Text,
//   FlatList,
//   Image,
//   TouchableOpacity,
//   StyleSheet,
//   ActivityIndicator,
//   Alert,
// } from 'react-native';
// import Modal from 'react-native-modal';
// import { Ionicons } from '@expo/vector-icons';
// import { Api_Profile } from '../../../../../apis/api_profile';
// import { Api_chatInfo } from '../../../../../apis/Api_chatInfo';

// interface Participant {
//   userId: string;
//   role?: 'admin' | 'member';
//   isHidden?: boolean;
//   isPinned?: boolean;
//   muted?: string
// }

// interface ChatInfoData {
//   _id: string;
//   isGroup: boolean;
//   participants: Participant[];
// }

// interface MemberDetails {
//   [userId: string]: {
//     name: string;
//     avatar: string | null;
//     role?: 'admin' | 'member';
//   };
// }

// interface Props {
//   isOpen: boolean;
//   onClose: () => void;
//   chatInfo: ChatInfoData;
//   currentUserId: string;
//   onMemberRemoved?: (memberId: string) => void;
// }

// const MemberListModal: React.FC<Props> = ({
//   isOpen,
//   onClose,
//   chatInfo,
//   currentUserId,
//   onMemberRemoved,
// }) => {
//   console.log('MemberListModal received chatInfo:', chatInfo); // LOGGING
//   const [memberDetails, setMemberDetails] = useState<MemberDetails>({});
//   const [loadingDetails, setLoadingDetails] = useState(true);
//   const [errorDetails, setErrorDetails] = useState<string | null>(null);
//   const [isAdmin, setIsAdmin] = useState(false);

//   useEffect(() => {
//     const checkAdminStatus = () => {
//       if (chatInfo?.participants && currentUserId) {
//         const adminMember = chatInfo.participants.find(
//           (member) => member.userId === currentUserId && member.role === 'admin'
//         );
//         setIsAdmin(!!adminMember);
//       } else {
//         setIsAdmin(false);
//       }
//     };
//     checkAdminStatus();
//   }, [chatInfo, currentUserId]);

//   useEffect(() => {
//     const fetchMemberDetails = async () => {
//       if (!chatInfo?.participants) {
//         setErrorDetails('Không có thông tin thành viên.');
//         setLoadingDetails(false);
//         return;
//       }

//       setLoadingDetails(true);
//       setErrorDetails(null);
//       const details: MemberDetails = {};

//       try {
//         const fetchPromises = chatInfo.participants.map(async (member) => {
//           try {
//             const response = await Api_Profile.getProfile(member.userId);
//             if (response?.data?.user) {
//               details[member.userId] = {
//                 name: `${response.data.user.firstname} ${response.data.user.surname}`.trim() || 'Không tên',
//                 avatar: response.data.user.avatar || null,
//                 role: member.role,
//               };
//             } else {
//               details[member.userId] = {
//                 name: 'Không tìm thấy',
//                 avatar: null,
//                 role: member.role,
//               };
//             }
//           } catch (error) {
//             console.error(`Lỗi khi lấy thông tin người dùng ${member.userId}:`, error);
//             details[member.userId] = {
//               name: 'Lỗi tải',
//               avatar: null,
//               role: member.role,
//             };
//           }
//         });

//         await Promise.all(fetchPromises);
//         setMemberDetails(details);
//         setLoadingDetails(false);
//       } catch (error) {
//         console.error('Lỗi khi lấy danh sách thành viên:', error);
//         setErrorDetails('Không thể tải thông tin thành viên. Vui lòng thử lại.');
//         setLoadingDetails(false);
//       }
//     };

//     if (isOpen && chatInfo) {
//       fetchMemberDetails();
//     } else {
//       setMemberDetails({});
//       setLoadingDetails(true);
//       setErrorDetails(null);
//     }
//   }, [isOpen, chatInfo]);

//   const handleRemoveMember = async (memberIdToRemove: string) => {
//     if (!isAdmin) {
//       Alert.alert('Lỗi', 'Bạn không có quyền xóa thành viên khỏi nhóm này.');
//       return;
//     }

//     if (currentUserId === memberIdToRemove) {
//       Alert.alert(
//         'Lỗi',
//         'Bạn không thể tự xóa mình khỏi đây. Hãy rời nhóm từ trang thông tin nhóm.'
//       );
//       return;
//     }

//     Alert.alert(
//       'Xác nhận',
//       'Bạn có chắc chắn muốn xóa thành viên này khỏi nhóm?',
//       [
//         { text: 'Hủy', style: 'cancel' },
//         {
//           text: 'Xóa',
//           style: 'destructive',
//           onPress: async () => {
//             try {
//               const response = await Api_chatInfo.removeParticipant(chatInfo._id, { userId: memberIdToRemove });
//               console.log('Remove member response:', response);
//               if (onMemberRemoved) {
//                 onMemberRemoved(memberIdToRemove);
//               }
//               setMemberDetails((prev) => {
//                 const newDetails = { ...prev };
//                 delete newDetails[memberIdToRemove];
//                 return newDetails;
//               });
//               Alert.alert('Thành công', 'Đã xóa thành viên khỏi nhóm.');
//             } catch (error) {
//               console.error('Lỗi khi xóa thành viên:', error);
//               Alert.alert('Lỗi', 'Không thể xóa thành viên. Vui lòng thử lại.');
//             }
//           },
//         },
//       ],
//       { cancelable: true }
//     );
//   };

//   // Loại bỏ việc lọc visibleParticipants dựa trên isHidden
//   const participantsToShow = chatInfo?.participants || [];
//   console.log('MemberListModal participantsToShow:', participantsToShow); // LOGGING

//   if (!chatInfo?.participants) {
//     return null;
//   }

//   return (
//     <Modal isVisible={isOpen} onBackdropPress={onClose} style={styles.modal}>
//       <View style={styles.modalContainer}>
//         <Text style={styles.modalTitle}>
//           Thành viên ({participantsToShow.length || 0})
//         </Text>

//         {loadingDetails ? (
//           <View style={styles.loadingContainer}>
//             <ActivityIndicator size="large" color="#1e90ff" />
//             <Text style={styles.loadingText}>Đang tải thông tin thành viên...</Text>
//           </View>
//         ) : errorDetails ? (
//           <Text style={styles.errorText}>{errorDetails}</Text>
//         ) : (
//           <FlatList
//             data={participantsToShow}
//             keyExtractor={(item) => item.userId}
//             renderItem={({ item }) => (
//               <View style={styles.memberItem}>
//                 <View style={styles.memberInfo}>
//                   <Image
//                     source={{
//                       uri:
//                         memberDetails[item.userId]?.avatar ||
//                         'https://via.placeholder.com/40',
//                     }}
//                     style={styles.avatar}
//                   />
//                   <View style={styles.nameAndRole}>
//                     <Text style={styles.memberName}>
//                       {memberDetails[item.userId]?.name || 'Không tên'}
//                     </Text>
//                     {memberDetails[item.userId]?.role === 'admin' && (
//                       <Text style={styles.adminLabel}>Admin</Text>
//                     )}
//                   </View>
//                 </View>
//                 {isAdmin && currentUserId !== item.userId && (
//                   <TouchableOpacity
//                     onPress={() => handleRemoveMember(item.userId)}
//                     style={styles.removeButton}
//                   >
//                     <Ionicons name="trash-outline" size={20} color="#ff0000" />
//                   </TouchableOpacity>
//                 )}
//               </View>
//             )}
//             style={styles.list}
//           />
//         )}

//         <TouchableOpacity style={styles.closeButton} onPress={onClose}>
//           <Text style={styles.closeButtonText}>Đóng</Text>
//         </TouchableOpacity>
//       </View>
//     </Modal>
//   );
// };

// const styles = StyleSheet.create({
//   modal: {
//     justifyContent: 'center',
//     margin: 20,
//   },
//   modalContainer: {
//     backgroundColor: '#fff',
//     padding: 15,
//     borderRadius: 10,
//     maxHeight: '80%',
//   },
//   modalTitle: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     marginBottom: 10,
//     color: '#333',
//   },
//   list: {
//     maxHeight: 300,
//   },
//   memberItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     paddingVertical: 8,
//     borderBottomWidth: 1,
//     borderBottomColor: '#ddd',
//   },
//   memberInfo: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   avatar: {
//     width: 40,
//     height: 40,
//     borderRadius: 20,
//     marginRight: 12,
//   },
//   nameAndRole: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   memberName: {
//     fontSize: 14,
//     color: '#333',
//     marginRight: 5, // Thêm khoảng cách với chữ Admin
//   },
//   adminLabel: {
//     fontSize: 12,
//     color: '#1e90ff', // Màu xanh
//   },
//   removeButton: {
//     padding: 8,
//   },
//   loadingContainer: {
//     alignItems: 'center',
//     paddingVertical: 20,
//   },
//   loadingText: {
//     marginTop: 10,
//     color: '#666',
//     fontSize: 14,
//   },
//   errorText: {
//     color: '#ff0000',
//     fontSize: 14,
//     textAlign: 'center',
//     paddingVertical: 20,
//   },
//   closeButton: {
//     backgroundColor: '#1e90ff',
//     paddingVertical: 10,
//     borderRadius: 5,
//     alignItems: 'center',
//     marginTop: 10,
//   },
//   closeButtonText: {
//     color: '#fff',
//     fontSize: 16,
//   },
// });

// export default MemberListModal;

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Modal from 'react-native-modal';
import { Ionicons } from '@expo/vector-icons';
import { Api_Profile } from '../../../../../apis/api_profile';
import { Api_chatInfo } from '../../../../../apis/Api_chatInfo';
import CommonGroupsModal from './CommonGroupsModal';

interface Participant {
  userId: string;
  role?: 'admin' | 'member';
  isHidden?: boolean;
  isPinned?: boolean;
  muted?: string;
}

interface ChatInfoData {
  _id: string;
  isGroup: boolean;
  participants: Participant[];
}

interface MemberDetails {
  [userId: string]: {
    name: string;
    avatar: string | null;
    role?: 'admin' | 'member';
  };
}

interface CommonGroup {
  _id: string;
  name: string;
  imageGroup?: string;
  participants: Participant[];
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  chatInfo: ChatInfoData;
  currentUserId: string;
  onMemberRemoved?: (memberId: string) => void;
  commonGroups?: CommonGroup[];
  onGroupSelect?: (group: CommonGroup) => void;
}

const MemberListModal: React.FC<Props> = ({
  isOpen,
  onClose,
  chatInfo,
  currentUserId,
  onMemberRemoved,
  commonGroups = [],
  onGroupSelect,
}) => {
  console.log('MemberListModal received props:', { chatInfo, commonGroups }); // LOGGING
  const [memberDetails, setMemberDetails] = useState<MemberDetails>({});
  const [loadingDetails, setLoadingDetails] = useState(true);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isGroupModalOpen, setGroupModalOpen] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

  useEffect(() => {
    const checkAdminStatus = () => {
      if (chatInfo?.participants && currentUserId) {
        const adminMember = chatInfo.participants.find(
          (member) => member.userId === currentUserId && member.role === 'admin'
        );
        setIsAdmin(!!adminMember);
      } else {
        setIsAdmin(false);
      }
    };
    checkAdminStatus();
  }, [chatInfo, currentUserId]);

  useEffect(() => {
    const fetchMemberDetails = async () => {
      if (!chatInfo?.participants) {
        setErrorDetails('Không có thông tin thành viên.');
        setLoadingDetails(false);
        return;
      }

      setLoadingDetails(true);
      setErrorDetails(null);
      const details: MemberDetails = {};

      try {
        const fetchPromises = chatInfo.participants.map(async (member) => {
          try {
            const response = await Api_Profile.getProfile(member.userId);
            if (response?.data?.user) {
              details[member.userId] = {
                name: `${response.data.user.firstname} ${response.data.user.surname}`.trim() || 'Không tên',
                avatar: response.data.user.avatar || null,
                role: member.role,
              };
            } else {
              details[member.userId] = {
                name: 'Không tìm thấy',
                avatar: null,
                role: member.role,
              };
            }
          } catch (error) {
            console.error(`Lỗi khi lấy thông tin người dùng ${member.userId}:`, error);
            details[member.userId] = {
              name: 'Lỗi tải',
              avatar: null,
              role: member.role,
            };
          }
        });

        await Promise.all(fetchPromises);
        setMemberDetails(details);
        setLoadingDetails(false);
      } catch (error) {
        console.error('Lỗi khi lấy danh sách thành viên:', error);
        setErrorDetails('Không thể tải thông tin thành viên. Vui lòng thử lại.');
        setLoadingDetails(false);
      }
    };

    if (isOpen && chatInfo) {
      fetchMemberDetails();
    } else {
      setMemberDetails({});
      setLoadingDetails(true);
      setErrorDetails(null);
    }
  }, [isOpen, chatInfo]);

  const handleRemoveMember = async (memberIdToRemove: string) => {
    if (!isAdmin) {
      Alert.alert('Lỗi', 'Bạn không có quyền xóa thành viên khỏi nhóm này.');
      return;
    }

    if (currentUserId === memberIdToRemove) {
      Alert.alert(
        'Lỗi',
        'Bạn không thể tự xóa mình khỏi đây. Hãy rời nhóm từ trang thông tin nhóm.'
      );
      return;
    }

    Alert.alert(
      'Xác nhận',
      'Bạn có chắc chắn muốn xóa thành viên này khỏi nhóm?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await Api_chatInfo.removeParticipant(chatInfo._id, { userId: memberIdToRemove });
              console.log('Remove member response:', response);
              if (onMemberRemoved) {
                onMemberRemoved(memberIdToRemove);
              }
              setMemberDetails((prev) => {
                const newDetails = { ...prev };
                delete newDetails[memberIdToRemove];
                return newDetails;
              });
              Alert.alert('Thành công', 'Đã xóa thành viên khỏi nhóm.');
            } catch (error) {
              console.error('Lỗi khi xóa thành viên:', error);
              Alert.alert('Lỗi', 'Không thể xóa thành viên. Vui lòng thử lại.');
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const handleShowCommonGroups = (memberId: string) => {
    if (!commonGroups.length) {
      Alert.alert('Thông báo', 'Không có nhóm chung nào với thành viên này.');
      return;
    }

    // Lọc các nhóm chung có thành viên được chọn
    const filteredGroups = commonGroups.filter((group) =>
      group.participants.some((p) => p.userId === memberId)
    );

    if (!filteredGroups.length) {
      Alert.alert('Thông báo', 'Không có nhóm chung nào với thành viên này.');
      return;
    }

    setSelectedMemberId(memberId);
    setGroupModalOpen(true);
  };

  const participantsToShow = chatInfo?.participants || [];
  console.log('MemberListModal participantsToShow:', participantsToShow); // LOGGING

  if (!chatInfo?.participants) {
    return null;
  }

  return (
    <>
      <Modal isVisible={isOpen} onBackdropPress={onClose} style={styles.modal}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>
            Thành viên ({participantsToShow.length || 0})
          </Text>

          {loadingDetails ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#1e90ff" />
              <Text style={styles.loadingText}>Đang tải thông tin thành viên...</Text>
            </View>
          ) : errorDetails ? (
            <Text style={styles.errorText}>{errorDetails}</Text>
          ) : (
            <FlatList
              data={participantsToShow}
              keyExtractor={(item) => item.userId}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.memberItem}
                  onPress={() => handleShowCommonGroups(item.userId)}
                >
                  <View style={styles.memberInfo}>
                    <Image
                      source={{
                        uri:
                          memberDetails[item.userId]?.avatar ||
                          'https://via.placeholder.com/40',
                      }}
                      style={styles.avatar}
                    />
                    <View style={styles.nameAndRole}>
                      <Text style={styles.memberName}>
                        {memberDetails[item.userId]?.name || 'Không tên'}
                      </Text>
                      {memberDetails[item.userId]?.role === 'admin' && (
                        <Text style={styles.adminLabel}>Admin</Text>
                      )}
                    </View>
                  </View>
                  {isAdmin && currentUserId !== item.userId && (
                    <TouchableOpacity
                      onPress={() => handleRemoveMember(item.userId)}
                      style={styles.removeButton}
                    >
                      <Ionicons name="trash-outline" size={20} color="#ff0000" />
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>
              )}
              style={styles.list}
            />
          )}

          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Đóng</Text>
          </TouchableOpacity>
        </View>
      </Modal>
      <CommonGroupsModal
        isOpen={isGroupModalOpen}
        onClose={() => setGroupModalOpen(false)}
        commonGroups={
          selectedMemberId
            ? commonGroups.filter((group) =>
                group.participants.some((p) => p.userId === selectedMemberId)
              )
            : []
        }
        onGroupSelect={onGroupSelect}
      />
    </>
  );
};

const styles = StyleSheet.create({
  modal: {
    justifyContent: 'center',
    margin: 20,
  },
  modalContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  list: {
    maxHeight: 300,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  nameAndRole: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberName: {
    fontSize: 14,
    color: '#333',
    marginRight: 5,
  },
  adminLabel: {
    fontSize: 12,
    color: '#1e90ff',
  },
  removeButton: {
    padding: 8,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 14,
  },
  errorText: {
    color: '#ff0000',
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 20,
  },
  closeButton: {
    backgroundColor: '#1e90ff',
    paddingVertical: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 10,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
  },
});

export default MemberListModal;