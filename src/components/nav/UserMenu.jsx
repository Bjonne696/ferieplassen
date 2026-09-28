import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getPublicUrl } from '../../lib/storage';

export default function UserMenu({ count, className }) {
  const { user, profile } = useAuth();

  if (!user) return null;

  const avatarUrl = profile?.avatar_url
    ? getPublicUrl('avatars', profile.avatar_url)
    : null;

  const getInitials = () => {
    const firstName = profile?.name || user.user_metadata?.name || '';
    const lastName = profile?.last_name || user.user_metadata?.last_name || '';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || user.email?.charAt(0).toUpperCase() || 'U';
  };

  return (
    <Link className={[...new Set(['user-menu__avatar', 'profile-link', ...(className || '').split(/\s+/).filter(Boolean)])].join(' ')} to="/min-profil" aria-label={`Min profil${count > 0 ? `, ${count} nye varsler` : ''}`}>
      {avatarUrl ? (
        <img className="user-menu__avatar-image profile-link__avatar" src={avatarUrl} alt="" />
      ) : (
        <span className="user-menu__avatar-placeholder profile-link__placeholder" aria-hidden="true">{getInitials()}</span>
      )}
      {count > 0 && (
        <span className="user-menu__notification-badge profile-link__notification" aria-hidden="true">{count > 9 ? '9+' : count}</span>
      )}
    </Link>
  );
}
