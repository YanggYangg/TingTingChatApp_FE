import classNames from "classnames/bind";
import styles from "./ForgotAccountLayout.module.scss";
import { Link } from "react-router-dom";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Api_Auth } from "../../../apis/api_auth";
import config from "../../config";
import Modal from "../../components/Notification/Modal";
import { RiCloseLine, RiMenu3Line } from "react-icons/ri";

const cx = classNames.bind(styles);

function ForgotAccountLayout({ children }) {
  const navigator = useNavigate();
  const [phoneLogin, setPhoneLogin] = useState("");
  const [password, setPassword] = useState("");
  const [isError, setIsError] = useState(false);
  const [messageError, setMessageError] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

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
    <div className={cx("page-container")}>
      {/* Header */}
      <header className={cx("header")}>
        <div className={cx("header-container")}>
          <Link to={config.routes.homepage} className={cx("logo")}>
            <span className={cx("logo-text")}>TingTing</span>
          </Link>

          <div className={cx("nav-container")}>
            <button
              className={cx("menu-toggle")}
              onClick={toggleMenu}
              aria-label="Toggle menu"
            >
              {menuOpen ? <RiCloseLine size={24} /> : <RiMenu3Line size={24} />}
            </button>

            <nav className={cx("nav", { "nav-open": menuOpen })}>
              <ul className={cx("nav-list")}>
                <li>
                  <Link to="#" className={cx("nav-link", "active")}>
                    TINGTING WEB
                  </Link>
                </li>
                <li>
                  <Link to="#" className={cx("nav-link")}>
                    OFFICIAL ACCOUNT
                  </Link>
                </li>
                <li>
                  <Link to="#" className={cx("nav-link")}>
                    NHÀ PHÁT TRIỂN
                  </Link>
                </li>
                <li>
                  <Link to="#" className={cx("nav-link")}>
                    BẢO MẬT
                  </Link>
                </li>

                <li>
                  <Link to="#" className={cx("nav-link")}>
                    BÁO CÁO VI PHẠM
                  </Link>
                </li>
              </ul>
            </nav>

            <div className={cx("user-actions")}>
              <form onSubmit={handleLogin} className={cx("login-form")}>
                <input
                  type="text"
                  placeholder="Nhập số điện thoại"
                  value={phoneLogin}
                  onChange={(e) => setPhoneLogin(e.target.value)}
                  className={cx("login-input")}
                />
                <input
                  type="password"
                  placeholder="Nhập mật khẩu"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={cx("login-input")}
                />
                <button type="submit" className={cx("login-submit")}>
                  Đăng nhập
                </button>
                <Link
                  to={config.routes.register}
                  className={cx("register-link")}
                >
                  Đăng ký
                </Link>
              </form>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className={cx("main")}>
        <div className={cx("body-container")}>{children}</div>
      </div>

      {/* Footer */}
      <footer className={cx("footer")}>
        <div className={cx("footer-container")}>
          <p className={cx("copyright")}>
            © 2021 TingTing. All rights reserved
          </p>
        </div>
      </footer>

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
