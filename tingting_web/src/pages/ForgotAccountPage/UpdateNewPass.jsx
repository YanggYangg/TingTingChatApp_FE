import classNames from "classnames/bind";
import styles from "./ForgotAccountPage.module.scss";
import { Link } from "react-router-dom";
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import { Api_Auth } from "../../../apis/api_auth";
import Modal from "../../components/Notification/Modal";
import config from "../../config";

const cx = classNames.bind(styles)

function UpdateNewPass() {
  const navigator = useNavigate();
  const location = useLocation();
  const { phone } = location.state || {};
  const [newPassword, setNewPassword] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [isError, setIsError] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [messageError, setMessageError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const data = { newPassword, phone };
      if(newPassword !== confirmPass) {
        setMessageError("Mật khẩu không khớp, vui lòng nhập lại!");
        setIsError(true);
        return;
      }

      
      const response = await Api_Auth.updateNewPassword(data)
      setIsSuccess(true)
    } catch (error) {
      setMessageError(error.response.data.message)
      setIsError(true)
    }
  }

  const handleTryAgain = () => {
    setIsError(false)
  }

  const handleSuccess = () => {
    setIsSuccess(false)
    navigator(config.routes.login)
  }

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword)
  }

  return (
    <div className={cx("recovery-container")}>
      <div className={cx("recovery-card")}>
        <div className={cx("card-header")}>
          <h2 className={cx("card-title")}>Cập nhật mật khẩu mới</h2>
        </div>

        <div className={cx("card-body")}>
          <p className={cx("card-description")}>Vui lòng nhập mật khẩu mới cho tài khoản của bạn.</p>

          <form onSubmit={handleSubmit} className={cx("recovery-form")}>
            <div className={cx("form-group")}>
              <div className={cx("password-input-wrapper")}>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={cx("form-input")}
                  placeholder="Nhập mật khẩu mới"
                  minLength={6}
                  pattern="^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$"
                  title="Mật khẩu phải có ít nhất 6 ký tự, bao gồm chữ cái và số"
                  required
                />
                <button
                  type="button"
                  className={cx("password-toggle")}
                  onClick={togglePasswordVisibility}
                  tabIndex="-1"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className={cx("form-group")}>
              <div className={cx("password-input-wrapper")}>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={confirmPass}
                  onChange={(e) => setConfirmPass(e.target.value)}
                  className={cx("form-input")}
                  placeholder="Nhập lại mật khẩu mới"
                  minLength={6}
                  required
                />
                <button
                  type="button"
                  className={cx("password-toggle")}
                  onClick={toggleConfirmPasswordVisibility}
                  tabIndex="-1"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className={cx("form-actions")}>
              <button type="submit" className={cx("primary-button")}>
                Cập nhật
              </button>

              <Link to={config.routes.login} className={cx("secondary-button")}>
                <ArrowLeft size={16} />
                <span>Quay lại</span>
              </Link>
            </div>
          </form>
        </div>
      </div>

      {isError && (
        <Modal
          valid={false}
          isNotification={true}
          title="Update Failed!"
          message={messageError}
          
          onClose={handleTryAgain}
         
        />
      )}

      {isSuccess && (
              <Modal
                valid={true}
                title="Update New Password Successful!"
                message="You may now login with new password"
                isNotification={true}
                onConfirm={handleSuccess}
                onClose={() => console.log("close")}
              />
            )}
    </div>
  )
}

export default UpdateNewPass