import React, { useState, useEffect } from "react";
import { FaRegFolderOpen, FaDownload, FaTrash, FaShare } from "react-icons/fa"; // Thêm icon xóa và chuyển tiếp
import StoragePage from "./StoragePage";
import { Api_chatInfo } from "../../../apis/Api_chatInfo";
import DocViewer, { DocViewerRenderers } from 'react-doc-viewer';


const GroupFile = ({ conversationId, onDeleteFile, onForwardFile }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [files, setFiles] = useState([]);
  const [previewFile, setPreviewFile] = useState(null);
  const [hoveredIndex, setHoveredIndex] = useState(-1);

  // Hàm lấy lại danh sách file từ API
  const fetchFiles = async () => {
    try {
      console.log("Gửi request đến API...");
      const response = await Api_chatInfo.getChatFiles(conversationId);
      console.log("Dữ liệu API trả về:", response);

      const fileData = Array.isArray(response) ? response : response?.data;

      if (Array.isArray(fileData)) {
        const sortedFiles = fileData.sort((a, b) => {
          return (new Date(b.createdAt) - new Date(a.createdAt)) || 0;
        });
        setFiles(sortedFiles.slice(0, 3).map(file => ({
          ...file,
          id: file?._id || file?.id, // Đảm bảo có ID
          messageId: file?.messageId, // Lấy messageId từ dữ liệu
        })));
      } else {
        setFiles([]);
        console.warn("API không trả về mảng hợp lệ");
      }
    } catch (error) {
      console.error("Lỗi khi lấy danh sách file:", error);
    }
  };

  useEffect(() => {
    if (!conversationId) return;
    fetchFiles();
  }, [conversationId]);

  const handleDownload = (file) => {
    if (!file?.linkURL) {
      console.error("Không có link file để tải.");
      return;
    }

    const link = document.createElement("a");
    link.href = file.linkURL;
    link.setAttribute("download", file.content || "file");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleMouseEnter = (index) => {
    setHoveredIndex(index);
  };

  const handleMouseLeave = () => {
    setHoveredIndex(-1);
  };

  const handleDeleteClick = async (fileToDelete, event) => {
    event.stopPropagation();
    if (!fileToDelete?.messageId) {
      console.error("Không có messageId file để xóa.");
      return;
    }

    try {
      const response = await Api_chatInfo.deleteMessage([fileToDelete.messageId]); // Truyền mảng messageIds
      console.log('[DELETE] Phản hồi API (xóa file):', response);

      if (response?.message) {
 
        // Gọi callback để thông báo messageId đã xóa và cập nhật lại danh sách file
        if (onDeleteFile) {
          onDeleteFile(fileToDelete.messageId);
        }
        fetchFiles(); // Gọi lại để cập nhật danh sách file sau khi xóa
      } else {
        console.error('[DELETE] Phản hồi API không mong đợi:', response);
     
      }
    } catch (error) {
      console.error('Lỗi khi xóa file:', error);
     
    }
  };

  const handleForwardClick = (fileItem, event) => {
    event.stopPropagation();
    if (onForwardFile && fileItem) {
      console.log("Chuyển tiếp file:", fileItem);
      onForwardFile(fileItem);
    }
  };

  return (
    <div className="mb-4">
      <h3 className="text-md font-semibold mb-2">Tệp tin</h3>
      <div className="space-y-2">
        {files.length > 0 ? (
          files.map((file, index) => (
            <div
              key={index}
              className="relative group flex items-center justify-between bg-gray-100 p-2 rounded-md"
              onMouseEnter={() => handleMouseEnter(index)}
              onMouseLeave={handleMouseLeave}
            >
              <a
                href={file.linkURL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 text-sm font-semibold truncate"
                style={{ maxWidth: '70%' }} // Để tránh tràn khi tên file dài
              >
                {file.content || "Không có tên"}
              </a>
              <div
                className={`absolute top-0 right-0 p-1 flex items-center bg-black bg-opacity-50 rounded-tr-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 space-x-1`}
              >
                <button
                  onClick={(event) => handleDeleteClick(file, event)}
                  className="text-gray-300 hover:text-red-500"
                  title="Xóa"
                >
                  <FaTrash size={16} />
                </button>
                <button
                  onClick={(event) => handleForwardClick(file, event)}
                  className="text-gray-300 hover:text-blue-500"
                  title="Chuyển tiếp"
                >
                  <FaShare size={16} />
                </button>
                <button
                  className="text-gray-300 hover:text-blue-500"
                  onClick={() => setPreviewFile(file)}
                  title="Xem trước"
                >
                  <FaRegFolderOpen size={16} />
                </button>
                <button
                  className="text-gray-300 hover:text-green-500"
                  onClick={() => handleDownload(file)}
                  title="Tải xuống"
                >
                  <FaDownload size={16} />
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-500 text-sm">Không có tệp nào.</p>
        )}
      </div>
      <button
        className="mt-2 flex items-center justify-center w-full bg-gray-200 text-gray-700 text-sm px-4 py-2 rounded hover:bg-gray-300"
        onClick={() => setIsOpen(true)}
      >
        Xem tất cả
      </button>
      {isOpen && (
        <StoragePage
          conversationId={conversationId}
          files={files}
          onClose={() => setIsOpen(false)}
          onDelete={fetchFiles}
        />
      )}

      {/* Modal xem trước file */}
      {previewFile && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-90 z-50">
          <div className="relative bg-white rounded-lg shadow-lg p-4 w-full h-full flex flex-col">
            <h2 className="font-bold text-xl text-center mb-4">{previewFile.content || "Xem nội dung"}</h2>
            <div className="flex-grow overflow-auto">
              <DocViewer
                documents={[{ uri: previewFile.linkURL }]}
                pluginRenderers={DocViewerRenderers}
                style={{ height: '100%' }}
              />
            </div>
            <div className="flex justify-between mt-4">
              <button
                className="absolute top-2 right-2 text-gray-500 hover:text-red-500"
                onClick={() => setPreviewFile(null)}
              >
                ✖
              </button>
              <button
                className="bg-blue-500 text-white px-4 py-2 rounded"
                onClick={() => handleDownload(previewFile)}
              >
                Tải xuống
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupFile;