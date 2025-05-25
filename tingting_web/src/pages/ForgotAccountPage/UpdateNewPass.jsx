import classNames from "classnames/bind";
import styles from "./ForgotAccountPage.module.scss";
import { Link } from "react-router-dom";
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import { Api_Auth } from "../../../apis/api_auth";
import Modal from "../../components/Notification/Modal";
import config from "../../config";

const cx = classNames.bind(styles);

function UpdateNewPass() {
  const navigator = useNavigate();
  const location = useLocation();
  const { phone } = location.state || {};
  const [newPassword, setNewPassword] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [isError, setIsError] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [messageError, setMessageError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Xử lý logic tìm tài khoản ở đây
    try {
      const data = { newPassword, phone };
      if (newPassword !== confirmPass) {
        setMessageError("Mật khẩu không khớp, vui lòng nhập lại!");
        setIsError(true);
        return;
      }
      const response = await Api_Auth.updateNewPassword(data);
      setIsSuccess(true);
    } catch (error) {
      setMessageError(error.response.data.message);
      setIsError(true);
    }
  };
  const handleTryAgain = () => {
    setIsError(false);
  };
  const handleSuccess = () => {
    setIsSuccess(false);
    navigator(config.routes.login);
  };

  return (
    <div className={cx("body-container")}>
      <div className={cx("flex justify-center items-center ")}>
        <div
          className={cx(" bg-white w-7/9 h-80 rounded-lg shadow-lg mt-5 p-5")}
        >
          <div
            className={cx(
              "w-full p-3 h-15 border-b-1 border-gray-300 font-medium text-xl"
            )}
          >
            <p>Tìm tài khoản của bạn</p>
          </div>
          <div>
            <p>
              Vui lòng nhập số điện thoại di động để tìm kiếm tài khoản của bạn.
            </p>
            <form
              onSubmit={handleSubmit}
              className="flex flex-col items-center h-100 m-2"
            >
              <input
                type="password"
                name="phone"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full p-2 rounded-md border-1 border-gray-400 mb-3"
                placeholder="Nhập mật khẩu mới"
                minLength={6}
                pattern="^\S{6,}$"
                title="Mật khẩu phải có ít nhất 6 ký tự và không chứa khoảng trắng"
                required
              />
              <input
                type="password"
                name="email"
                value={confirmPass}
                onChange={(e) => setConfirmPass(e.target.value)}
                className="w-full p-2 rounded-md border-1 border-gray-400"
                placeholder="Nhập lại mật khẩu mới"
                pattern="^\S{6,}$"
                title="Mật khẩu phải có ít nhất 6 ký tự và không chứa khoảng trắng"
                minLength={6}
                required
              />
              <div className={cx("border-t-1 border-gray-300 w-full mt-3 ")}>
                <input
                  type="submit"
                  value="Cập nhật"
                  className={cx(
                    "bg-blue-500 font-bold text-white py-2 px-4 rounded-lg ml-43 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 mt-3"
                  )}
                />
                <Link to={config.routes.login}>
                  <button className="bg-gray-200 p-2 rounded-md w-20 font-medium ml-2  hover:bg-gray-400">
                    Hủy bỏ
                  </button>
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
      {isError && (
        <Modal
          valid={false}
          isNotification={true}
          title="Update Failed!"
          message={messageError}
          onClose={handleTryAgain}
        />
      )}
      {isSuccess && (
        <Modal
          valid={true}
          title="Update New Password Successful!"
          message="You may now login with new password"
          isNotification={true}
          onConfirm={handleSuccess}
          onClose={() => console.log("close")}
        />
      )}
    </div>
  );
}

export default UpdateNewPass;
