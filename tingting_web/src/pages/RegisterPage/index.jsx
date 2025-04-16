"use client";

import classNames from "classnames/bind";
import { Link } from "react-router-dom";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import config from "../../config";
import styles from "./RegisterPage.module.scss";
import Modal from "../../components/Notification/Modal";
import { Api_Auth } from "../../../apis/api_auth";
const cx = classNames.bind(styles);

function RegisterPage() {
  const navigator = useNavigate();
  const [firstname, setFirstName] = useState("");
  const [surname, setSurName] = useState("");
  const [day, setDay] = useState("1");
  const [month, setMonth] = useState("1");
  const [year, setYear] = useState("2025");
  const [gender, setGender] = useState("Male");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [isError, setIsError] = useState(false);
  const [messageError, setMessageError] = useState("");

  const months = [
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "10",
    "11",
    "12",
  ];
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => currentYear - 16 - i);
  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Xử lý logic đăng ký ở đây
    if (password !== passwordConfirm) {
      alert("Mật khẩu không khớp!");
      return;
    }
    try {
      const data = {
        firstname,
        surname,
        day,
        month,
        year,
        gender,
        email,
        phone,
        password,
      };
      console.log(data)
      const response = await Api_Auth.signUp(data);
      setIsSuccess(true);

      navigator(config.routes.verifyOTP, {
        state: {
          phone,
          ...data,
        },
      });
    } catch (err) {
      console.log(err.response.data.message);

      setIsError(true);
      if (err.code === "ERR_NETWORK") {
        setMessageError("Không thể kết nối đến máy chủ!");
      } else {
        setMessageError(err.response.data.message);
      }
    }
  };

  const handleLoginRedirect = () => {
    navigator("/login");
  };

  const handleTryAgain = () => {
    setIsError(false);
  };

  return (
    <div className={cx("wrapper")}>
      <div className={cx("login-layout")}>
        <div className={cx("logo")}>
          <Link to={config.routes.homepage}>
            <h1>TingTing</h1>
          </Link>
        </div>
        <div className={cx("body")}>
          <div className={cx("card-head")}>
            <h2>Tạo một tài khoản mới</h2>
            <p>Thật nhanh chóng và dễ dàng</p>
          </div>
          <div className={cx("card-body")}>
            <form onSubmit={handleSubmit}>
              <div className="flex flex-col sm:flex-row sm:space-x-2 mb-2">
                <input
                  type="text"
                  placeholder="Tên"
                  value={firstname}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="border p-2 rounded w-full sm:w-1/2 border-gray-300 mb-2 sm:mb-0"
                  pattern="^[A-Za-zÀ-Ỹà-ỹ\s]+$"
                  title="Tên chỉ được chứa chữ cái"
                  required
                />
                <input
                  type="text"
                  placeholder="Họ"
                  pattern="^[A-Za-zÀ-Ỹà-ỹ\s]+$"
                  title="Họ chỉ được chứa chữ cái"
                  value={surname}
                  onChange={(e) => setSurName(e.target.value)}
                  className="border p-2 rounded w-full sm:w-1/2 border-gray-300"
                  required
                />
              </div>

              <div className="mb-2">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Ngày sinh của bạn ?
                </label>
                <div className="flex flex-col sm:flex-row sm:space-x-2 space-y-2 sm:space-y-0">
                  <select
                    value={day}
                    onChange={(e) => setDay(e.target.value)}
                    className="border p-2 rounded w-full sm:w-1/3 border-gray-300"
                  >
                    {days.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                  <select
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                    className="border p-2 rounded w-full sm:w-1/3 border-gray-300"
                  >
                    {months.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                  <select
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    className="border p-2 rounded w-full sm:w-1/3 border-gray-300"
                  >
                    {years.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mb-2">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Giới tính
                </label>
                <div className="flex flex-wrap space-x-4">
                  <label className="inline-flex items-center mb-2">
                    <input
                      type="radio"
                      value="Female"
                      checked={gender === "Female"}
                      onChange={(e) => setGender(e.target.value)}
                      className="form-radio border-gray-300"
                    />
                    <span className="ml-2">Nữ</span>
                  </label>
                  <label className="inline-flex items-center mb-2">
                    <input
                      type="radio"
                      value="Male"
                      checked={gender === "Male"}
                      onChange={(e) => setGender(e.target.value)}
                      className="form-radio border-gray-300"
                    />
                    <span className="ml-2">Nam</span>
                  </label>
                  <label className="inline-flex items-center mb-2">
                    <input
                      type="radio"
                      value="Custom"
                      checked={gender === "Custom"}
                      onChange={(e) => setGender(e.target.value)}
                      className="form-radio border-gray-300"
                    />
                    <span className="ml-2">Khác</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Thông tin liên hệ của bạn ?
                </label>
              </div>

              <input
                type="email"
                placeholder="Địa chỉ email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border p-2 rounded w-full mb-2 border-gray-300"
                pattern="^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
                title="Địa chỉ email không hợp lệ"
                required
              />

              <input
                type="text"
                placeholder="Số điện thoại di động"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="border p-2 rounded w-full mb-2 border-gray-300"
                pattern="0\d{9,10}"
                title="Số điện thoại phải bắt đầu bằng 0 và có 10-11 chữ số"
                required
              />

              <input
                type="password"
                placeholder="Nhập mật khẩu mới"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border p-2 rounded w-full mb-2 border-gray-300"
                maxLength={32}
                minLength={6}
                pattern="^\S{6,}$"
                title="Mật khẩu phải có ít nhất 6 ký tự và không chứa khoảng trắng"
                required
              />

              <input
                type="password"
                placeholder="Nhập lại mật khẩu"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                className="border p-2 rounded w-full mb-4 border-gray-300"
                maxLength={32}
                minLength={6}
                pattern="^\S{6,}$"
                title="Mật khẩu phải có ít nhất 6 ký tự và không chứa khoảng trắng"
                required
              />

              <p className="text-xs text-gray-600 mb-4">
                Những người sử dụng dịch vụ của chúng tôi có thể đã tải thông
                tin liên hệ của bạn lên TingTing App.{" "}
                <a href="#" className="text-blue-600">
                  Tìm hiểu thêm
                </a>
                .
              </p>

              <p className="text-xs text-gray-600 mb-4">
                Những người sử dụng dịch vụ của chúng tôi có thể đã tải thông
                tin liên hệ của bạn lên Facebook.{" "}
                <a href="#" className="text-blue-600">
                  Điều khoản
                </a>
                ,{" "}
                <a href="#" className="text-blue-600">
                  Chính sách bảo mật
                </a>{" "}
                và{" "}
                <a href="#" className="text-blue-600">
                  Chính sách cookie{" "}
                </a>
                của chúng tôi. Bạn có thể nhận được thông báo qua SMS từ chúng
                tôi và có thể chọn không tham gia bất kỳ lúc nào.
              </p>

              <button
                type="submit"
                className="bg-green-500 text-white p-2 rounded w-full hover:bg-green-600 transition duration-200"
              >
                Đăng ký
              </button>
            </form>
          </div>

          <div className="text-center sm:text-left">
            <p className="mt-3 text-sm text-gray-600 mb-4">
              Bạn đã có tài khoản?{" "}
              <Link to={config.routes.login}>
                <button className={cx("nav-item", "text-blue-500")}>
                  Đăng nhập
                </button>
              </Link>
            </p>
          </div>

          <div className={cx("card-bottom")}>
            {/* <div className={cx("w-30")}>
              <img src="image.png" alt="Image" />
            </div> */}
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
          title="Register Failed!"
          message={messageError}
          onClose={handleTryAgain}
        />
      )}
      {isSuccess && (
        <Modal
          isNotification={true}
          valid={true}
          title="Register successful!"
          message={messageError}
          onClose={handleTryAgain}
        />
      )}
    </div>
  );
}

export default RegisterPage;
