import React, { useState, useEffect, useCallback } from 'react';
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
import { Api_Conversation } from '../../../../../apis/api_conversation';
import { useDispatch } from 'react-redux';
import { setSelectedMessage } from '../../../../../redux/slices/chatSlice';
import { useNavigation } from '@react-navigation/native';
import { removeParticipant, onError } from '../../../../../services/sockets/events/chatInfo';

// Define TypeScript interfaces for better type safety
interface Participant {
    userId: string;
    role?: 'admin' | 'member';
}

interface ChatInfoData {
    _id: string;
    isGroup: boolean;
    participants: Participant[];
}

interface MemberDetails {
    [userId: string]: {
        name: string;
        avatar: string;
        role?: 'admin' | 'member';
    };
}

interface SocketResponse {
    success?: boolean;
    message?: string | { message: string };
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    chatInfo: ChatInfoData;
    currentUserId: string;
    onMemberRemoved?: (memberId: string) => void;
    socket: any; // Replace 'any' with proper socket type if possible
}

const MemberListModal: React.FC<Props> = ({
    isOpen,
    onClose,
    chatInfo,
    currentUserId,
    onMemberRemoved,
    socket,
}) => {
    const [memberDetails, setMemberDetails] = useState<MemberDetails>({});
    const [loadingDetails, setLoadingDetails] = useState(true);
    const [errorDetails, setErrorDetails] = useState<string | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [memberToRemove, setMemberToRemove] = useState<string | null>(null);
    const [removing, setRemoving] = useState(false); // New state for removal loading

    const dispatch = useDispatch();
    const navigation = useNavigation();

    // Check if current user is admin
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

    // Fetch member details
    useEffect(() => {
        const fetchMemberDetails = async () => {
            if (!chatInfo?.participants) {
                setErrorDetails('Không có thông tin thành viên');
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
                                name: `${response.data.user.firstname || ''} ${response.data.user.surname || ''}`.trim() || 'Không tên',
                                avatar: response.data.user.avatar || 'https://via.placeholder.com/150',
                                role: member.role,
                            };
                        } else {
                            details[member.userId] = {
                                name: 'Không tìm thấy',
                                avatar: 'https://via.placeholder.com/150',
                                role: member.role,
                            };
                        }
                    } catch (error) {
                        console.error(`Error fetching user ${member.userId}:`, error);
                        details[member.userId] = {
                            name: 'Lỗi tải',
                            avatar: 'https://via.placeholder.com/150',
                            role: member.role,
                        };
                    }
                });

                await Promise.all(fetchPromises);
                setMemberDetails(details);
            } catch (error) {
                setErrorDetails('Lỗi khi tải thông tin thành viên');
                console.error('Error fetching member details:', error);
            } finally {
                setLoadingDetails(false);
            }
        };

        if (isOpen && chatInfo) {
            fetchMemberDetails();
        } else {
            setMemberDetails({});
            setLoadingDetails(false);
        }
    }, [isOpen, chatInfo]);

    // Set up socket error listener
    useEffect(() => {
        if (!socket) return;

        const handleError = (error: any) => {
            console.error('Socket error:', error);
            const errorMessage = typeof error === 'string' ? error : error?.message || 'Lỗi từ server.';
            Alert.alert('Lỗi', errorMessage);
            setRemoving(false);
        };

        onError(socket, handleError);

        return () => {
            console.log('Cleaning up socket error listener');
            socket.off('error', handleError);
        };
    }, [socket]);

    const openConfirmModal = (userId: string) => {
        setMemberToRemove(userId);
        setShowConfirmModal(true);
    };

    const confirmRemove = () => {
        if (memberToRemove) {
            handleRemoveMember(memberToRemove);
            setShowConfirmModal(false);
            setMemberToRemove(null);
        }
    };
    const cancelRemove = () => {
        console.log('Cancel remove');
        setShowConfirmModal(false);
        setMemberToRemove(null);
    };

    const handleRemoveMember = async (memberIdToRemove) => {
        if (!socket) {
            console.error("Socket chưa kết nối, không thể xóa thành viên!");
            return;
        }

        if (!isAdmin) {
            console.error("Bạn không có quyền xóa thành viên khỏi nhóm này.");
            return;
        }

        if (currentUserId === memberIdToRemove) {
            console.error("Bạn không thể tự xóa mình khỏi đây. Hãy rời nhóm từ trang thông tin nhóm.");
            return;
        }

        try {
            removeParticipant(socket, { conversationId: chatInfo._id, userId: memberIdToRemove }, (response) => {
                if (response.success) {
                    console.log("Đã xóa thành viên khỏi nhóm!");
                    if (onMemberRemoved) {
                        onMemberRemoved(memberIdToRemove);
                    }
                } else {
                    console.error("Lỗi khi xóa thành viên:", response.message);
                }
            });

            onError(socket, (error) => {
                console.error("Lỗi từ server khi xóa thành viên:", error);
            });
        } catch (error) {
            console.error("Lỗi khi xóa thành viên:", error);
        }
    };

    const handleMemberClick = async (memberId: string) => {
        if (memberId === currentUserId) {
            Alert.alert('Thông báo', 'Bạn không thể trò chuyện với chính mình!');
            return;
        }

        try {
            const res = await Api_Conversation.getOrCreateConversation(currentUserId, memberId);
            console.log('API Response:', res);

            if (res?.conversationId) {
                const messageData = {
                    id: res.conversationId,
                    isGroup: false,
                    participants: [
                        { userId: currentUserId },
                        { userId: memberId },
                    ],
                };

                dispatch(setSelectedMessage(messageData));

                // navigation.navigate('MessageScreen', {
                //     message: messageData,
                // });

                navigation.navigate('MessageScreen', {
                    message: messageData,
                    conversationId: res.conversationId,
                });


                onClose();
            } else {
                const errorMessage = typeof res?.message === 'string' ? res.message : 'Không thể lấy hoặc tạo hội thoại.';
                Alert.alert('Lỗi', errorMessage);
            }
        } catch (error) {
            console.error('Error starting conversation:', error);
            const errorMessage = typeof error === 'string' ? error : error?.message || 'Lỗi khi bắt đầu trò chuyện.';
            Alert.alert('Lỗi', errorMessage);
        }
    };

    if (!chatInfo?.participants) return null;

    return (
        <>
            <Modal
                isVisible={isOpen}
                onBackdropPress={onClose}
                style={styles.modal}
            >
                <View style={styles.modalContainer}>
                    <Text style={styles.modalTitle}>
                        Thành viên ({chatInfo.participants.length || 0})
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
                            data={chatInfo.participants}
                            keyExtractor={(item) => item.userId}
                            renderItem={({ item }) => (
                                <View style={styles.memberItem}>
                                    <TouchableOpacity
                                        style={styles.memberInfo}
                                        onPress={() => handleMemberClick(item.userId)}
                                    >
                                        <Image
                                            source={{
                                                uri: memberDetails[item.userId]?.avatar || 'https://via.placeholder.com/150',
                                            }}
                                            style={styles.avatar}
                                        />
                                        <View>
                                            <Text style={styles.memberName}>
                                                {memberDetails[item.userId]?.name || 'Không tên'}
                                            </Text>
                                            {memberDetails[item.userId]?.role === 'admin' && (
                                                <Text style={styles.adminLabel}>(Admin)</Text>
                                            )}
                                        </View>
                                    </TouchableOpacity>
                                    {isAdmin && currentUserId !== item.userId && (
                                        <TouchableOpacity
                                            onPress={() => openConfirmModal(item.userId)}
                                            style={styles.removeButton}
                                        >
                                            <Ionicons name="trash" size={16} color="#ff0000" />
                                        </TouchableOpacity>
                                    )}
                                </View>
                            )}
                            style={styles.list}
                        />
                    )}
                    <TouchableOpacity
                        onPress={onClose}
                        style={styles.closeIconWrapper}
                    >
                        <Ionicons name="close" size={24} color="#333" />
                    </TouchableOpacity>
                </View>
            </Modal>
            {showConfirmModal && (
                <Modal isVisible={showConfirmModal} onBackdropPress={cancelRemove}>
                    <View style={styles.confirmModal}>
                        <Text style={styles.confirmTitle}>Xác nhận</Text>
                        <Text style={styles.confirmText}>
                            Bạn có chắc chắn muốn xóa thành viên này khỏi Nhóm?
                        </Text>
                        <View style={styles.confirmButtons}>
                            <TouchableOpacity
                                onPress={cancelRemove}
                                style={styles.cancelButton}
                                disabled={removing}
                            >
                                <Text style={styles.cancelButtonText}>Hủy</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={confirmRemove}
                                style={[styles.confirmButton, removing && styles.disabledButton]}
                                disabled={removing}
                            >
                                {removing ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Text style={styles.confirmButtonText}>Xóa</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>
            )}
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
        padding: 20,
        borderRadius: 10,
        maxHeight: '80%',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    list: {
        maxHeight: 400,
    },
    memberItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    memberInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 12,
    },
    memberName: {
        fontSize: 14,
        color: '#333',
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
    },
    errorText: {
        color: '#ff0000',
        textAlign: 'center',
        paddingVertical: 20,
    },
    confirmModal: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 10,
        alignItems: 'center',
        height: 200,
    },
    confirmTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 12,
    },
    confirmText: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginBottom: 20,
    },
    confirmButtons: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        width: '100%',
    },
    cancelButton: {
        padding: 10,
        backgroundColor: '#ccc',
        borderRadius: 5,
        marginRight: 10,
    },
    cancelButtonText: {
        color: '#333',
        fontSize: 14,
    },
    confirmButton: {
        padding: 10,
        backgroundColor: '#ff0000',
        borderRadius: 5,
        alignItems: 'center',
        justifyContent: 'center',
    },
    confirmButtonText: {
        color: '#fff',
        fontSize: 14,
    },
    disabledButton: {
        backgroundColor: '#ff6666',
    },
    closeIconWrapper: {
        position: 'absolute',
        top: 10,
        right: 10,
        padding: 5,
        zIndex: 10,
    },
});

export default MemberListModal;