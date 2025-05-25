import classNames from "classnames/bind";
import styles from "./ForgotAccountPage.module.scss";
import { Link } from "react-router-dom";
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import { Api_Auth } from "../../../apis/api_auth";
import Modal from "../../components/Notification/Modal";
import config from "../../config";

const cx = classNames.bind(styles);

function EnterOTP() {
  const navigator = useNavigate();
  const location = useLocation();
  const { phone } = location.state || {}; // Lấy giá trị từ state nếu có

  const [otp, setOTP] = useState("");

  const [isError, setIsError] = useState(false);
  const [messageError, setMessageError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const data = { phone, otp };
      const response = await Api_Auth.verifyOTP(data);
      navigator(config.routes.updatePassword, {
        state: { phone },
      });
    } catch (error) {
      setMessageError(error.response.data.message)
      setIsError(true)
    }
  }

  const handleTryAgain = () => {
    setIsError(false)
  }

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
            <p>Xác thực tài khoản</p>
          </div>
          <div>
            <p>
              Vui lòng nhập mã OTP đã được gửi đến số điện thoại :{" "}
              <span className="text-red-400">{phone}</span> của bạn để xác nhận
              tài khoản.
            </p>
            <form
              onSubmit={handleSubmit}
              className="flex flex-col items-center h-100 m-2"
            >
              <input
                type="text"
                name="otp"
                value={otp}
                onChange={(e) => setOTP(e.target.value)}
                className={cx("form-input", "otp-input")}
                placeholder="Nhập mã OTP bạn đã nhận được"
                pattern="\d{6}"
                title="Vui lòng nhập mã OTP hợp lệ (6 chữ số)"
                maxLength={6}
                required
              />

              <div className={cx("border-t-1 border-gray-300 w-full mt-3 ")}>
                <input
                  type="submit"
                  value="Xác thực"
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
          title="Verified Failed!"
          message={messageError}
          onClose={handleTryAgain}
        />
      )}
    </div>
  )
}

export default EnterOTP
