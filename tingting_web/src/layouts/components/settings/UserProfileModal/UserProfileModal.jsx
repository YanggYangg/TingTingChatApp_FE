import { useState, useEffect, useRef, use } from "react";
import { FaTimes, FaEdit, FaCamera } from "react-icons/fa";
import InfoModal from "../../../../components/profile/InfoModal.jsx";
import { Api_Profile } from "../../../../../apis/api_profile.js";

function UserProfileModal({ isOpen, onCloseUserProfile }) {
  const [openModal, setOpenModal] = useState(null);
  const [formData, setFormData] = useState({
    firstname: "",
    surname: "",
    day: "1",
    month: "1",
    year: "2025",
    gender: "female",
    phone: "",
    avatar: null,
    coverPhoto: null,
  });
 useEffect(() => {
     const loadProfileFromLocal = () => {
       try {
         const storedProfile = localStorage.getItem("profile");
         if (!storedProfile) return;
   
         const profile = JSON.parse(storedProfile);
         const date = new Date(profile.dateOfBirth);
         const day = date.getDate().toString();
         const month = (date.getMonth() + 1).toString();
         const year = date.getFullYear().toString();
   
         setFormData((prev) => ({
           ...prev,
           firstname: profile.firstname || "",
           surname: profile.surname || "",
           phone: profile.phone || "",
           avatar: profile.avatar ||
             "https://internetviettel.vn/wp-content/uploads/2017/05/H%C3%ACnh-%E1%BA%A3nh-minh-h%E1%BB%8Da.jpg",
           coverPhoto: profile.coverPhoto || null,
           gender: profile.gender || "female",
           day,
           month,
           year,
         }));
       } catch (error) {
         console.error("Error loading profile from localStorage:", error);
       }
     };
   
     loadProfileFromLocal();
   }, []);
  const modalRef = useRef(null);

  // Close modal when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        // onClose();
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onCloseUserProfile]);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-[rgba(0,0,0,0.6)] flex items-center justify-center z-50 text-black">
        <div
          ref={modalRef}
          className="bg-white w-full max-w-md rounded-md overflow-hidden"
        >
          {/* Header */}
          <div className="flex justify-between items-center p-4 border-b">
            <h2 className="text-lg font-medium">Thông tin tài khoản</h2>
            <button
              onClick={onCloseUserProfile}
              className="text-black hover:text-gray-700"
            >
              <FaTimes size={20} />
            </button>
          </div>

          {/* Profile picture */}
          <div className="relative pb-24 border-b-4 border-gray-200">
            <img
              src={formData.coverPhoto}
              alt=""
              className="w-full h-60 object-cover"
            />
            <div className="flex flex-row ml-4 py-6 bg-gray-150 absolute mt-20 items-center top-28">
              <div className="relative">
                <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-white">
                  <img
                    src={formData.avatar}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                </div>
                <button className="absolute bottom-0 left-16 bg-white rounded-full p-1 shadow">
                  <FaCamera className="text-blue-600" />
                </button>
              </div>

              <div className="ml-3 mt-3 flex">
                <h3 className="text-xl font-medium">
                  {formData.surname} {formData.firstname}
                </h3>
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
                <div>{formData.gender === "female" ? "Nữ" : "Nam"}</div>
              </div>

              <div className="flex">
                <div className="w-28 ">Ngày sinh</div>
                <div>
                  Ngày {formData.day} Tháng {formData.month} Năm {formData.year}
                </div>
              </div>

              <div className="flex ">
                <div className="w-28">Điện thoại</div>
                <div>{formData.phone}</div>
              </div>

              <div className="text-sm  mt-4">
                Chỉ bạn bè có lưu số của bạn trong danh bạ máy xem được số này
              </div>
            </div>
          </div>

          {/* Update button */}
          <div className="p-4 border-t-2 border-gray-200 flex justify-center">
            <button
              className="flex items-center text-blue-600 font-medium"
              onClick={() => {
                setOpenModal("profile");
               
              } }
            >
              <FaEdit className="mr-2" />
              Cập nhật
            </button>
          </div>
        </div>
      </div>
      <InfoModal
        isOpen={openModal === "profile"}
        onClose={() =>
          { 
          onCloseUserProfile();
          setOpenModal(null);}}
     
      />
    </>
  );
}

export default UserProfileModal;
