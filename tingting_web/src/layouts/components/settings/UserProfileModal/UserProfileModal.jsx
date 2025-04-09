"use client"

import { useState, useEffect, useRef } from "react"
import { FaTimes, FaEdit, FaCamera } from "react-icons/fa"

function UserProfileModal({ isOpen, onClose }) {
  const [userData, setUserData] = useState({
    name: "Nguyễn Châu Tình",
    gender: "Nam",
    birthdate: "05 tháng 12, 2002",
    phone: "+84 372 374 650",
  })
  const [isEditMode, setIsEditMode] = useState(false)
  const [formData, setFormData] = useState({
    name: "Nguyễn Châu Tình",
    gender: "Nam",
    day: "05",
    month: "12",
    year: "2002",
  })

  const modalRef = useRef(null)

  // Close modal when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen, onClose])

  const handleUpdateClick = () => {
    setIsEditMode(true)
  }

  const handleCancelEdit = () => {
    setIsEditMode(false)
  }

  const handleSaveChanges = () => {
    // Update the user data with form data
    setUserData({
      ...userData,
      name: formData.name,
      gender: formData.gender,
      birthdate: `${formData.day} tháng ${formData.month}, ${formData.year}`,
    })
    setIsEditMode(false)
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  if (!isOpen) return null

  if (isEditMode) {
    return (
      <div className="fixed inset-0 bg-[rgba(0,0,0,0.6)] flex items-center justify-center z-50 text-black">
        <div ref={modalRef} className="bg-white w-full max-w-md rounded-md overflow-hidden">
          {/* Header */}
          <div className="flex justify-between items-center p-4 border-b">
            <button onClick={handleCancelEdit} className="text-black hover:text-gray-700">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </button>
            <h2 className="text-lg font-medium">Cập nhật thông tin cá nhân</h2>
            <div className="w-6"></div> {/* Empty div for spacing */}
          </div>

          {/* Form */}
          <div className="p-4">
            <div className="mb-4">
              <label className="block text-sm mb-1">Tên hiển thị</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
              />
            </div>

            <div className="mb-4">
              <h4 className="text-lg font-medium mb-2">Thông tin cá nhân</h4>

              <div className="mb-4">
                <div className="flex items-center mb-2">
                  <input
                    type="radio"
                    id="male"
                    name="gender"
                    value="Nam"
                    checked={formData.gender === "Nam"}
                    onChange={handleInputChange}
                    className="mr-2"
                  />
                  <label htmlFor="male">Nam</label>

                  <input
                    type="radio"
                    id="female"
                    name="gender"
                    value="Nữ"
                    checked={formData.gender === "Nữ"}
                    onChange={handleInputChange}
                    className="ml-6 mr-2"
                  />
                  <label htmlFor="female">Nữ</label>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm mb-1">Ngày sinh</label>
                <div className="flex gap-2">
                  <select
                    name="day"
                    value={formData.day}
                    onChange={handleInputChange}
                    className="p-2 border rounded flex-1"
                  >
                    {[...Array(31)].map((_, i) => (
                      <option key={i + 1} value={String(i + 1).padStart(2, "0")}>
                        {String(i + 1).padStart(2, "0")}
                      </option>
                    ))}
                  </select>

                  <select
                    name="month"
                    value={formData.month}
                    onChange={handleInputChange}
                    className="p-2 border rounded flex-1"
                  >
                    {[...Array(12)].map((_, i) => (
                      <option key={i + 1} value={String(i + 1).padStart(2, "0")}>
                        {String(i + 1).padStart(2, "0")}
                      </option>
                    ))}
                  </select>

                  <select
                    name="year"
                    value={formData.year}
                    onChange={handleInputChange}
                    className="p-2 border rounded flex-1"
                  >
                    {[...Array(50)].map((_, i) => (
                      <option key={2024 - i} value={String(2024 - i)}>
                        {2024 - i}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="p-4 border-t flex justify-between">
            <button onClick={handleCancelEdit} className="px-4 py-2 bg-gray-200 rounded">
              Hủy
            </button>
            <button onClick={handleSaveChanges} className="px-4 py-2 bg-blue-500 text-white rounded">
              Cập nhật
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-[rgba(0,0,0,0.6)] flex items-center justify-center z-50 text-black">
      <div ref={modalRef} className="bg-white w-full max-w-md rounded-md overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-medium">Thông tin tài khoản</h2>
          <button onClick={onClose} className="text-black hover:text-gray-700">
            <FaTimes size={20} />
          </button>
        </div>

        {/* Profile picture */}
        <div className="relative pb-24 border-b-4 border-gray-200">
          <img
            src="https://internetviettel.vn/wp-content/uploads/2017/05/H%C3%ACnh-%E1%BA%A3nh-minh-h%E1%BB%8Da.jpg"
            alt=""
            className="w-full h-60 object-cover"
          />
          <div className="flex flex-row ml-4 py-6 bg-gray-150 absolute mt-20 items-center top-28">
            <div className="relative">
              <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-white">
                <img
                  src="https://images2.thanhnien.vn/528068263637045248/2024/1/25/e093e9cfc9027d6a142358d24d2ee350-65a11ac2af785880-17061562929701875684912.jpg"
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              </div>
              <button className="absolute bottom-0 left-16 bg-white rounded-full p-1 shadow">
                <FaCamera className="text-blue-600" />
              </button>
            </div>

            <div className="ml-3 mt-3 flex">
              <h3 className="text-xl font-medium">{userData.name}</h3>
              <button className="ml-2 text-blue-600">
                <FaEdit />
              </button>
            </div>
          </div>
        </div>
        {/* Personal information */}
        <div className="p-4">
          <h4 className="text-lg font-medium mb-4 ">Thông tin cá nhân</h4>

          <div className="space-y-4">
            <div className="flex">
              <div className="w-28 ">Giới tính</div>
              <div>{userData.gender}</div>
            </div>

            <div className="flex">
              <div className="w-28 ">Ngày sinh</div>
              <div>{userData.birthdate}</div>
            </div>

            <div className="flex ">
              <div className="w-28">Điện thoại</div>
              <div>{userData.phone}</div>
            </div>

            <div className="text-sm  mt-4">Chỉ bạn bè có lưu số của bạn trong danh bạ máy xem được số này</div>
          </div>
        </div>

        {/* Update button */}
        <div className="p-4 border-t-2 border-gray-200 flex justify-center">
          <button className="flex items-center text-blue-600 font-medium" onClick={handleUpdateClick}>
            <FaEdit className="mr-2" />
            Cập nhật
          </button>
        </div>
      </div>
    </div>
  )
}

export default UserProfileModal
