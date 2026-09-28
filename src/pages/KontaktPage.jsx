import Navigation from '../components/nav/Navigation.jsx';
import Footer from '../components/nav/Footer.jsx';
import ContactForm from '../components/contact/ContactForm.jsx';

export default function KontaktPage() {
  return (
    <div className="page-wrapper page-layout contact-page">
      <Navigation />
      <main className="main-content page-layout__content contact-page__content" id="hovedinnhold" tabIndex={-1}>
        <div className="contact-form contact-page__form-section">
          <h2 className="contact-form__title contact-page__title">Kontakt Oss</h2>

          <div className="contact-page__intro">
            <p>Vi vil gjerne høre fra deg! Send oss en melding så svarer vi så snart som mulig.</p>
            <p><strong>E-post:</strong> Your-Email@yourmail.com</p>
          </div>

          <ContactForm />

          <section className="contact-page__methods">
            <h3>Andre måter å kontakte oss på:</h3>
            <div className="contact-page__methods-grid">
              <div className="contact-page__method">
                <strong>E-post:</strong><br />
                <a className="contact-page__email-link" href="mailto:Your-Email@yourmail.com">Your-Email@yourmail.com</a>
              </div>
              <div className="contact-page__method">
                <strong>Responstid:</strong><br />
                Vanligvis innen 24 timer
              </div>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}