import classNames from "classnames/bind";
import styles from "./RegisterPage.module.scss";
import { Link } from "react-router-dom";
import { useState } from "react";

import config from "../../config";

const cx = classNames.bind(styles);

function RegisterPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [day, setDay] = useState("1");
  const [month, setMonth] = useState("Jan");
  const [year, setYear] = useState("2025");
  const [gender, setGender] = useState("Male");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");

  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const years = Array.from(
    { length: 100 },
    (_, i) => new Date().getFullYear() - i
  );
  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Xử lý logic đăng ký ở đây
    if (password !== passwordConfirm) {
      alert("Mật khẩu không khớp!");
      return;
    }
    console.log({
      firstName,
      lastName,
      day,
      month,
      year,
      gender,
      phone,
      password,
    });
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
              <div className="flex space-x-2 mb-2">
                <input
                  type="text"
                  placeholder="Tên"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="border p-2 rounded w-1/2 border-gray-300"
                  pattern="[A-Za-z]{1,}"
                  title="Tên chỉ được chứa chữ cái"
                  required
                />
                <input
                  type="text"
                  placeholder="Họ"
                  pattern="[A-Za-z]{1,}"
                  title="Họ chỉ được chứa chữ cái"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="border p-2 rounded w-1/2  border-gray-300"
                  required
                />
              </div>

              <div className="mb-2">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Ngày sinh của bạn ?
                </label>
                <div className="flex space-x-2">
                  <select
                    value={day}
                    onChange={(e) => setDay(e.target.value)}
                    className="border p-2 rounded w-1/3  border-gray-300"
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
                    className="border p-2 rounded w-1/3  border-gray-300"
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
                    className="border p-2 rounded w-1/3  border-gray-300"
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
                <div className="flex space-x-4">
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      value="Female"
                      checked={gender === "Female"}
                      onChange={(e) => setGender(e.target.value)}
                      className="form-radio  border-gray-300"
                    />
                    <span className="ml-2">Nữ</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      value="Male"
                      checked={gender === "Male"}
                      onChange={(e) => setGender(e.target.value)}
                      className="form-radio  border-gray-300"
                    />
                    <span className="ml-2">Nam</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      value="Custom"
                      checked={gender === "Custom"}
                      onChange={(e) => setGender(e.target.value)}
                      className="form-radio  border-gray-300"
                    />
                    <span className="ml-2">Khác</span>
                  </label>
                </div>
              </div>

              <input
                type="text"
                placeholder="Số điện thoại di động"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="border p-2 rounded w-full mb-2  border-gray-300"
                pattern="0\d{9,10}"
                title="Số điện thoại phải bắt đầu bằng 0 và có 10-11 chữ số"
                required
              />

              <input
                type="password"
                placeholder="Nhập mật khẩu mới"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border p-2 rounded w-full mb-2  border-gray-300"
                maxLength={32}
                minLength={6}
                title="Mật khẩu phải từ 6 đến 32 ký tự"
                required
              />
              <input
                type="password"
                placeholder="Nhập lại mật khẩu"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                className="border p-2 rounded w-full mb-4  border-gray-300"
                maxLength={32}
                minLength={6}
                title="Mật khẩu phải từ 6 đến 32 ký tự"
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
          <div>
            <p className="mt-3 ml-30 text-sm text-gray-600 mb-4">
              Bạn đã có tài khoản ?{" "}
              <Link to={config.routes.login}>
                <button className={cx("nav-item", "text-blue-500")}>
                  Đăng nhập
                </button>
              </Link>
            </p>
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
    </div>
  );
}

export default RegisterPage;
