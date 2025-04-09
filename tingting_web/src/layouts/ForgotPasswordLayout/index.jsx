import classNames from "classnames/bind";
import styles from "./ForgotAccountLayout.module.scss";
import { Link } from "react-router-dom";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Api_Auth } from "../../../apis/api_auth";
import config from "../../config";
import Modal from "../../components/Modal/Modal";

const cx = classNames.bind(styles);

function ForgotAccountLayout({ children }) {
  const navigator = useNavigate();
  const [phoneLogin, setPhoneLogin] = useState("");
  const [password, setPassword] = useState("");
  const [isError, setIsError] = useState(false);
  const [messageError, setMessageError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    const data = { phone: phoneLogin, password };
    console.log(data);

    try {
      const response = await Api_Auth.login(data);
      localStorage.setItem("token", response.data.token);
      navigator(config.routes.chat);
    } catch (err) {
      setMessageError(err.response.data.message);
      setIsError(true);
    }
  };
  const handleTryAgain = () => {
    setIsError(false);
  };

  return (
    <div className={cx("wrapper")}>
      <div className={cx("logo")}>
        <Link to={config.routes.homepage}>
          <p
            className={cx(
              "text-3xl text-blue-500 font-bold fixed top-2 left-2  h-16 z-50"
            )}
          >
            TingTing
          </p>
        </Link>
      </div>
      <div className={cx("header")}>
        <div className={cx("nav")}>
          <form onSubmit={handleLogin}>
            <input
              type="text"
              placeholder="Nhập số điện thoại"
              value={phoneLogin}
              onChange={(e) => setPhoneLogin(e.target.value)}
              className={cx(
                "p-2 outline-0 rounded-md border border-gray-400 mr-2"
              )}
            />
            <input
              type="password"
              placeholder="Nhập mật khẩu"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
      <div className={cx("body-container")}>{children}</div>s
      <div className={cx("footer")}>@2021 TingTing. All rights reserved</div>
      {isError && (
        <Modal
          valid={false}
          title="Login Failed!"
          message={messageError}
          isConfirm={true}
          onConfirm={handleTryAgain}
          contentConfirm={"Try again"}
          contentCancel="Login page"
        />
      )}
    </div>
  );
}

export default ForgotAccountLayout;
