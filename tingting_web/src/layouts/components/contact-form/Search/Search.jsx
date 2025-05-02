import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";

import {
  faCircleXmark,
  faMagnifyingGlass,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";
import HeadlessTippy from "@tippyjs/react/headless";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useDebounce } from "../../../../hooks/index";

import classNames from "classnames/bind";
import styles from "./Search.module.scss";

const cx = classNames.bind(styles);

function Search({ className, value, onChange, }) {
  const [searchValue, setSearchValue] = useState("");
  const [searchResult, setSearchResult] = useState([]);
  const [showResult, setShowResult] = useState(true);
  const [loading, setLoading] = useState(false);
  

  // Debounce search value
  const debounced = useDebounce(searchValue, 500);

  const inputRef = useRef();

  const navigate = useNavigate();

  useEffect(() => {
    if (!debounced.trim()) {
      setSearchResult([]);
      return;
    }

    setLoading(true);

    // Axios search result
    // const fetchApi = async () => {
    //     setLoading(true);
    //     const result = await Api_Product.searchProduct(debounced);
    //     setSearchResult(result);
    //     setLoading(false);
    // };
    // fetchApi();
  }, [debounced]);

  // useEffect(() => {
  //     setTimeout(() => {
  //         setSearchResult([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  //     }, 0);
  // }, []);

  const handleClear = () => {
    // setSearchValue("");
    onChange(""); //clear
    inputRef.current.focus();
  };

  const handleHideResult = () => {
    setShowResult(false);
  };

  const handleChange = (e) => {
    const value = e.target.value;
    if (!value.startsWith(" ")) {
      //setSearchValue(e.target.value);
      onSearchChange(value); // <- gọi hàm cha truyền xuống
    }
  };

  //   const handleProductClick = (productId) => {
  //     // console.log('Navigating to product detail for ID:', productId);
  //     navigate(`/productdetail/${productId}`);
  //   };

  return (
    // Using a wrapper <div> or <span> tag around the reference element solves this by creating a new parentNode context.

    <div className={cx("search", className)}>
      <button
        className={cx("search-btn")}
        onMouseDown={(e) => e.preventDefault()}
      >
        {/* Search */}
        <FontAwesomeIcon icon={faMagnifyingGlass} />
      </button>
      <input
        className="outline-none"
        ref={inputRef}
        value={value}
        type="text"
        placeholder="Tìm bạn"
        spellCheck={false}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setShowResult(true)}
      />
       {value && (
        <button className="clear-btn" onClick={handleClear}>
          <FontAwesomeIcon icon={faCircleXmark} />
        </button>
      )}

    </div>
  );
}

export default Search;
