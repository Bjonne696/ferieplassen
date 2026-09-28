import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useNotifications } from "../../hooks/useNotifications";
import supabase from "../../lib/supabaseClient";
import UserMenu from "./UserMenu";
const navigationLinks = [
  { to: "/", label: "Hjem" },
  { to: "/til-leie", label: "Til leie" },
  { to: "/nye-hytter", label: "Nye" },
  { to: "/popular", label: "Populære" },
  { to: "/kontakt", label: "Kontakt", adminOnly: true },
  { to: "/om-oss", label: "Om oss" },
  { to: "/min-profil", label: "Min Profil", userOnly: true },
  { to: "/admin", label: "Admin", adminOnly: true },
];

export default function Navigation() {
  const { user, profile } = useAuth();
  const { count } = useNotifications(user?.id);
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navRef = useRef(null);
  const menuButtonRef = useRef(null);

  useEffect(() => {
    if (!isMenuOpen) return;

    const handleOutsideClick = (e) => {
      if (navRef.current && !navRef.current.contains(e.target)) {
        setIsMenuOpen(false);
      }
    };

    const handleEscape = (e) => {
      if (e.key === "Escape") {
        setIsMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    };

    document.addEventListener("pointerdown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("pointerdown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isMenuOpen]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
    setIsMenuOpen(false);
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const links = navigationLinks.filter(
    ({ adminOnly, userOnly }) =>
      (!adminOnly || profile?.id === user?.id && profile?.role === "admin") &&
      (!userOnly || !!user)
  );

  const renderLinks = () => links.map(({ to, label }) => (
    <li className="main-navigation__item" key={to}>
      <Link
        className={`main-navigation__link${location.pathname === to ? ' is-active' : ''}`}
        to={to}
        aria-current={location.pathname === to ? 'page' : undefined}
        onClick={closeMenu}
      >
        {label}
      </Link>
    </li>
  ));

  return (
    <div className="main-navigation" ref={navRef}>
      <div className="main-navigation__content">
        <div className="main-navigation__brand">
          <Link className="main-navigation__logo-link" to="/" onClick={closeMenu}>
            <img className="main-navigation__logo" src="/logo.png" alt="Ferieplassen" />
            <span className="main-navigation__brand-name">Ferieplassen</span>
          </Link>
        </div>

        <nav className="main-navigation__section main-navigation__desktop" aria-label="Hovednavigasjon">
          <ul className="main-navigation__list">
            {renderLinks()}
          </ul>
        </nav>

        <div className="main-navigation__account">
          <button className="main-navigation__menu-toggle" ref={menuButtonRef} type="button" onClick={toggleMenu} aria-label="Mobilmeny" aria-expanded={isMenuOpen} aria-controls="mobile-navigation">
            {isMenuOpen ? '✕' : '☰'}
          </button>
          {user && <UserMenu className="main-navigation__profile-link" count={count} />}
          {user ? (
            <button className="main-navigation__auth-button main-navigation__auth-button--logout" type="button" onClick={handleLogout}>
              Logg ut
            </button>
          ) : (
            <Link className="main-navigation__auth-button" to="/login">
              Logg inn
            </Link>
          )}
        </div>

        <nav className={`main-navigation__mobile-menu${isMenuOpen ? ' is-open' : ''}`} id="mobile-navigation" aria-label="Mobilnavigasjon">
          {user && (
            <div className="main-navigation__mobile-account">
              <UserMenu className="main-navigation__profile-link" count={count} />
            </div>
          )}
          <ul className="main-navigation__list">
            {renderLinks()}
            <li className="main-navigation__item">
              {user ? (
                <button className="main-navigation__link" type="button" onClick={handleLogout}>
                  Logg ut
                </button>
              ) : (
                <Link className="main-navigation__link" to="/login" onClick={closeMenu}>
                  Logg inn
                </Link>
              )}
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
}
