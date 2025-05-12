"use client"

import classNames from "classnames/bind"
import styles from "./Login.module.scss"
import { Link } from "react-router-dom"
import { MdOutlinePhoneIphone } from "react-icons/md"
import { IoLockClosed } from "react-icons/io5"
import { useState } from "react"
import { useNavigate } from "react-router-dom"

import { Api_Auth } from "../../../apis/api_auth";
import Modal from '../../components/Notification/Modal';
import config from "../../config";

const cx = classNames.bind(styles);

function Login() {
  const navigator = useNavigate()
  const [isError, setIsError] = useState(false)
  const [messageError, setMessageError] = useState("")
  const [phone, setPhoneNumber] = useState("")
  const [password, setPassword] = useState("")

  const handleSubmit = async (e) => {
    e.preventDefault()
    const data = { phone, password }
    try {
      const response = await Api_Auth.login(data); 
      navigator(config.routes.verifyOTP, {
        state: { phone }
      });
      
    } catch (err) {
      if(err.code === "ERR_NETWORK"){
        setMessageError("Không thể kết nối đến máy chủ!");
        setIsError(true);
      }
      else{
        setMessageError(err.response.data.message);
        setIsError(true);
      }
      

    }
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
        <div className={cx("title")}>
          <h2>Đăng nhập tài khoản TingTing để kết nối với ứng dụng TingTing Web</h2>
        </div>
        <div className={cx("body")}>
          <div className={cx("card-head")}>
            <p>Đăng nhập với mật khẩu</p>
          </div>
          <div className={cx("card-body")}>
            <div className={cx("form-signin")}>
              <form onSubmit={handleSubmit} method="post">
                <div className={cx("form-group")}>
                  <label htmlFor="phoneNumber">
                    <MdOutlinePhoneIphone className={cx("text-lg")} />
                  </label>
                  <input
                    type="text"
                    id="phoneNumber"
                    name="phoneNumber"
                    value={phone}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className={cx("w-full")}
                    required
                    pattern="[0-9]{10}"
                    title="Số điện thoại phải là 10 chữ số"
                    maxLength="10"
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
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    pattern="^\S{6,}$"
                    title="Mật khẩu phải có ít nhất 6 ký tự và không chứa khoảng trắng"
                    required
                    placeholder="Nhập mật khẩu"
                  />
                </div>
                <div className={cx("form-bottom")}>
                  <div className={cx("btn-submit")}>
                    <button type="submit">Đăng nhập với mật khẩu</button>
                    <div className={cx("hover:text-red-500")}>
                      <Link to={config.routes.verifyUser}>Quên tài khoản?</Link>
                    </div>
                  </div>
                  <div className={cx("another")}>
                    <Link to={config.routes.register}>
                      <button className={cx("hover:text-blue-800")}>Đăng ký tài khoản TingTing</button>
                    </Link>
                  </div>
                </div>
              </form>
            </div>
          </div>
          <div className={cx("card-bottom")}>
            {/* <div className={cx("w-30")}>
              <img src="image.png" alt="Image" />
            </div> */}
            <div>
              <h2 className={cx("font-medium")}>Nâng cao hiệu quả công việc với TingTing PC</h2>
              <p>Gửi file lớn lên đến 1GB, chụp màn hình, gọi video và nhiều tiện ích hơn nữa</p>
            </div>
            <div className={cx("w-30")}>
              <button className={cx("btn-down-app")}>Tải ngay</button>
            </div>
          </div>
        </div>
      </div>
      {
                isError && (
                    <Modal
                        isNotification={true}
                        valid={false}
                        title="Login Failed!"
                        message={messageError}
                        onClose= {handleTryAgain}
                    />
                )
            }
    </div>
  )
}

export default Login
