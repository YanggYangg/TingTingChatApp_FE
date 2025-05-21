import React, { useState, useEffect } from "react";
import { FaRegFolderOpen, FaDownload, FaTrash, FaShare } from "react-icons/fa";
import StoragePageCloud from "./StoragePageCloud";
import DocViewer, { DocViewerRenderers } from "react-doc-viewer";
import axios from "axios";

const GroupFileCloud = ({
  conversationId,
  onDeleteFile,
  onForwardFile,
  userId,
  cloudMessages,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [files, setFiles] = useState([]);
  const [previewFile, setPreviewFile] = useState(null);
  const [hoveredIndex, setHoveredIndex] = useState(-1);
  const [selectedItems, setSelectedItems] = useState([]);
  const [isSelecting, setIsSelecting] = useState(false);
  const [data, setData] = useState({ files: [] });

  useEffect(() => {
    if (!conversationId || conversationId !== "my-cloud" || !cloudMessages)
      return;

    const fileMessages = cloudMessages
      .filter((msg) => {
        return (
          msg.fileUrls &&
          msg.filenames &&
          !msg.fileUrls.some((url) =>
            /\.(jpg|jpeg|png|gif|mp4|webm)$/i.test(url)
          )
        );
      })
      .map((msg) => ({
        id: msg.messageId,
        content: msg.filenames?.[0] || "Không có tên",
        linkURL: msg.fileUrls?.[0] || "",
      }));
    setFiles(fileMessages);
    setData({ files: fileMessages });
  }, [conversationId, cloudMessages]);

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

  const handleForwardClick = (file, event) => {
    event.stopPropagation();
    if (onForwardFile) onForwardFile(file);
  };

  const handleDeleteClick = async (file, event) => {
    event.stopPropagation();
    if (!file?.id) {
      console.error("Không có id file để xóa.");
      return;
    }

    try {
      const response = await axios.delete(
        `http://184.73.0.29:3000/api/messages/${file.id}`
      );
      if (response.data?.message) {
        if (onDeleteFile) onDeleteFile(file.id);
        const updatedFiles = files.filter((f) => f.id !== file.id);
        setFiles(updatedFiles);
        setData({ files: updatedFiles });
      }
    } catch (error) {
      console.error("Lỗi khi xóa file:", error);
    }
  };

  const handleDeleteInStorage = (deletedItems) => {
    const updatedFiles = files.filter(
      (file) => !deletedItems.some((item) => item.messageId === file.id)
    );
    setFiles(updatedFiles);
    setData({ files: updatedFiles });
  };

  return (
    <div className="mb-4">
      <h3 className="text-md font-semibold mb-2">Tệp tin</h3>
      <div className="space-y-2">
        {files.length > 0 ? (
          files.map((file, index) => (
            <div
              key={file.id || index}
              className="relative group flex items-center justify-between bg-gray-100 p-2 rounded-md"
              onMouseEnter={() => handleMouseEnter(index)}
              onMouseLeave={handleMouseLeave}
            >
              <a
                href={file.linkURL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 text-sm font-semibold truncate"
                style={{ maxWidth: "70%" }}
              >
                {file.content || "Không có tên"}
              </a>
              <div
                className={`absolute top-0 right-0 p-1 flex items-center bg-black bg-opacity-50 rounded-tr-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 space-x-1`}
              >
                <button
                  className="text-gray-300 hover:text-red-500"
                  title="Xóa"
                  onClick={(e) => handleDeleteClick(file, e)}
                >
                  <FaTrash size={16} />
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
        <StoragePageCloud
          conversationId={conversationId}
          onClose={() => setIsOpen(false)}
          onDelete={handleDeleteInStorage}
          userId={userId}
          cloudMessages={cloudMessages}
          initialTab="files" // Đặt tab mặc định khi mở từ GroupFileCloud
        />
      )}

      {previewFile && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-90 z-50">
          <div className="relative bg-white rounded-lg shadow-lg p-4 w-full h-full flex flex-col">
            <h2 className="font-bold text-xl text-center mb-4">
              {previewFile.content || "Xem nội dung"}
            </h2>
            <div className="flex-grow overflow-auto">
              <DocViewer
                documents={[{ uri: previewFile.linkURL }]}
                pluginRenderers={DocViewerRenderers}
                style={{ height: "100%" }}
              />
            </div>
            <div className="flex justify-between mt-4">
              <button
                className="absolute top-2 right-2 text-gray-500 hover:text-red-500"
                onClick={() => setPreviewFile(null)}
              >
                ✖
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupFileCloud;
