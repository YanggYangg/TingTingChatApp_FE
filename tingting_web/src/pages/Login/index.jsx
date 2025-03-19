import classNames from "classnames/bind";
import styles from "./Login.module.scss";
import { MdOutlinePhoneIphone } from "react-icons/md";
import { IoLockClosed } from "react-icons/io5";

const cx = classNames.bind(styles);

function Login() {
  return (
    <div className={cx("wrapper")}>
      <div className={cx("login-layout")}>
        <div className={cx("logo")}>
          <h1>TingTing</h1>
        </div>
        <div className={cx("title")}>
          <h2>
            Đăng nhập tài khoản TingTing để kết nối với ứng dụng TingTing Web
          </h2>
        </div>
        <div className={cx("body")}>
          <div className={cx("card-head")}>
            <p>Đăng nhập với mật khẩu</p>
          </div>
          <div className={cx("card-body")}>
            <div className={cx("form-signin")}>
              <form action="">
                <div className={cx("form-group")}>
                  <label htmlFor="phoneNumber">
                    <MdOutlinePhoneIphone className={cx("text-lg")} />
                  </label>
                  <input
                    type="phoneNumber"
                    id="phoneNumber"
                    name="phoneNumber"
                    placeholder="Số điện thoại"
                  />
                </div>
                <div className={cx("form-group")}>
                  <label htmlFor="password">
                    <IoLockClosed />
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    placeholder="Nhập mật khẩu"
                  />
                </div>
                <div className={cx("form-bottom")}>
                  <div className={cx("btn-submit")}>
                    <button type="submit">Đăng nhập với mật khẩu</button>
                     <a href="#">Quên mật khẩu?</a>
                  </div>
                    <div className={cx("another")}>
                      <button>Đăng nhập bằng mã QR</button>
                    </div>
                  
                </div>
              </form>
            </div>
          </div>
          <div className={cx("card-bottom", "flex")}>
            <div className={cx("w-30")}>
              <img src="image.png" alt="Image" />
            </div>
            <div>
              <h2 className={cx('font-medium')}>Nâng cao hiệu quả công việc với TingTing PC</h2>
              <p>Gửi file lớn lên đến 1GB, chụp màn hình, gọi video và nhiều tiện ích hơn nữa</p>
            </div>
            <div className={cx("w-30")}>
              <button className={cx('btn-down-app')}>Tải ngay</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
