import classNames from "classnames/bind";
import styles from "./ForgotAccountPage.module.scss";
import { Link } from "react-router-dom";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { Api_Auth } from "../../../apis/api_auth";
import Modal from "../../components/Notification/Modal";
import config from "../../config";

const cx = classNames.bind(styles);

function VerifyUser() {
  const navigator = useNavigate();
  const [phone, setPhone] = useState("");
  // const [email, setEmail] = useState("");
  const [isError, setIsError] = useState(false);
  const [messageError, setMessageError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Xử lý logic tìm tài khoản ở đây
    try {
      const data = { phone };
      const response = await Api_Auth.forgotPassword(data);
      if (response.success === true) {
        navigator(config.routes.enterOTP, {
          state: { phone },
        });
      }
    } catch (error) {
      setMessageError(error.response.data.message);
      setIsError(true);
    }
  };
  const handleTryAgain = () => {
    setIsError(false);
  };

  return (
    <div className={cx("body-container")}>
      <div className={cx("flex justify-center items-center ")}>
        <div
          className={cx(" bg-white w-6/7 h-80 rounded-lg shadow-lg mt-5 p-5")}
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
                type="text"
                name="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full p-2 rounded-md border-1 border-gray-400 mb-3"
                placeholder="Nhập số điện thoại bạn cần tìm tài khoản"
                pattern="0\d{9,10}"
                title="Vui lòng nhập số điện thoại hợp lệ (bắt đầu bằng 0 - gồm 10, 11 chữ số)"
                required
              />
              {/* <input
                type="text"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2 rounded-md border-1 border-gray-400"
                placeholder="Nhập email đăng ký tài khoản"
                pattern="[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}"
                title="Vui lòng nhập địa chỉ email hợp lệ"
                required
              /> */}
              <div className={cx("border-t-1 border-gray-300 w-full mt-3 flex justify-center items-center")}>
                <input
                  type="submit"
                  value="Tìm tài khoản"
                  className={cx(
                    "bg-blue-500 font-bold text-white p-2 rounded-lg ml-40 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 mt-3"
                  )}
                />
                <Link to={config.routes.login}>
                  <input type="button" className="bg-gray-200 p-2 mt-3 rounded-lg w-20 font-medium ml-2  hover:bg-gray-400" value="Hủy bỏ" />
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
  );
}

export default VerifyUser;
