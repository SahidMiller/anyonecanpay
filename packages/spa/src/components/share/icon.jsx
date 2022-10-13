import iconList from "./icon-list.jsx";

const SocialIconStyle = {
  width: "100%",
  height: "auto",
  cursor: "pointer",
  border: 0,
  background: "#1A78F6",
  padding: "0.75rem",
  borderRadius: "0.5rem",
  fontSize: 0,
};

export default function Icon({ name, data, onClick }) {
  const { path, viewBox = "0 0 24 24", color, getUrl, displayName, onClick:onIconClick } = iconList[name];
  const url = getUrl(encodeURIComponent(data.url), data.text, data.title);

  const handleOnButtonClicked = (e) => {
    e.preventDefault();
    onClick && onClick(); // callback
    onIconClick ? onIconClick(data) : window.open(url, "_blank", "noopener");
  };

  return (
    <a href={url} target="_blank" class="flex flex-row items-center gap-8 border-b pb-3 sm:border-b-0 sm:pb-0 sm:justify-center sm:flex-col sm:gap-2">
      <div class="h-10 w-10">
      <button
        onClick={handleOnButtonClicked}
        aria-label={name}
        style={{ ...SocialIconStyle, background: color }}
      >
        <svg fill="white" viewBox={viewBox}>
          {path}
        </svg>
      </button>
      </div>
      <span class="text-center">{displayName}</span>
    </a>
  );
}