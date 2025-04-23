import { useState, useEffect, useRef } from "react";
import { FaTimes, FaLock } from "react-icons/fa";
import { Api_Auth } from "../../../apis/api_auth";

function UserChangePasswordModal({ isOpen, onClose }) {
  const [form, setForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const modalRef = useRef(null);

  // Close modal when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    setError("");
    setSuccess("");

    if (form.newPassword === form.oldPassword) {
      setError("Mật khẩu mới không được giống mật khẩu cũ.");
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      setError("Mật khẩu mới không khớp.");
      return;
    }

    try {

      await Api_Auth.changePassword({
        phone: localStorage.getItem("phone"),
        oldPassword: form.oldPassword,
        newPassword: form.newPassword,
      });

      setSuccess("Đổi mật khẩu thành công!");
      setTimeout(() => {
        setSuccess("");
        onClose();
      }, 2000);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Đổi mật khẩu thất bại. Vui lòng thử lại."
      );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[rgba(0,0,0,0.6)] flex items-center justify-center z-50 text-black">
      <div
        ref={modalRef}
        className="bg-white w-full max-w-md rounded-md overflow-hidden"
      >
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-medium">Đổi mật khẩu</h2>
          <button onClick={onClose} className="text-black hover:text-gray-700">
            <FaTimes size={20} />
          </button>
        </div>

        {/* Form */}
        <div className="p-4 space-y-4">
          <div>
            <label className="block mb-1">Mật khẩu cũ</label>
            <input
              type="password"
              name="oldPassword"
              value={form.oldPassword}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              pattern="^\S{6,}$"
              title="Mật khẩu phải có ít nhất 6 ký tự và không chứa khoảng trắng"
            />
          </div>

          <div>
            <label className="block mb-1">Mật khẩu mới</label>
            <input
              type="password"
              name="newPassword"
              value={form.newPassword}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              pattern="^\S{6,}$"
              title="Mật khẩu phải có ít nhất 6 ký tự và không chứa khoảng trắng"
            />
          </div>

          <div>
            <label className="block mb-1">Nhập lại mật khẩu mới</label>
            <input
              type="password"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              pattern="^\S{6,}$"
              title="Mật khẩu phải có ít nhất 6 ký tự và không chứa khoảng trắng"
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}
          {success && <p className="text-green-600 text-sm">{success}</p>}

          <button
            onClick={handleSubmit}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded flex justify-center items-center gap-2"
          >
            <FaLock />
            Đổi mật khẩu
          </button>
        </div>
      </div>
      
    </div>
  );
}

export default UserChangePasswordModal;
