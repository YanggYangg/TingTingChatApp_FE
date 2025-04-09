import React from "react";
import classNames from "classnames/bind";
import PropTypes from "prop-types"; // Để định nghĩa kiểu dữ liệu của props
import styles from "./Modal.module.scss";
import { AiOutlineCheckCircle } from "react-icons/ai"; // Icon tích xanh
import { ImCancelCircle } from "react-icons/im";

const cx = classNames.bind(styles);
function Modal({
  valid,
  title,
  message,
  onConfirm,
  onCancel,
  isCancel = false,
  isConfirm = false,
  contentConfirm,
  contentCancel,
  width,
  height,
}) {
  return (
    <div className={styles.overlay}>
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
