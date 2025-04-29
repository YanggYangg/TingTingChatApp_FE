import React, { useState, useEffect } from "react";
import { FaRegFolderOpen, FaDownload, FaTrash, FaShare } from "react-icons/fa";
import StoragePage from "./StoragePage";
import { Api_chatInfo } from "../../../apis/Api_chatInfo";
import DocViewer, { DocViewerRenderers } from "react-doc-viewer";
import ShareModal from "../chat/ShareModal";
import { initSocket } from "../../services/sockets/index";

const GroupFile = ({ conversationId, onDeleteFile, onForwardFile, userId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [files, setFiles] = useState([]);
  const [previewFile, setPreviewFile] = useState(null);
  const [hoveredIndex, setHoveredIndex] = useState(-1);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [fileToForward, setFileToForward] = useState(null);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!userId) return;
    const newSocket = initSocket(userId);
    setSocket(newSocket);
    return () => {
      newSocket.disconnect();
    };
  }, [userId]);

  const fetchFiles = async () => {
    if (!conversationId) return;

    try {
      const response = await Api_chatInfo.getChatFiles(conversationId);
      const fileData = Array.isArray(response) ? response : response?.data || [];
      const formattedFiles = fileData
        .map((file) => ({
          id: file?._id,
          content: file?.content || "Không có tên",
          linkURL: file?.linkURL,
          createdAt: file?.createdAt,
        }))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setFiles(formattedFiles.slice(0, 3));
    } catch (error) {
      console.error("Lỗi khi lấy file:", error);
      setFiles([]);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [conversationId]);

  useEffect(() => {
    if (!socket || !conversationId) return;

    socket.on("receiveMessage", (message) => {
      if (message.conversationId !== conversationId || message.messageType !== "file") return;

      const newFile = {
        id: message._id,
        content: message.content || "Không có tên",
        linkURL: message.linkURL,
        createdAt: message.createdAt,
      };

      setFiles((prev) => [newFile, ...prev].slice(0, 3));
    });

    socket.on("messageDeleted", (data) => {
      if (data.conversationId === conversationId) {
        setFiles((prev) => prev.filter((file) => file.id !== data.messageId));
      }
    });

    return () => {
      socket.off("receiveMessage");
      socket.off("messageDeleted");
    };
  }, [socket, conversationId]);

  const handleDownload = (file) => {
    if (!file?.linkURL) return;
    const link = document.createElement("a");
    link.href = file.linkURL;
    link.download = file.content;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleForwardClick = (fileItem) => {
    setFileToForward(fileItem);
    setIsShareModalOpen(true);
  };

  const handleShareModalClose = () => {
    setIsShareModalOpen(false);
    setFileToForward(null);
  };

  const handleFileShared = async (targetConversations, shareContent) => {
    if (!fileToForward?.id || !userId || !targetConversations?.length) return;

    try {
      const response = await Api_chatInfo.forwardMessage({
        messageId: fileToForward.id,
        targetConversationIds: targetConversations,
        userId,
        content: shareContent,
      });
      if (Array.isArray(response)) {
        setIsShareModalOpen(false);
        if (onForwardFile) {
          onForwardFile(fileToForward, targetConversations, shareContent);
        }
      }
    } catch (error) {
      console.error("Lỗi khi chuyển tiếp file:", error);
      alert("Không thể chuyển tiếp file. Vui lòng thử lại.");
    }
  };

  return (
    <div className="mb-4">
      <h3 className="text-md font-semibold mb-2">Tệp tin</h3>
      <div className="space-y-2">
        {files.length > 0 ? (
          files.map((file, index) => (
            <div
              key={file.id}
              className="relative group flex items-center justify-between bg-gray-100 p-2 rounded-md"
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(-1)}
            >
              <a
                href={file.linkURL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 text-sm font-semibold truncate"
                style={{ maxWidth: "70%" }}
              >
                {file.content}
              </a>
              <div
                className={`absolute top-0 right-0 p-1 flex items-center bg-black bg-opacity-50 rounded-tr-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 space-x-1`}
              >
                <button
                  onClick={() => handleForwardClick(file)}
                  className="text-gray-300 hover:text-blue-500"
                >
                  <FaShare size={16} />
                </button>
                <button
                  className="text-gray-300 hover:text-blue-500"
                  onClick={() => setPreviewFile(file)}
                >
                  <FaRegFolderOpen size={16} />
                </button>
                <button
                  className="text-gray-300 hover:text-green-500"
                  onClick={() => handleDownload(file)}
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
          onClose={() => setIsOpen(false)}
          onDelete={fetchFiles}
          userId={userId}
        />
      )}
      {previewFile && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-90 z-50">
          <div className="relative bg-white rounded-lg shadow-lg p-4 w-full h-full flex flex-col">
            <h2 className="font-bold text-xl text-center mb-4">{previewFile.content}</h2>
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
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={handleShareModalClose}
        onShare={handleFileShared}
        userId={userId}
        messageId={fileToForward?.id}
      />
    </div>
  );
};

export default GroupFile;