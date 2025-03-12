import React from 'react';
import {FaSearch, FaUserFriends, FaUsers } from "react-icons/fa";

function Search(){
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
            onClick={() => console.log('Add friend')}/>
            <FaUsers 
            className="text-gray-500 mx-2 cursor-pointer" 
            size={20}
            onClick={() => console.log('Add group friend')}/>
        </div>

    );
}

export default Search;