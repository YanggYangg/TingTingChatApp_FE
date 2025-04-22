import React, { useState, useEffect } from 'react';
import { AiOutlineCamera, AiOutlineSearch, AiOutlineClose } from 'react-icons/ai';
import { Api_FriendRequest } from '../../../apis/api_friendRequest';
import { Api_chatInfo } from '../../../apis/Api_chatInfo';

const CreateGroupModal = ({ isOpen, onClose, onGroupCreated, userId }) => {
    const [groupName, setGroupName] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedContacts, setSelectedContacts] = useState([]);
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [createLoading, setCreateLoading] = useState(false); // Trạng thái loading khi tạo nhóm

    // Hàm lấy danh sách bạn bè từ API
    const getFriendsList = async (userId) => {
        return Api_FriendRequest.getFriendsList(userId)
    };

    // Gọi API khi modal mở
    useEffect(() => {
        if (!isOpen || !userId) return;

        const fetchFriendsList = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await getFriendsList(userId);
                const friendsList = response.data || [];
                const formattedContacts = friendsList.map(friend => ({
                    id: friend._id,
                    name: friend.name,
                    avatar: friend.avatar || 'https://via.placeholder.com/30/007bff/FFFFFF?Text=User',
                }));
                setContacts(formattedContacts);
            } catch (err) {
                console.error('Lỗi khi lấy danh sách bạn bè:', err);
                setError('Không thể tải danh sách bạn bè. Vui lòng thử lại.');
                setContacts([]);
            } finally {
                setLoading(false);
            }
        };

        fetchFriendsList();
    }, [isOpen, userId]);

    // Lọc danh sách liên hệ dựa trên tìm kiếm
    const filteredContacts = contacts.filter(contact =>
        contact.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleContactSelect = (contact) => {
        if (selectedContacts.some(c => c.id === contact.id)) {
            setSelectedContacts(prevContacts => prevContacts.filter(c => c.id !== contact.id));
        } else {
            setSelectedContacts(prevContacts => [...prevContacts, contact]);
        }
        console.log('selectedContacts:', selectedContacts); // Kiểm tra ở đây
    };

    const handleRemoveSelectedContact = (contactToRemove) => {
        setSelectedContacts(prevContacts => prevContacts.filter(contact => contact.id !== contactToRemove.id));
    };

    // Hàm gọi API tạo cuộc trò chuyện nhóm
    const handleCreateGroup = async () => {
        if (selectedContacts.length < 2) {
            setError('Vui lòng chọn ít nhất 2 thành viên để tạo nhóm.');
            return;
        }

        const actualGroupName = groupName.trim() === '' ? 'Nhóm không tên' : groupName.trim();

        setCreateLoading(true);
        setError(null);
        try {
            // Tạo danh sách participants, người tạo có role admin
            const participants = [
                {
                    userId: userId,
                    role: 'admin',
                },
                ...selectedContacts.map(contact => ({
                    userId: contact.id,
                    role: 'member',
                })),
            ];

            const groupData = {
                name: actualGroupName,
                participants: participants,
                isGroup: true,
                imageGroup: 'https://media.istockphoto.com/id/1306949457/vi/vec-to/nh%E1%BB%AFng-ng%C6%B0%E1%BB%9Di-%C4%91ang-t%C3%ACm-ki%E1%BA%BFm-c%C3%A1c-gi%E1%BA%A3i-ph%C3%A1p-s%C3%A1ng-t%E1%BA%A1o-kh%C3%A1i-ni%E1%BB%87m-kinh-doanh-l%C3%A0m-vi%E1%BB%87c-nh%C3%B3m-minh-h%E1%BB%8Da.jpg?s=2048x2048&w=is&k=20&c=kw1Pdcz1wenUsvVRH0V16KTE1ng7bfkSxHswHPHGmCA=',
                mute: null,
                isHidden: false,
                isPinned: false,
                pin: "null",
            };


            const response = await Api_chatInfo.createConversation(groupData);
            console.log('API Response: tạo', response); // Thêm dòng này
            if (response && response.success) {
                alert('Tạo nhóm thành công!');
                setGroupName('');
                setSelectedContacts([]);
                onGroupCreated && onGroupCreated(response.data);
                onClose();
            } else {
                throw new Error(response?.message || 'Không thể tạo nhóm.');
            }
        } catch (err) {
            console.error('Lỗi khi tạo nhóm:', err);
            setError(err.message || 'Không thể tạo nhóm. Vui lòng thử lại.');
        } finally {
            setCreateLoading(false);
        }
    };

    if (!isOpen) {
        return null;
    }

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-filter backdrop-blur-[1px]">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b">
                    <h2 className="text-lg font-semibold">Tạo nhóm</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 focus:outline-none">
                        <AiOutlineClose size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-4">
                    {/* Nhập tên nhóm */}
                    <div className="flex items-center border rounded-md p-2 mb-4">
                        <AiOutlineCamera className="text-gray-500 mr-2" />
                        <input
                            type="text"
                            className="flex-grow outline-none text-sm text-gray-700 placeholder-gray-400"
                            placeholder="Nhập tên nhóm (tùy chọn)..."
                            value={groupName}
                            onChange={(e) => {
                                setGroupName(e.target.value);
                                console.log('groupName:', e.target.value); // Kiểm tra ở đây
                            }}
                        />
                    </div>

                    {/* Tìm kiếm */}
                    <div className="flex items-center border rounded-md p-2 mb-4">
                        <AiOutlineSearch className="text-gray-500 mr-2" />
                        <input
                            type="text"
                            className="flex-grow outline-none text-sm text-gray-700 placeholder-gray-400"
                            placeholder="Nhập tên hoặc số điện thoại..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    {/* Danh sách liên hệ và đã chọn */}
                    <div className="flex gap-4">
                        <div className="flex-grow max-h-64 overflow-y-auto pr-2">
                            <h3 className="text-sm font-semibold text-gray-700 mb-2">Danh sách bạn bè</h3>
                            {loading && <p className="text-sm text-gray-500">Đang tải...</p>}
                            {error && <p className="text-sm text-red-500">{error}</p>}
                            {!loading && !error && filteredContacts.length === 0 && (
                                <p className="text-sm text-gray-500">Không tìm thấy bạn bè nào.</p>
                            )}
                            {!loading && filteredContacts.map(contact => (
                                <div key={contact.id} className="flex items-center py-2">
                                    <input
                                        type="checkbox"
                                        className="form-checkbox h-4 w-4 text-blue-500 focus:ring-blue-500 mr-2"
                                        checked={selectedContacts.some(c => c.id === contact.id)}
                                        onChange={() => handleContactSelect(contact)}
                                    />
                                    <img
                                        src={contact.avatar}
                                        alt={contact.name}
                                        className="w-6 h-6 rounded-full mr-2 object-cover"
                                    />
                                    <span className="text-sm text-gray-700">{contact.name}</span>
                                </div>
                            ))}
                        </div>

                        <div className="w-48 max-h-64 overflow-y-auto border rounded-md p-2">
                            <h3 className="text-sm font-semibold text-gray-700 mb-2">
                                Đã chọn {selectedContacts.length}/100
                            </h3>
                            {selectedContacts.map(contact => (
                                <div key={contact.id} className="flex items-center bg-gray-100 rounded-md p-1 mb-1">
                                    <span className="text-sm text-gray-700 flex-grow">{contact.name}</span>
                                    <button
                                        className="text-gray-500 hover:text-gray-700 focus:outline-none"
                                        onClick={() => handleRemoveSelectedContact(contact)}
                                    >
                                        <AiOutlineClose size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                    {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                </div>

                {/* Footer */}
                <div className="flex justify-end p-4 border-t">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-600 rounded-md hover:bg-gray-100 focus:outline-none"
                    >
                        Hủy
                    </button>
                    <button
                        onClick={handleCreateGroup}
                        className={`px-4 py-2 rounded-md focus:outline-none ml-2 ${createLoading || selectedContacts.length < 2
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-blue-500 hover:bg-blue-600 text-white'
                            }`}
                        disabled={createLoading || selectedContacts.length < 2}
                    >
                        {createLoading ? 'Đang tạo...' : 'Tạo nhóm'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreateGroupModal;