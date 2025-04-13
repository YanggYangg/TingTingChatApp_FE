"use client"

import classNames from "classnames/bind"
import styles from "./ForgotAccountPage.module.scss"
import { Link } from "react-router-dom"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Api_Auth } from "../../../apis/api_auth"
import Modal from "../../components/Modal/Modal"
import config from "../../config"
import { ArrowLeft } from "lucide-react"

const cx = classNames.bind(styles)

function VerifyUser() {
  const navigator = useNavigate()

  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [isError, setIsError] = useState(false)
  const [messageError, setMessageError] = useState("")

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const data = { phone, email }
      const response = await Api_Auth.forgotPassword(data)
      if (response.success === true) {
        navigator(config.routes.enterOTP, {
          state: { phone, email },
        })
      }
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
          <h2 className={cx("card-title")}>Tìm tài khoản của bạn</h2>
        </div>

        <div className={cx("card-body")}>
          <p className={cx("card-description")}>
            Vui lòng nhập số điện thoại di động và email để tìm kiếm tài khoản của bạn.
          </p>

          <form onSubmit={handleSubmit} className={cx("recovery-form")}>
            <div className={cx("form-group")}>
              <input
                type="text"
                name="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={cx("form-input")}
                placeholder="Nhập số điện thoại bạn cần tìm tài khoản"
                pattern="0\d{9,10}"
                title="Vui lòng nhập số điện thoại hợp lệ (bắt đầu bằng 0 - gồm 10, 11 chữ số)"
                required
              />
            </div>

            <div className={cx("form-group")}>
              <input
                type="text"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={cx("form-input")}
                placeholder="Nhập email đăng ký tài khoản"
                pattern="[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}"
                title="Vui lòng nhập địa chỉ email hợp lệ"
                required
              />
            </div>

            <div className={cx("form-actions")}>
              <button type="submit" className={cx("primary-button")}>
                Tìm tài khoản
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
          title="Không tìm thấy tài khoản"
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

export default VerifyUser
