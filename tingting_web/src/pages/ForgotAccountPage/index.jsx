import classNames from "classnames/bind";
import styles from "./ForgotAccountPage.module.scss";
import { Link } from "react-router-dom";
import { useState } from "react";

import config from "../../config";

const cx = classNames.bind(styles);

function ForgotAccountPage() {
  const [phone, setPhone] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    // Xử lý logic tìm tài khoản ở đây
    console.log({
      phone,
    });
  }

  return (
    <div className={cx("wrapper")}>
      <div className={cx("logo")}>
      <Link to={config.routes.homepage}><p className={cx('text-3xl text-blue-500 font-bold fixed top-2 left-2  h-16 z-50')}>TingTing</p></Link>
      </div>
      <div className={cx("header")}>
        <div className={cx("nav")}>
          <form action="">
            <input
              type="text"
              placeholder="Nhập số điện thoại"
              className={cx(
                "p-2 outline-0 rounded-md border border-gray-400 mr-2"
              )}
            />
            <input
              type="text"
              placeholder="Nhập mật khẩu"
              className={cx(
                "p-2 outline-0 rounded-md border border-gray-400 mr-5"
              )}
            />
            <input
              type="submit"
              value="Đăng nhập"
              className={cx(
                "bg-blue-500 font-bold text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              )}
            />
            <Link
              to={config.routes.register}
              className={cx("text-blue-500 ml-5 font-bold")}
            >
              Đăng ký
            </Link>
          </form>
        </div>
      </div>
      <div className={cx("body-container")}>
        <div className={cx("flex justify-center items-center ")}>
          <div
            className={cx(" bg-white w-4/9 h-70 rounded-lg shadow-lg mt-5 p-5")}
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
                Vui lòng nhập số điện thoại di động để tìm kiếm tài khoản của
                bạn.
              </p>
              <form onSubmit={handleSubmit} className="flex flex-col items-center h-100 m-2">
                <input
                  type="text"
                  name="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full p-2 rounded-md border-1 border-gray-400"
                  placeholder="Nhập số điện thoại bạn cần tìm tài khoản"
                  pattern="0\d{9,10}"
                  title="Vui lòng nhập số điện thoại hợp lệ (bắt đầu bằng 0 - gồm 10, 11 chữ số)"
                  required
                />
                <div className={cx("border-t-1 border-gray-300 w-full mt-3 ")}>
                  <input
                    type="submit"
                    value="Tìm tài khoản"
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
      </div>
      <div className={cx("footer")}>@2021 TingTing. All rights reserved</div>
    </div>
  );
}

export default ForgotAccountPage;
