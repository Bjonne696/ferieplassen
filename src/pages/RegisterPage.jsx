import React from 'react';
import Navigation from '../components/nav/Navigation';
import Footer from '../components/nav/Footer';
import SignUp from '../components/auth/SignUp';

export default function RegisterPage() {
  return (
    <div className="page-wrapper page-layout register-page">
      <Navigation />
      <main className="centered-main-content centered-page-content register-page__content" id="hovedinnhold" tabIndex={-1}>
        <SignUp />
      </main>
      <Footer />
    </div>
  );
}