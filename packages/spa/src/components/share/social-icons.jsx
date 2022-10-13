import Icon from "./icon.jsx";


export default function SocialIcons({
  onClose,
  sites,
  data,
  onClick,
}) {
  return (
    <section
      role="dialog"
      aria-modal="true"
      className="web-share-fade-in-up"
    >
      <div className="flex flex-col gap-5 p-5 sm:grid sm:grid-cols-4">
        {sites.map((name) => {
          return <Icon name={name} key={name} data={data} onClose={onClose} onClick={onClick} />
        })}
      </div>
    </section>
  );
}