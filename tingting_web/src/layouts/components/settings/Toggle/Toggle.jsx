function Toggle({ isOn, onChange }) {
  return (
    <div
      className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 ease-in-out ${
        isOn ? "bg-blue-600 justify-end" : "bg-gray-300 justify-start"
      }`}
      onClick={() => onChange(!isOn)}
    >
      <div className="bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out"></div>
    </div>
  );
}

export default Toggle;
