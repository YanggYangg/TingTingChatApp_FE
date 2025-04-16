import React from "react";
import classNames from "classnames/bind";
import PropTypes from "prop-types"; // Để định nghĩa kiểu dữ liệu của props
import styles from "./Modal.module.scss";
import { AiOutlineCheckCircle } from "react-icons/ai"; // Icon tích xanh
import { ImCancelCircle } from "react-icons/im";
import { useEffect } from "react";

const cx = classNames.bind(styles);
function Modal({
  isNotification = false,
  valid,
  title,
  message,
  onConfirm = () => {},
  onCancel,
  isCancel = false,
  isConfirm = false,
  contentConfirm,
  contentCancel,
  width,
  height,
  onClose,
}) {
  useEffect(() => {
    if(valid){
      const timer = setTimeout(() => {
        onClose();
        onConfirm();  
      }, 1000);
      
    }
    const timer = setTimeout(() => {
      onClose();
     
    }, 3000);

    return () => clearTimeout(timer);
  }, [onClose]);
  return (
    <div>
      {isNotification && (
        <div
          className={cx(
            " w-1/4 h-1/8 bg-white rounded-lg shadow-lg fixed top-2 right-2"
          )}
        >
          <div className={cx("flex h-full justify-start items-center m-auto")}>
            {valid ? (
              <div  className={cx("w-1/7 text-4xl p-3 mr-3 text-green-500")}>
                <AiOutlineCheckCircle />
              </div>
            ) : (
              <div className={cx("w-1/7 text-4xl p-3 mr-3 text-red-500")}>
                <ImCancelCircle />
              </div>
            )}
            <div className={cx("w-5/7 h-full p-1")}>
              <div className={cx("p-1 font-bold h-3/7")}>
                {title}
              </div>
              <div className={cx("p-1 h-4/7")}>{message}</div>
            </div>
            <div
              className={cx("flex justify-center items-center w-1/7 font-bold")}
              onClick={onClose}
            >
              <button>x</button>
            </div>
          </div>
        </div>
      )}
      { !isNotification && (
        <div
        className={styles.modal}
        style={{ width: width || "350px", height: height || "250px" }}
      >
        <div
          className={cx(
            " h-1/5 border-b-2 p-2 border-gray-300 flex justify-center items-center"
          )}
        >
          {valid ? (
            <AiOutlineCheckCircle className={styles.icon} />
          ) : (
            <ImCancelCircle
              style={{
                color: "red",
                fontSize: "50px",
                margin: "0 0 10px 0",
              }}
            />
          )}
        </div>
        <div className={cx("h-3/5 flex flex-col justify-center items-center")}>
          <h3>{title}</h3>
          <p>{message}</p>
        </div>

        <div className={cx("h-1/5 flex justify-center items-center")}>
          <button
            onClick={onConfirm}
            className={styles.confirmButton}
            style={{ display: isConfirm ? "block" : "none" }}
          >
            {contentConfirm}
          </button>
          <button
            onClick={onCancel}
            className={styles.cancelButton}
            style={{ display: isCancel ? "block" : "none" }}
          >
            {contentCancel}
          </button>
        </div>
      </div>
      )}
      
    </div>
  );
}

Modal.propTypes = {
  title: PropTypes.string.isRequired, // Tiêu đề modal
  message: PropTypes.string.isRequired, // Nội dung thông báo
  onConfirm: PropTypes.func.isRequired, // Hàm xử lý nút xác nhận
  onCancel: PropTypes.func.isRequired, // Hàm xử lý nút hủy
  contentButtonRight: PropTypes.string, // Nội dung nút bên phải
  contentButtonLeft: PropTypes.string, // Nội dung nút bên trái
};

export default Modal;
