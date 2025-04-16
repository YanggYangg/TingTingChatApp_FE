import React, { useState, useEffect } from "react";
import { AiOutlineLink } from "react-icons/ai";
import { FaTrash, FaShare } from "react-icons/fa";
import StoragePage from "./StoragePage";
import { Api_chatInfo } from "../../../apis/Api_chatInfo";
import ShareModal from '../chat/ShareModal'; // Import ShareModal

const GroupLinks = ({ conversationId, onDeleteLink, onForwardLink, userId }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [links, setLinks] = useState([]);
    const [hoveredIndex, setHoveredIndex] = useState(-1);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [linkToForward, setLinkToForward] = useState(null);
    const [messageIdToForward, setMessageIdToForward] = useState(null); // Để truyền messageId của link

    const fetchLinks = async () => {
        try {
            const response = await Api_chatInfo.getChatLinks(conversationId);
            const linkData = Array.isArray(response) ? response : response?.data;

            console.log("Dữ liệu API trả về link:", response);
            if (Array.isArray(linkData)) {
                const filteredLinks = linkData
                    .filter((item) => item?.messageType === "link")
                    .map((item) => ({
                        id: item?._id || item?.id,
                        title: item?.content || "Không có tiêu đề",
                        url: item?.linkURL || "#",
                        date: item?.createdAt?.split("T")[0] || "Không có ngày",
                        sender: item?.userId || "Không rõ người gửi",
                        messageId: item?._id, // Lưu trữ messageId của link
                    }));

                const sortedLinks = filteredLinks.sort((a, b) => {
                    if (a.date && b.date) {
                        return new Date(b.date) - new Date(a.date);
                    } else {
                        return 0;
                    }
                });

                setLinks(sortedLinks.slice(0, 3));
            } else {
                setLinks([]);
                console.error("Dữ liệu không hợp lệ:", response);
            }
        } catch (error) {
            console.error("Lỗi khi lấy danh sách link:", error);
        }
    };

    useEffect(() => {
        if (!conversationId) return;
        fetchLinks();
    }, [conversationId]);

    const handleMouseEnter = (index) => {
        setHoveredIndex(index);
    };

    const handleMouseLeave = () => {
        setHoveredIndex(-1);
    };

    const handleDeleteClick = async (linkItem, event) => {
        event.stopPropagation();
        if (!linkItem?.id) {
            console.error("Không có id link để xóa.");
            return;
        }

        try {
            const response = await Api_chatInfo.deleteMessage([linkItem.id]);
            console.log('[DELETE] Phản hồi API (xóa link):', response);
            console.log("id link:", linkItem.id);
            if (response?.message) {
                console.log("Xóa link thành công:", response.message);
                if (onDeleteLink) {
                    onDeleteLink(linkItem.id);
                }
                setLinks(links.filter(link => link.id !== linkItem.id));
            } else {
                console.error('[DELETE] Phản hồi API không mong đợi:', response);
            }
        } catch (error) {
            console.error('Lỗi khi xóa liên kết:', error);
        }
    };

    const handleForwardClick = (linkItem, event) => {
        event.stopPropagation();
        setLinkToForward(linkItem);
        setMessageIdToForward(linkItem.messageId); // Lưu trữ messageId để chuyển tiếp
        setIsShareModalOpen(true);
        console.log("Yêu cầu chuyển tiếp link:", linkItem);
    };

    const handleShareModalClose = () => {
        setIsShareModalOpen(false);
        setLinkToForward(null);
        setMessageIdToForward(null);
    };

    const handleLinkShared = async (targetConversations, shareContent) => {
        if (!linkToForward?.messageId) {
            console.error("Không có ID tin nhắn để chuyển tiếp link.");
            return;
        }
        if (!userId) {
            console.error("Không có ID người dùng để chuyển tiếp link.");
            return;
        }
        if (!Array.isArray(targetConversations) || targetConversations.length === 0) {
            console.warn("Không có cuộc trò chuyện nào được chọn để chuyển tiếp link.");
            return;
        }

        try {
            const response = await Api_chatInfo.forwardMessage({
                messageId: linkToForward.messageId,
                targetConversationIds: targetConversations,
                userId: userId,
                content: shareContent,
            });

            console.log("Phản hồi API chuyển tiếp link:", response);
            if (response && Array.isArray(response)) {
                console.log(`Đã chuyển tiếp link đến ${response.length} cuộc trò chuyện.`);
                setIsShareModalOpen(false);
                setLinkToForward(null);
                setMessageIdToForward(null);
                if (onForwardLink) {
                    onForwardLink(linkToForward, targetConversations, shareContent);
                }
            } else if (response?.message) {
                console.error(`Lỗi chuyển tiếp link: ${response.message}`);
            } else {
                console.error("Lỗi không xác định khi chuyển tiếp link.");
            }
        } catch (error) {
            console.error("Lỗi khi gọi API chuyển tiếp link:", error);
        }
    };

    return (
        <div className="mb-4">
            <h3 className="text-md font-semibold mb-2">Liên kết</h3>
            <div className="space-y-2">
                {links.map((link, index) => (
                    <div
                        key={index}
                        className="relative group bg-gray-100 p-2 rounded-md"
                        onMouseEnter={() => handleMouseEnter(index)}
                        onMouseLeave={handleMouseLeave}
                    >
                        <div>
                            <p className="text-sm font-semibold truncate">{link.title}</p>
                            <a
                                href={link.url}
                                className="text-blue-500 text-xs truncate"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                {link.url}
                            </a>
                        </div>
                        <div
                            className={`absolute top-0 right-0 p-1 flex items-center bg-black bg-opacity-50 rounded-tr-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 space-x-1`}
                        >
                            <button
                                onClick={(event) => handleDeleteClick(link, event)}
                                className="text-gray-300 hover:text-red-500"
                                title="Xóa"
                            >
                                <FaTrash size={16} />
                            </button>
                            <button
                                onClick={(event) => handleForwardClick(link, event)}
                                className="text-gray-300 hover:text-blue-500"
                                title="Chuyển tiếp"
                            >
                                <FaShare size={16} />
                            </button>
                            <a
                                href={link.url}
                                className="text-gray-300 hover:text-blue-500"
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Mở liên kết"
                            >
                                <AiOutlineLink size={16} />
                            </a>
                        </div>
                    </div>
                ))}
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
                    links={links}
                    onClose={() => setIsOpen(false)}
                    onDelete={fetchLinks}
                />
            )}

            {/* Modal chia sẻ */}
            <ShareModal
                isOpen={isShareModalOpen}
                onClose={handleShareModalClose}
                onShare={handleLinkShared}
                userId={userId}
                messageId={messageIdToForward} // Truyền messageId của link
                messageToForward={linkToForward} // Có thể không cần thiết, tùy thuộc vào ShareModal
            />
        </div>
    );
};

export default GroupLinks;