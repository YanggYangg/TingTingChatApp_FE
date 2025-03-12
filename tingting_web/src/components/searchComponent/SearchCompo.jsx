import React, { useState } from 'react';
import {FaSearch, FaUserFriends, FaUsers } from "react-icons/fa";

function Search(){
    const [isModalFriendsOpen, setIsModalFriendsOpen] = useState(false);
    const [isModalGroupsOpen, setIsModalGroupsOpen] = useState(false);

    const toggleFriendsModal = () => {
        setIsModalFriendsOpen(!isModalFriendsOpen);
    };
    
    const toggleGroupsModal = () => {
        setIsModalGroupsOpen(!isModalGroupsOpen);
    };


    return(
        <div className="flex items-center bg-gray-200 px-3 py-2 rounded-full w-full relative">
            <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500" size={16} />
            <input
            type='text'
            placeholder='Tìm kiếm'
            className="bg-transparent text-gray-700 placeholder-gray-500 pl-10 pr-2 py-1 flex-grow focus:outline-none"
            onChange={() => console.log('Search')}
            />

            <FaUserFriends 
            className="text-gray-500 mx-2 cursor-pointer" 
            size={20}
            onClick={toggleFriendsModal}/>

            <FaUsers 
            className="text-gray-500 mx-2 cursor-pointer" 
            size={20}
            onClick={toggleGroupsModal}/>

      {isModalFriendsOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-md z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h2 className="text-xl font-semibold mb-4">Thêm bạn</h2>
            <input
              type="text"
              placeholder="Nhập số điện thoại"
              className="w-full p-2 border border-gray-300 rounded mb-4"
            />
            <div className="flex justify-end space-x-2">
              <button className="bg-gray-300 px-4 py-2 rounded" onClick={toggleFriendsModal}>
                Hủy
              </button>
              <button className="bg-blue-500 text-white px-4 py-2 rounded">Tìm kiếm</button>
            </div>
          </div>
        </div>
      )}

       {isModalGroupsOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-md z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h2 className="text-xl font-semibold mb-4">Tạo nhóm mới</h2>
            <input
              type="text"
              placeholder="Nhập tên nhóm"
              className="w-full p-2 border border-gray-300 rounded mb-4"
            />
            <div className="flex justify-end space-x-2">
              <button className="bg-gray-300 px-4 py-2 rounded" onClick={toggleGroupsModal}>
                Hủy
              </button>
              <button className="bg-green-500 text-white px-4 py-2 rounded">Tạo nhóm</button>
            </div>
          </div>
        </div>
      )}


        
        
        </div>

    );
}

export default Search;