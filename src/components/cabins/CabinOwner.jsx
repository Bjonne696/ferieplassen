import { getPublicUrl } from "../../lib/storage";
export default function CabinOwner({ owner, cabinLocation, className }) {
  if (!owner) return null;

  const avatarSrc = owner.avatar_url ? getPublicUrl("avatars", owner.avatar_url) : null;

  return (
      <div className={["cabin-owner", className].filter(Boolean).join(" ")}>
      {avatarSrc ? (
        <img className="cabin-owner__avatar" src={avatarSrc} alt="Eier" />
      ) : (
        <div className="cabin-owner__avatar-placeholder" aria-hidden="true" />
      )}
      <div className="cabin-owner__details">
        <p className="cabin-owner__name"><strong>Eier:</strong> {owner.name} {owner.last_name}</p>
        <p className="cabin-owner__location"><strong>Område:</strong> {cabinLocation || "Ikke spesifisert"}</p>
      </div>
    </div>
  );
}