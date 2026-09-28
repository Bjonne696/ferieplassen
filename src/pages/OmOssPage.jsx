import React from 'react';
import Navigation from '../components/nav/Navigation.jsx';
import Footer from '../components/nav/Footer.jsx';

export default function OmOssPage() {
  return (
    <div className="page-wrapper page-layout about-page">
      <Navigation />
      <main className="main-content page-layout__content about-page__content" id="hovedinnhold" tabIndex={-1}>
        <article className="about-page about-page__article">
          <h1 className="about-page__title">
            Om Oss
          </h1>

          <section className="about-page__section">
            <h2 className="about-page__section-title">
              En drøm som blir virkelighet!
            </h2>
            <p className="about-page__paragraph">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod
              tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim
              veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea
              commodo consequat.
            </p>

            <p className="about-page__paragraph">
              Duis aute irure dolor in reprehenderit in voluptate velit esse cillum
              dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non
              proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
            </p>

            <h2 className="about-page__section-title">
              Vår visjon
            </h2>
            <p className="about-page__paragraph">
              Pellentesque habitant morbi tristique senectus et netus et malesuada
              fames ac turpis egestas. Vestibulum tortor quam, feugiat vitae,
              ultricies eget, tempor sit amet, ante. Donec eu libero sit amet quam
              egestas semper.
            </p>

            <h2 className="about-page__section-title">
              Hva vi tilbyr
            </h2>
            <p className="about-page__paragraph">
              Aenean ultricies mi vitae est. Mauris placerat eleifend leo. Quisque sit
              amet est et sapien ullamcorper pharetra. Vestibulum erat wisi, condimentum
              sed, commodo vitae, ornare sit amet, wisi.
            </p>

            <p className="about-page__paragraph">
              Aenean fermentum, elit eget tincidunt condimentum, eros ipsum rutrum orci,
              sagittis tempus lacus enim ac dui. Donec non enim in turpis pulvinar
              facilisis. Ut felis.
            </p>

            <h2 className="about-page__section-title">
              Fremtiden
            </h2>
            <p className="about-page__paragraph">
              Curabitur pretium tincidunt lacus. Nulla gravida orci a odio. Nullam
              varius, turpis molestie dictum semper, nulla dui tincidunt felis, nec
              tristique dolor est a ante. Vivamus pretium aliquam magna.
            </p>

            <p className="about-page__closing-note">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod
              tempor incididunt ut labore et dolore magna aliqua.
            </p>
          </section>
        </article>
      </main>
      <Footer />
    </div>
  );
}