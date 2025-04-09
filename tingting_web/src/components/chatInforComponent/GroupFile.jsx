import React, { useState, useEffect } from "react";
import { FaRegFolderOpen, FaDownload } from "react-icons/fa";
import StoragePage from "./StoragePage";
import { Api_chatInfo } from "../../../apis/Api_chatInfo";
import DocViewer, { DocViewerRenderers } from 'react-doc-viewer';

const GroupFile = ({ conversationId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [files, setFiles] = useState([]);
  const [previewFile, setPreviewFile] = useState(null);

  useEffect(() => {
    if (!conversationId) return;

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

          setFiles(sortedFiles.slice(0, 3));
        } else {
          setFiles([]);
          console.warn("API không trả về mảng hợp lệ");
        }
      } catch (error) {
        console.error("Lỗi khi lấy danh sách file:", error);
      }
    };

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

  return (
    <div className="mb-4">
      <h3 className="text-md font-semibold mb-2">Tệp tin</h3>
      <div className="space-y-2">
        {files.length > 0 ? (
          files.map((file, index) => (
            <div key={index} className="flex items-center justify-between bg-gray-100 p-2 rounded-md">
              <a
                href={file.linkURL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 text-sm font-semibold"
              >
                {file.content || "Không có tên"}
              </a>
              <div className="flex gap-2">
                <button 
                  className="text-gray-500 hover:text-blue-500"
                  onClick={() => setPreviewFile(file)} // Xem trước file
                >
                  <FaRegFolderOpen size={18} />
                </button>
                <button
                  className="text-gray-500 hover:text-blue-500"
                  onClick={() => handleDownload(file)}
                >
                  <FaDownload size={18} />
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
      {isOpen && <StoragePage conversationId={conversationId}  files={files} onClose={() => setIsOpen(false)} />}
      
      {/* Modal xem trước file */}
      {previewFile && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-90 z-50">
          <div className="relative bg-white rounded-lg shadow-lg p-4 w-full h-full flex flex-col">
            <h2 className="font-bold text-xl text-center mb-4">{previewFile.content || "Xem nội dung"}</h2>
            <div className="flex-grow overflow-auto">
              <DocViewer
                documents={[{ uri: previewFile.linkURL }]}
                pluginRenderers={DocViewerRenderers}
                style={{ height: '100%' }} // Đặt chiều cao cho DocViewer
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
                onClick={() => handleDownload(previewFile)} // Tải xuống khi nhấn nút
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