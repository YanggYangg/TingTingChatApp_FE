import classNames from "classnames/bind";
import styles from "./HomePage.module.scss";
import { Link } from "react-router-dom";
import { BiSolidDownload } from "react-icons/bi";
import { GiCheckMark } from "react-icons/gi";
import { TfiWorld } from "react-icons/tfi";
import config from "../../config";

const cx = classNames.bind(styles);

function HomePage() {
    return ( 
      <div>
        <div className={cx("wrapper")}>
             <div className={cx("logo")}>
             <Link to={config.routes.homepage}><p className={cx('text-3xl text-blue-500 font-bold fixed top-2 left-2  h-16 z-50')}>TingTing</p></Link>
                </div>
            <div className={cx("header")}>
                <div className={cx("nav")}>
                    <ul>
                        <Link to ><button className={cx('nav-item', 'text-blue-500')}>TINGTING WEB</button></Link>
                        <Link to ><button className={cx('nav-item')}>OFFICAL ACCOUNT</button></Link>
                        <Link to ><button className={cx('nav-item')}>NHÀ PHÁT TRIỂN</button></Link>
                        <Link to ><button className={cx('nav-item')}>BẢO MẬT</button></Link>
                        <Link to ><button className={cx('nav-item')}>TRỢ GIÚP</button></Link>
                        <Link to ><button className={cx('nav-item')}>LIÊN HỆ</button></Link>
                        <Link to ><button className={cx('nav-item')}>BÁO CÁO VI PHẠM</button></Link>
                        <Link to={config.routes.login} ><button className={cx('nav-item', 'text-blue-500')}>ĐĂNG NHẬP</button></Link>
                        <Link to={config.routes.register} ><button className={cx('nav-item', 'text-blue-500')}>ĐĂNG KÝ</button></Link>

                    </ul>
                </div>
            </div>
            <div className={cx("body-container")}>
                <div className={cx("module-page")}>
                    <h1 className={cx('')}>Tải TingTing PC cho máy tính </h1>
                    <h2>Ứng dụng TingTing PC đã có mặt trên Windows, Mac OS, Web</h2>
                    <div className={cx("content")}>
                    <div className={cx("content-left")}>
                        <ul>
                            <li><GiCheckMark className={cx('text-blue-500 mr-5')}/>Đăng nhập nhanh chóng</li>
                            <li ><GiCheckMark className={cx('text-blue-500 mr-5')}/>Gửi file, ảnh, video cực nhanh lên đến 1GB</li>
                            <li><GiCheckMark className={cx('text-blue-500 mr-5')}/>Đồng bộ hóa tin nhắn với điện thoại</li>
                            <li><GiCheckMark className={cx('text-blue-500 mr-5')}/>Tối ưu cho chat nhóm và trao đổi công việc</li>
                        </ul>
                        <div className={cx("download")}>
                            <Link to={config.routes.homepage}><button className={cx('download-button')}><BiSolidDownload className={cx('mr-3 text-xl')} />Tải Ngay</button></Link> 
                            <Link to={config.routes.login}><button className={cx('button-web')}><TfiWorld className={cx('mr-3 text-xl')} /> Dùng bản Web</button></Link>
                        </div>
                    </div>

                    <div className={cx("content-right")}>
                      
                    </div>
                </div>
           
            </div>
            
                      
        </div>
        <div className={cx("nav")}>
          <ul>
            <Link to>
              <button className={cx("nav-item", "text-blue-500")}>
                TINGTING WEB
              </button>
            </Link>
            <Link to>
              <button className={cx("nav-item")}>OFFICAL ACCOUNT</button>
            </Link>
            <Link to>
              <button className={cx("nav-item")}>NHÀ PHÁT TRIỂN</button>
            </Link>
            <Link to>
              <button className={cx("nav-item")}>BẢO MẬT</button>
            </Link>
            <Link to>
              <button className={cx("nav-item")}>TRỢ GIÚP</button>
            </Link>
            <Link to>
              <button className={cx("nav-item")}>LIÊN HỆ</button>
            </Link>
            <Link to>
              <button className={cx("nav-item")}>BÁO CÁO VI PHẠM</button>
            </Link>
            <Link to={config.routes.login}>
              <button className={cx("nav-item", "text-blue-500")}>
                ĐĂNG NHẬP
              </button>
            </Link>
          </ul>
        </div>
      </div>
      <div className={cx("body-container")}>
        <div className={cx("module-page")}>
          <h1 className={cx("")}>Tải TingTing PC cho máy tính </h1>
          <h2>Ứng dụng TingTing PC đã có mặt trên Windows, Mac OS, Web</h2>
          <div className={cx("content")}>
            <div className={cx("content-left")}>
              <ul>
                <li>
                  <GiCheckMark className={cx("text-blue-500 mr-5")} />
                  Đăng nhập nhanh chóng
                </li>
                <li>
                  <GiCheckMark className={cx("text-blue-500 mr-5")} />
                  Gửi file, ảnh, video cực nhanh lên đến 1GB
                </li>
                <li>
                  <GiCheckMark className={cx("text-blue-500 mr-5")} />
                  Đồng bộ hóa tin nhắn với điện thoại
                </li>
                <li>
                  <GiCheckMark className={cx("text-blue-500 mr-5")} />
                  Tối ưu cho chat nhóm và trao đổi công việc
                </li>
              </ul>
              <div className={cx("download")}>
                <Link to={config.routes.homepage}>
                  <button className={cx("download-button")}>
                    <BiSolidDownload className={cx("mr-3 text-xl")} />
                    Tải Ngay
                  </button>
                </Link>
                <Link to={config.routes.login}>
                  <button className={cx("button-web")}>
                    <TfiWorld className={cx("mr-3 text-xl")} /> Dùng bản Web
                  </button>
                </Link>
              </div>
            </div>

            <div className={cx("content-right")}></div>
          </div>
        </div>
      </div>
      <div className={cx("footer")}>@2021 TingTing. All rights reserved</div>
    </div>
  );
}

export default HomePage;
