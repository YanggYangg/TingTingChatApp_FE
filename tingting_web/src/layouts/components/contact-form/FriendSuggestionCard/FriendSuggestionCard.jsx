import Avatar from "../Avatar/Avatar";

export default function FriendSuggestionCard({
  id,
  name,
  mutualFriends,
  avatar,
  onIgnore,
  onAddFriend,
}) {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-4 flex items-center">
        <Avatar src={avatar} name={name} size="md" />
        <div className="ml-3">
          <h3 className="font-medium">{name}</h3>
          <p className="text-sm text-gray-500">{mutualFriends} nhóm chung</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 p-2">
        <button
          onClick={() => onIgnore(id)}
          className="py-2 px-4 bg-gray-200 hover:bg-gray-300 rounded text-center text-gray-800 transition-colors"
        >
          Bỏ qua
        </button>
        <button
          onClick={() => onAddFriend(id)}
          className="py-2 px-4 bg-blue-600 hover:bg-blue-700 rounded text-center text-white transition-colors"
        >
          Kết bạn
        </button>
      </div>
    </div>
  );
}
