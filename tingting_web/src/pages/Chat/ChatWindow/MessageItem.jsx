import {
    IoReturnDownBack,
    IoArrowRedoOutline,
    IoTrashOutline,
} from "react-icons/io5";

const MessageItem = ({ msg, currentUserId, onReply, onForward, onRevoke }) => {
    const isCurrentUser = msg.userId === currentUserId;
    const messageId = msg._id || msg.id; // Unified way to get message ID

    const handleRevokeClick = () => {
        if (onRevoke && messageId) {
            console.log("Revoking message with ID:", messageId);
            onRevoke(messageId);
        } else {
            console.error("Cannot revoke message: missing onRevoke or message ID");
        }
    };

    const handleForwardClick = () => {
        if (onForward && msg) {
            console.log("Forwarding message with ID:", messageId);
            onForward(msg);
        } else {
            console.error("Cannot forward message: missing onForward or message object");
        }
    };

    return (
        <div
            className={`flex ${isCurrentUser ? "justify-end" : "justify-start"} mb-4 relative`}
        >
            <div
                className={`p-3 rounded-lg w-fit max-w-xs relative group ${isCurrentUser ? "bg-blue-200 text-black" : "bg-gray-200 text-black"}`}
            >
                {!isCurrentUser && (
                    <p className="text-xs font-semibold text-gray-700">{msg.sender}</p>
                )}

                {/* Message Content */}
                {msg.messageType === "text" && <p>{msg.content}</p>}
                {msg.messageType === "image" && (
                    <img
                        src={msg.linkURL}
                        className="w-40 h-auto rounded-lg"
                        alt="Ảnh"
                    />
                )}
                {/* {msg.messageType === "file" && (
                    <a
                        href={msg.linkURL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-2"
                    >
                        {/* Add file icon and name here if needed */}
                {/* </a>
                )} */}

                <p className="text-xs text-gray-500 text-right mt-1">{msg.time}</p>

                {/* Action Buttons on Hover */}
                <div
                    className={`absolute top-[-36px] ${isCurrentUser ? "right-0" : "left-0"} flex space-x-2 opacity-0 group-hover:opacity-100 pointer-events-auto transition-opacity duration-200`}
                >
                    <button
                        onClick={() => onReply(msg)}
                        title="Trả lời"
                        className="p-1 rounded-full bg-white/80 hover:bg-blue-100 transition-all shadow-md hover:scale-110 text-gray-600 hover:text-blue-600"
                    >
                        <IoReturnDownBack size={18} />
                    </button>
                    <button
                        onClick={handleForwardClick}
                        title="Chuyển tiếp"
                        className="p-1 rounded-full bg-white/80 hover:bg-green-100 transition-all shadow-md hover:scale-110 text-gray-600 hover:text-green-600"
                    >
                        <IoArrowRedoOutline size={18} />
                    </button>
                    {isCurrentUser && (
                        <button
                            onClick={handleRevokeClick}
                            title="Thu hồi"
                            className="p-1 rounded-full bg-white/80 hover:bg-red-100 transition-all shadow-md hover:scale-110 text-gray-600 hover:text-red-500"
                        >
                            <IoTrashOutline size={18} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MessageItem;