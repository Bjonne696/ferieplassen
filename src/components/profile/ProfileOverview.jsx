import React from 'react';
import AvatarUploader from './AvatarUploader';

export default function ProfileOverview({ profile, avatarUrl, isOwner, onUpload, onCreate }) {
  return (
    <div className="profile-overview">
      <div className="profile-overview__details">
        {avatarUrl ? <img className="profile-overview__avatar" src={avatarUrl} alt="Profilbilde" /> : <div className="profile-overview__avatar profile-overview__avatar--placeholder" aria-hidden="true" />}
        <p className="profile-overview__detail profile-overview__name">
          <strong>Navn:</strong>{" "}
          {`${profile.name ?? ""} ${profile.last_name ?? ""}`.trim() || "-"}
        </p>
        <p className="profile-overview__detail profile-overview__region"><strong>Område:</strong> {profile.region || "-"}</p>
      </div>
      <div className="profile-overview__actions">
        {isOwner && <AvatarUploader onUpload={onUpload} />}
        <button className="profile-action-button profile-overview__create-listing" type="button" onClick={onCreate}>Ny feriebolig</button>
      </div>
    </div>
  );
}