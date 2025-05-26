// import React, { useState, useRef } from 'react';
// import axios from 'axios';
// import { FaPaperclip, FaSmile, FaRegImage, FaPaperPlane } from "react-icons/fa";
// import EmojiPicker from 'emoji-picker-react';

// function ChatFooter({ onReload }) {
//   const [message, setMessage] = useState('');
//   const [showEmojiPicker, setShowEmojiPicker] = useState(false);
//   const fileInputRef = useRef(null);

//   const userId = localStorage.getItem("userId")

//   const handleSendMessage = async () => {
//     if (!message.trim()) return;

//     try {
      
//       const res = await axios.post('http://184.73.0.29:3000/api/files/upload', {
//         userId,
//         content: message,
//       });

//       console.log("Sent message:", res.data);
//       setMessage('');

//       onReload && onReload(); // ✅ gọi lại sau khi gửi
//     } catch (error) {
//       console.error("Error sending message:", error);
//     }
//   };

//   const handleFileChange = async (e) => {
//     const files = Array.from(e.target.files);
//     if (files.length === 0) return;

//     const formData = new FormData();
//     formData.append('userId', userId);
//     formData.append('content', '');

//     files.forEach(file => {
//       formData.append('files', file);
//     });

//     try {
//       const res = await axios.post('http://184.73.0.29:3000/api/files/upload', formData, {
//         headers: {
//           'Content-Type': 'multipart/form-data',
//         },
//       });

//       console.log("Uploaded files:", res.data);

//       onReload && onReload(); // 
//     } catch (error) {
//       console.error('Upload error:', error);
//     }
//   };

//   return (
//     <div className="bg-white p-6 rounded-lg flex flex-col items-center border-t border-gray-300 relative">
//       {/* Nút chức năng */}
//       <div className="flex justify-start w-full space-x-4 mb-2">
//         <button
//           className="p-2 text-gray-500 hover:text-gray-700"
//           onClick={() => fileInputRef.current.click()}
//         >
//           <FaPaperclip size={20} />
//         </button>
//         <input
//           type="file"
//           ref={fileInputRef}
//           className="hidden"
//           multiple
//           onChange={handleFileChange}
//         />
//         <button
//           className="p-2 text-gray-500 hover:text-gray-700"
//           onClick={() => setShowEmojiPicker(!showEmojiPicker)}
//         >
//           <FaSmile size={20} />
//         </button>
//       </div>

//       {/* Emoji Picker */}
//       {showEmojiPicker && (
//         <div className="absolute bottom-24 left-3 bg-white shadow-md rounded-lg border border-gray-200 z-50">
//           <EmojiPicker onEmojiClick={(emoji) => setMessage((prev) => prev + emoji.emoji)} />
//         </div>
//       )}

//       {/* Input & Send */}
//       <div className="flex w-full items-center space-x-2">
//         <input
//           type="text"
//           className="flex-1 px-3 py-2 rounded-lg outline-none bg-white text-gray-700 border border-gray-300"
//           placeholder="Nhập tin nhắn..."
//           value={message}
//           onChange={(e) => setMessage(e.target.value)}
//         />
//         <button className="p-2 text-blue-500 hover:text-blue-700" onClick={handleSendMessage}>
//           <FaPaperPlane size={20} />
//         </button>
//       </div>
//     </div>
//   );
// }


// export default ChatFooter;
import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { FaPaperclip, FaSmile, FaPaperPlane } from "react-icons/fa";
import EmojiPicker from 'emoji-picker-react';

function ChatFooterCloud() {
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [error, setError] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const fileInputRef = useRef(null);

  const userId = localStorage.getItem("userId");

  const handleSendMessage = async () => {
    if (!message.trim()) return;
    if (!userId) {
      setError("Vui lòng đăng nhập để gửi tin nhắn!");
      return;
    }

    try {
      setError(null);
      setIsSending(true);
      const response = await axios.post('http://localhost:3000/api/messages/send', {
        userId,
        content: message,
      });
      console.log('Message sent successfully:', response.data);
      setMessage('');
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.message;
      console.error("Error sending message:", errorMsg);
      setError(`Lỗi khi gửi tin nhắn: ${errorMsg}`);
    } finally {
      setIsSending(false);
    }
  };

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    if (!userId) {
      setError("Vui lòng đăng nhập để gửi tin nhắn!");
      return;
    }

    // Kiểm tra kích thước tệp trước khi gửi
    const maxSize = 10 * 1024 * 1024; // 10MB
    const oversizedFiles = files.filter(file => file.size > maxSize);
    if (oversizedFiles.length > 0) {
      setError('Một số tệp quá lớn (giới hạn 10MB mỗi tệp)');
      return;
    }

    const formData = new FormData();
    formData.append('userId', userId);
    formData.append('content', message || '');
    files.forEach(file => {
      formData.append('files', file);
    });

    try {
      setError(null);
      setIsSending(true);
      const response = await axios.post('http://localhost:3000/api/files/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      console.log('Files uploaded successfully:', response.data);
      setMessage('');
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.message;
      console.error("Upload error:", errorMsg);
      setError(`Lỗi khi tải tệp: ${errorMsg}`);
    } finally {
      setIsSending(false);
    }
  };

  const handleEmojiClick = (emojiObject) => {
    setMessage((prev) => prev + emojiObject.emoji);
    setShowEmojiPicker(false);
  };

  // Tự động xóa thông báo lỗi sau 5 giây
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  return (
    <div className="bg-white p-6 rounded-lg flex flex-col items-center border-t border-gray-300 relative">
      {error && (
        <div className="w-full text-red-500 text-sm mb-2">
          {error}
        </div>
      )}
      <div className="flex justify-start w-full space-x-4 mb-2">
        <button
          className="p-2 text-gray-500 hover:text-gray-700"
          onClick={() => fileInputRef.current.click()}
          disabled={isSending}
        >
          <FaPaperclip size={20} />
        </button>
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          multiple
          onChange={handleFileChange}
          disabled={isSending}
        />
        <button
          className="p-2 text-gray-500 hover:text-gray-700"
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          disabled={isSending}
        >
          <FaSmile size={20} />
        </button>
      </div>

      {showEmojiPicker && (
        <div className="absolute bottom-24 left-3 bg-white shadow-md rounded-lg border border-gray-200 z-50">
          <EmojiPicker onEmojiClick={handleEmojiClick} />
        </div>
      )}

      <div className="flex w-full items-center space-x-2">
        <input
          type="text"
          className="flex-1 px-3 py-2 rounded-lg outline-none bg-white text-gray-700 border border-gray-300"
          placeholder="Nhập tin nhắn..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && !isSending && handleSendMessage()}
          disabled={isSending}
        />
        <button
          className={`p-2 ${isSending ? 'text-gray-400' : 'text-blue-500 hover:text-blue-700'}`}
          onClick={handleSendMessage}
          disabled={isSending}
        >
          {isSending ? (
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : (
            <FaPaperPlane size={20} />
          )}
        </button>
      </div>
    </div>
  );
}

export default ChatFooterCloud;
