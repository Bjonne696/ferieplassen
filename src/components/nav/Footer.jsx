import React from "react";
import { Link } from "react-router-dom";
import { FaFacebookF, FaInstagram, FaTiktok } from "react-icons/fa6";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer__content">
        <div className="site-footer__column">
          <p>
            <span className="site-footer__label">Bedrift:</span> Ferieplassen - Eid av Bjørn-Tore
          </p>
          <p>
            <span className="site-footer__label">E-post:</span>{" "}
            <a className="site-footer__email-link" href="mailto:Bjonne969@gmail.com">
              Bjonne969@gmail.com
            </a>
          </p>
        </div>
        <div className="site-footer__column">
          <p>www.ferieplassen.no</p>
          <p>
            <Link className="site-footer__link" to="/personvern">Personvern</Link>
          </p>
        </div>
        <div className="site-footer__column">
          <div className="site-footer__social-links">
            <span className="site-footer__icon" aria-hidden="true">
              <FaFacebookF />
            </span>
            <span className="site-footer__icon" aria-hidden="true">
              <FaTiktok />
            </span>
            <span className="site-footer__icon" aria-hidden="true">
              <FaInstagram />
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
