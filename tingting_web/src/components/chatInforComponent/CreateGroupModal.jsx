import React, { useState } from 'react';
import { AiOutlineCamera, AiOutlineSearch, AiOutlineClose } from 'react-icons/ai';
import { BsChevronRight } from 'react-icons/bs';

const sampleContacts = [
    { id: 1, firstname: 'Quỳnh', surname: 'Giang', avatar: 'https://via.placeholder.com/30/007bff/FFFFFF?Text=QG' },
    { id: 2, firstname: 'In Photo', surname: 'Kim Cúc', avatar: 'https://via.placeholder.com/30/28a745/FFFFFF?Text=KC' },
    { id: 3, firstname: 'HỚ', surname: 'MỞ HỚ', avatar: 'https://via.placeholder.com/30/dc3545/FFFFFF?Text=HM' },
    { id: 4, firstname: 'Nguyễn', surname: 'Châu Tình', avatar: 'https://via.placeholder.com/30/ffc107/000000?Text=NT' },
    { id: 5, firstname: 'Nguyễn', surname: 'Văn Tiến', avatar: 'https://via.placeholder.com/30/17a2b8/FFFFFF?Text=VT' },
    { id: 6, firstname: 'A', surname: 'Vũ', avatar: 'https://via.placeholder.com/30/6c757d/FFFFFF?Text=AV' },
    { id: 7, firstname: 'An', surname: 'Bình', avatar: 'https://via.placeholder.com/30/007bff/FFFFFF?Text=AB' },
    { id: 8, firstname: 'Anh', surname: 'Hải', avatar: 'https://via.placeholder.com/30/28a745/FFFFFF?Text=AH' },
    // Thêm dữ liệu mẫu khác nếu cần
];

const CreateGroupModal = ({ isOpen, onClose }) => {
    const [groupName, setGroupName] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedContacts, setSelectedContacts] = useState([]);

    const filteredContacts = sampleContacts.filter(contact =>
        `${contact.firstname} ${contact.surname}`.toLowerCase().includes(searchQuery.toLowerCase())
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
                            placeholder="Nhập tên, số điện thoại, hoặc danh sách số điện thoại"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>


                    {/* Danh sách liên hệ và đã chọn */}
                    <div className="flex gap-4">
                        <div className="flex-grow max-h-64 overflow-y-auto pr-2">
                            <h3 className="text-sm font-semibold text-gray-700 mb-2">Trò chuyện gần đây</h3>
                            {filteredContacts.map(contact => (
                                <div key={contact.id} className="flex items-center py-2">
                                    <input
                                        type="radio"
                                        className="form-radio h-4 w-4 text-blue-500 focus:ring-blue-500 mr-2"
                                        checked={selectedContacts.some(c => c.id === contact.id)}
                                        onChange={() => handleContactSelect(contact)}
                                    />
                                    <img src={contact.avatar} alt={`${contact.firstname} ${contact.surname}`} className="w-6 h-6 rounded-full mr-2 object-cover" />
                                    <span className="text-sm text-gray-700">{`${contact.firstname} ${contact.surname}`}</span>
                                </div>
                            ))}
                        </div>

                        <div className="w-48 max-h-64 overflow-y-auto border rounded-md p-2">
                            <h3 className="text-sm font-semibold text-gray-700 mb-2">Đã chọn {selectedContacts.length}/100</h3>
                            {selectedContacts.map(contact => (
                                <div key={contact.id} className="flex items-center bg-gray-100 rounded-md p-1 mb-1">
                                    <span className="text-sm text-gray-700 flex-grow">{`${contact.firstname} ${contact.surname}`}</span>
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
                    <button onClick={onClose} className="px-4 py-2 text-gray-600 rounded-md hover:bg-gray-100 focus:outline-none">
                        Hủy
                    </button>
                    <button className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none ml-2">
                        Tạo nhóm
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreateGroupModal;