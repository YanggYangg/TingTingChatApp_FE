import React, { useState } from 'react';
import InfoModal from './InfoModal';

function ModalProfile({ isOpen, onClose }) {
    const [openModal, setOpenModal] = useState(null);
    if (!isOpen) return null;

    return (
        <><div className="absolute top-20 left-20 bg-gray-800 text-white rounded-lg shadow-lg w-64 p-4 z-50">
            <div className="font-bold text-lg mb-3">Quỳnh Giang</div>
            <div className="flex flex-col space-y-2">
                <button className="text-left px-4 py-2 rounded hover:bg-gray-700 transition">Đổi mật khẩu</button>
            </div>
        </div><InfoModal isOpen={openModal === "profile"} onClose={() => setOpenModal(null)} /></>
    
    );
}

export default ModalProfile;
