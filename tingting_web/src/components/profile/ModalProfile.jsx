import React, { useState } from "react";
import InfoModal from "./InfoModal";
import UserChangePasswordModal from "./UserChangePasswordModal";

function ModalProfile({ isOpen, onClose }) {
  const [openModal, setOpenModal] = useState(false);
  if (!isOpen) return null;
  const profile = JSON.parse(localStorage.getItem("profile"));
  const surname = profile?.surname || "Nguyễn Văn";
  const firstname = profile?.firstname || "A";

  return (
    <>
      <div className="absolute top-10 left-15 bg-gray-500 text-white rounded-lg shadow-lg w-64 p-4 z-50">
        <div className="font-bold text-lg mb-3">
          {" "}
          {surname} {firstname}{" "}
        </div>
        <div className="flex flex-col space-y-2">
          <button
            onClick={() => {
              setOpenModal(true);
            }}
            className="text-left px-4 py-2 rounded hover:bg-gray-700 transition"
          >
            Đổi mật khẩu
          </button>
        </div>
      </div>
      <UserChangePasswordModal
        isOpen={openModal}
        onClose={() => setOpenModal(false)}
      />
    </>
  );
}

export default ModalProfile;
