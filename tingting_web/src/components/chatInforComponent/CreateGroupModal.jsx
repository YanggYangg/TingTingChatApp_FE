import React, { useState, useEffect } from 'react';
import { AiOutlineCamera, AiOutlineSearch, AiOutlineClose } from 'react-icons/ai';
import { Api_FriendRequest } from '../../../apis/api_friendRequest'; // Đảm bảo đường dẫn đúng với cấu trúc thư mục của bạn

const CreateGroupModal = ({ isOpen, onClose, userId }) => {
    const [groupName, setGroupName] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedContacts, setSelectedContacts] = useState([]);
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Hàm lấy danh sách bạn bè từ API
    const getFriendsList = async (userId) => {
        return Api_FriendRequest.getFriendsList(userId);
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
                // Đảm bảo dữ liệu phù hợp với định dạng cần thiết
                const formattedContacts = friendsList.map(friend => ({
                    id: friend._id,
                    name: friend.name,
                    avatar: friend.avatar || 'https://via.placeholder.com/30/007bff/FFFFFF?Text=User', // Ảnh mặc định nếu không có avatar
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
            setSelectedContacts(selectedContacts.filter(c => c.id !== contact.id));
        } else {
            setSelectedContacts([...selectedContacts, contact]);
        }
    };

    const handleRemoveSelectedContact = (contactToRemove) => {
        setSelectedContacts(selectedContacts.filter(contact => contact.id !== contactToRemove.id));
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
                            placeholder="Nhập tên nhóm..."
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
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
                                        type="checkbox" // Thay radio bằng checkbox để chọn nhiều người
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
                        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none ml-2"
                        disabled={selectedContacts.length === 0 || !groupName.trim()} // Vô hiệu hóa nếu chưa chọn thành viên hoặc chưa có tên nhóm
                    >
                        Tạo nhóm
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreateGroupModal;