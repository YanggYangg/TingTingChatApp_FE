"use client"

import classNames from "classnames/bind"
import styles from "./HomePage.module.scss"
import { Link } from "react-router-dom"
import { BiSolidDownload } from "react-icons/bi"
import { GiCheckMark } from "react-icons/gi"
import { TfiWorld } from "react-icons/tfi"
import { RiMenu3Line, RiCloseLine } from "react-icons/ri"
import { useState } from "react"
import config from "../../config"

const cx = classNames.bind(styles)

function HomePage() {
  const [menuOpen, setMenuOpen] = useState(false)

  const toggleMenu = () => {
    setMenuOpen(!menuOpen)
  }

  return (
    <div className={cx("page-container")}>
      {/* Header */}
      <header className={cx("header")}>
        <div className={cx("header-container")}>
          <Link to={config.routes.homepage} className={cx("logo")}>
            <span className={cx("logo-text")}>TingTing</span>
          </Link>

          <div className={cx("nav-container")}>
            <button className={cx("menu-toggle")} onClick={toggleMenu} aria-label="Toggle menu">
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
                    TRỢ GIÚP
                  </Link>
                </li>
                <li>
                  <Link to="#" className={cx("nav-link")}>
                    LIÊN HỆ
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
              <Link to={config.routes.login} className={cx("login-btn")}>
                ĐĂNG NHẬP
              </Link>
              <Link to={config.routes.register} className={cx("register-btn")}>
                ĐĂNG KÝ
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={cx("main")}>
        <div className={cx("content-box")}>
          <div className={cx("content-container")}>
            <div className={cx("text-content")}>
              <h1 className={cx("main-title")}>Tải TingTing PC cho máy tính</h1>
              <h2 className={cx("subtitle")}>Ứng dụng TingTing PC đã có mặt trên Windows, Mac OS, Web</h2>

              <ul className={cx("feature-list")}>
                <li className={cx("feature-item")}>
                  <GiCheckMark className={cx("check-icon")} />
                  <span>Gửi file, ảnh, video cực nhanh lên đến 1GB</span>
                </li>
                <li className={cx("feature-item")}>
                  <GiCheckMark className={cx("check-icon")} />
                  <span>Đồng bộ hóa tin nhắn với điện thoại</span>
                </li>
                <li className={cx("feature-item")}>
                  <GiCheckMark className={cx("check-icon")} />
                  <span>Tối ưu cho chat nhóm và trao đổi công việc</span>
                </li>
              </ul>

              <div className={cx("action-buttons")}>
                <Link to={config.routes.homepage} className={cx("download-btn")}>
                  <BiSolidDownload className={cx("btn-icon")} />
                  <span>Tải ngay</span>
                </Link>
                <Link to={config.routes.login} className={cx("web-btn")}>
                  <TfiWorld className={cx("btn-icon")} />
                  <span>Dùng bản Web</span>
                </Link>
              </div>
            </div>

            <div className={cx("image-content")}>
              <div className={cx("device-image")}></div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className={cx("footer")}>
        <div className={cx("footer-container")}>
          <p className={cx("copyright")}>© 2021 TingTing. All rights reserved</p>
        </div>
      </footer>
    </div>
  )
}

export default HomePage
