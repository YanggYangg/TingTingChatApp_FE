import classNames from "classnames/bind";
import styles from "./ContactItem.module.scss";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const cx = classNames.bind(styles);

const ContactItem = ({ href, icon, image, label, className }) => {
  return (
    <div className={cx("wrapper", className)}>
      <Link
        to={href} // Dùng `to` thay vì `href` cho React Router
        className={cx(
          "flex items-center px-3 py-4 text-black-700 font-medium hover:bg-gray-200 transition",
          className // Thêm class từ bên ngoài
        )}
      >
        {image ? (
          <img
            src={image}
            alt={label}
            className="h-10 w-10 mr-4 ml-2 rounded-full object-cover"
          />
        ) : (
          <FontAwesomeIcon icon={icon} className="h-5 w-10 pr-1" />
        )}
        {label}
      </Link>
    </div>
  );
};

export default ContactItem;
