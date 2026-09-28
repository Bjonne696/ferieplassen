import React from 'react';
import Navigation from '../components/nav/Navigation';
import Footer from '../components/nav/Footer';
import SignIn from '../components/auth/SignIn';

export default function LoginPage() {
  return (
    <div className="page-wrapper page-layout login-page">
      <Navigation />
      <main className="main-content page-layout__content login-page__content" id="hovedinnhold" tabIndex={-1}>
        <SignIn />
      </main>
      <Footer />
    </div>
  );
}