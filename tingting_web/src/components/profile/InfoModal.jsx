import React, { useState } from 'react';

function InfoModal({ isOpen, onClose }) {
    if (!isOpen) return null;

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        day: '1',
        month: '1',
        year: '2025',
        gender: 'female',
        email: 'user@example.com',
        phone: '0123456789',
        avatar: null
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData((prev) => ({ ...prev, avatar: URL.createObjectURL(file) }));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Xử lý dữ liệu gửi đi ở đây
        console.log('Submit form:', formData);
        onClose();
    };

    const days = Array.from({ length: 31 }, (_, i) => i + 1);
    const years = Array.from({ length: 100 }, (_, i) => 2025 - i);
    const months = [
        { value: '1', label: 'Jan' }, { value: '2', label: 'Feb' },
        { value: '3', label: 'Mar' }, { value: '4', label: 'Apr' },
        { value: '5', label: 'May' }, { value: '6', label: 'Jun' },
        { value: '7', label: 'Jul' }, { value: '8', label: 'Aug' },
        { value: '9', label: 'Sep' }, { value: '10', label: 'Oct' },
        { value: '11', label: 'Nov' }, { value: '12', label: 'Dec' }
    ];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 bg-black/30 backdrop-blur-mdbg-black/30 backdrop-blur-md ">
            <div className="bg-white text-black p-6 rounded-lg w-[500px] shadow-lg max-h-[90vh] overflow-y-auto relative ">
                <button
                    onClick={onClose}
                    className="absolute top-3 right-4 text-xl text-gray-500 hover:text-black"
                >×</button>

                <h2 className="text-2xl font-semibold mb-4">Thông tin tài khoản</h2>
                 {/* Ảnh đại diện */}
                 <div className="flex flex-col items-center mb-4">
                    <img
                        src={formData.avatar || 'https://via.placeholder.com/100'}
                        alt="Avatar"
                        className="w-24 h-24 rounded-full object-cover mb-2"
                    />
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        className="text-sm"
                    />
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="flex space-x-3">
                        <input name="firstName" placeholder="Tên" value={formData.firstName} onChange={handleChange} className="border px-3 py-2 w-1/2 rounded" />
                        <input name="lastName" placeholder="Họ" value={formData.lastName} onChange={handleChange} className="border px-3 py-2 w-1/2 rounded" />
                    </div>



                    <div className="flex space-x-3">
                        <select name="day" value={formData.day} onChange={handleChange} className="border px-3 py-2 rounded w-1/3">
                            {days.map(day => <option key={day} value={day}>{day}</option>)}
                        </select>
                        <select name="month" value={formData.month} onChange={handleChange} className="border px-3 py-2 rounded w-1/3">
                            {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                        </select>
                        <select name="year" value={formData.year} onChange={handleChange} className="border px-3 py-2 rounded w-1/3">
                            {years.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="block mb-1">Giới tính</label>
                        <div className="flex items-center space-x-4">
                            <label><input type="radio" name="gender" value="female" checked={formData.gender === 'female'} onChange={handleChange} /> Nữ</label>
                            <label><input type="radio" name="gender" value="male" checked={formData.gender === 'male'} onChange={handleChange} /> Nam</label>
                            <label><input type="radio" name="gender" value="other" checked={formData.gender === 'other'} onChange={handleChange} /> Khác</label>
                        </div>
                    </div>

                    <input name="email" type="email" placeholder="Địa chỉ email" value={formData.email} onChange={handleChange} className="border px-3 py-2 w-full rounded" />
                    <input name="phone" placeholder="Số điện thoại di động" value={formData.phone} onChange={handleChange} className="border px-3 py-2 w-full rounded" />


                    <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded mt-4">
                        Cập nhật
                    </button>
                </form>
            </div>
        </div>
    );
}

export default InfoModal;
