import classNames from "classnames/bind";
import styles from "./Login.module.scss";
import { data, Link } from "react-router-dom";
import { useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import { Api_Auth } from "../../../apis/api_auth";
import Modal from "../../components/Notification/Modal";
import config from "../../config";
import { useSocket } from "../../contexts/SocketContext";

const cx = classNames.bind(styles);

function VerifyOTP() {
  const { setUserId } = useSocket();
  const navigator = useNavigate();
  const location = useLocation();
  const { phone } = location.state || { phone: "" };
  const { firstname, surname, day, month, year, gender, email, password } =
    location.state; // Lấy số điện thoại từ state nếu có
  const [isError, setIsError] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [messageError, setMessageError] = useState("");
  const [messageSuccess, setMessageSuccess] = useState("");

  const length = 6;
  const [otp, setOtp] = useState(new Array(length).fill(""));
  const inputRefs = useRef([]);

  const handleChange = (element, index) => {
    const value = element.value.replace(/\D/, ""); // Chỉ nhận số
    if (!value) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Focus vào ô tiếp theo
    if (index < length - 1) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace") {
      if (otp[index]) {
        const newOtp = [...otp];
        newOtp[index] = "";
        setOtp(newOtp);
      } else if (index > 0) {
        inputRefs.current[index - 1].focus();
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = { phone, otp: otp.join("") };
    try {
      if (firstname) {
        const data = {
          phone,
          otp: otp.join(""),
          firstname,
          surname,
          day,
          month,
          year,
          gender,
          email,
          password,
        };
        console.log("Data = ", data);
        const response = await Api_Auth.create_account(data);
        setMessageSuccess(response.message);
        setIsSuccess(true);
      } else {
        const response = await Api_Auth.generate_token(data);
        localStorage.setItem("profile", JSON.stringify(response.data.profile.data.user));
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("userId", response.data.user.userId);
        localStorage.setItem("phone", response.data.user.phone);
        console.log("Response = ", response.data);
        setUserId(response.data.user.userId);
        setMessageSuccess(response.message);
        setIsSuccess(true);
      }
    } catch (err) {
      setMessageError(err.response.data.message);
      setIsError(true);
    }
  };
  const handleTryAgain = () => {
    setIsError(false);
  };
  const handleResentOTP = async () => {
    const data = { phone };
    try {
      const response = await Api_Auth.resent_otp(data);
      setIsResent(true);
    } catch (err) {
      setMessageError(err.response.data.message);
      setIsError(true);
    }
  };
  const handleSuccess = () => {
    // if (firstname) {
    //   navigator(config.routes.login, { state: { phone } });
    // } else {
    navigator(config.routes.chat);

    // }
  };

  return (
    <div className={cx("wrapper")}>
      <div className={cx("login-layout")}>
        <div className={cx("logo")}>
          <Link to={config.routes.homepage}>
            <h1>TingTing</h1>
          </Link>
        </div>
        <div className={cx("title")}>
          <h2>TingTing – Nơi bắt đầu những câu chuyện!</h2>
        </div>
        <div className={cx("body")}>
          <div className={cx("card-head")}>
            <p>Xác thực tài khoản</p>
          </div>
          <div className={cx("card-body")}>
            <div className={cx("font-light m-5 text-center")}>
              Nhập mã xác thực đã được gửi đến số điện thoại{" "}
              <span className={cx("text-blue-600")}>{phone}</span> của bạn để
              tiếp tục
            </div>
            <div className={cx("form-signin")}>
              <form onSubmit={handleSubmit} method="post">
                <div className="flex gap-2 justify-center">
                  {otp.map((value, index) => (
                    <input
                      key={index}
                      type="text"
                      maxLength="1"
                      value={value}
                      onChange={(e) => handleChange(e.target, index)}
                      onKeyDown={(e) => handleKeyDown(e, index)}
                      ref={(el) => (inputRefs.current[index] = el)}
                      className="w-12 h-12 text-center border rounded text-lg focus:outline-blue-500"
                    />
                  ))}
                </div>
                <div className={cx("flex justify-center mt-5")}>
                  <input
                    type="submit"
                    value="Xác thực"
                    className={cx(
                      "p-2 border font-medium rounded bg-blue-500 text-white cursor-pointer w-full hover:bg-blue-600"
                    )}
                  />
                </div>
              </form>
              <div className={cx("flex justify-center mt-5")}>
                <p className={cx("font-medium")}>
                  Bạn chưa nhận được mã?{" "}
                  <span
                    onClick={handleResentOTP}
                    className={cx(
                      "text-blue-500 hover:text-red-600 cursor-pointer"
                    )}
                  >
                    Gửi lại mã
                  </span>
                </p>
              </div>
              <div className={cx("flex justify-center mt-5")}>
                <p className={cx("font-medium")}>
                  <Link
                    to={config.routes.login}
                    className={cx("hover:text-red-500 mr-3")}
                  >
                    Đăng nhập
                  </Link>
                </p>
                <div>-</div>
                <p className={cx("font-medium ml-3")}>
                  <Link
                    to={config.routes.register}
                    className={cx("text-blue-500 hover:text-red-600")}
                  >
                    Đăng ký
                  </Link>
                </p>
              </div>
            </div>
          </div>
          <div className={cx("card-bottom", "flex")}>
            <div className={cx("w-30")}>
              <img src="image.png" alt="Image" />
            </div>
            <div>
              <h2 className={cx("font-medium")}>
                Nâng cao hiệu quả công việc với TingTing PC
              </h2>
              <p>
                Gửi file lớn lên đến 1GB, chụp màn hình, gọi video và nhiều tiện
                ích hơn nữa
              </p>
            </div>
            <div className={cx("w-30")}>
              <button className={cx("btn-down-app")}>Tải ngay</button>
            </div>
          </div>
        </div>
      </div>
      {isError && (
        <Modal
          isNotification={true}
          valid={false}
          title="Verify OTP Failed!"
          message={messageError}
          onClose={handleTryAgain}
        />
      )}
      {isSuccess && (
        <Modal
          isNotification={true}
          valid={true}
          title="Verify OTP Successful!"
          message={messageSuccess}
          onConfirm={handleSuccess}
          onClose={() => {
            console.log(messageSuccess);
          }}
        />
      )}
    </div>
  );
}
export default VerifyOTP;
