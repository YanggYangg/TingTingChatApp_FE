"use client"

import classNames from "classnames/bind"
import styles from "./ForgotAccountPage.module.scss"
import { Link } from "react-router-dom"
import { useState } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { Api_Auth } from "../../../apis/api_auth"
import Modal from "../../components/Modal/Modal"
import config from "../../config"
import { ArrowLeft } from "lucide-react"

const cx = classNames.bind(styles)

function EnterOTP() {
  const navigator = useNavigate()
  const location = useLocation()
  const { phone, email } = location.state || {}

  const [otp, setOTP] = useState("")
  const [isError, setIsError] = useState(false)
  const [messageError, setMessageError] = useState("")

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const data = { otp, email }
      const response = await Api_Auth.verifyOTP(data)
      navigator(config.routes.updatePassword, {
        state: { phone, email },
      })
    } catch (error) {
      setMessageError(error.response.data.message)
      setIsError(true)
    }
  }

  const handleTryAgain = () => {
    setIsError(false)
  }

  return (
    <div className={cx("recovery-container")}>
      <div className={cx("recovery-card")}>
        <div className={cx("card-header")}>
          <h2 className={cx("card-title")}>Xác thực tài khoản</h2>
        </div>

        <div className={cx("card-body")}>
          <p className={cx("card-description")}>
            Vui lòng nhập mã OTP đã được gửi đến email <span className={cx("highlight")}>{email}</span> của bạn để xác
            nhận tài khoản.
          </p>

          <form onSubmit={handleSubmit} className={cx("recovery-form")}>
            <div className={cx("form-group")}>
              <input
                type="text"
                name="otp"
                value={otp}
                onChange={(e) => setOTP(e.target.value)}
                className={cx("form-input", "otp-input")}
                placeholder="Nhập mã OTP bạn đã nhận được"
                pattern="\d{6}"
                title="Vui lòng nhập mã OTP hợp lệ (6 chữ số)"
                maxLength={6}
                required
              />
            </div>

            <div className={cx("form-actions")}>
              <button type="submit" className={cx("primary-button")}>
                Xác thực
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
          title="Xác thực thất bại"
          message={messageError}
          isConfirm={true}
          onConfirm={handleTryAgain}
          contentConfirm={"Thử lại"}
          contentCancel="Đăng nhập"
        />
      )}
    </div>
  )
}

export default EnterOTP
