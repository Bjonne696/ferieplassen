import { useId, useState } from 'react';
export default function ContactForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [invalidField, setInvalidField] = useState('');
  const id = useId();

  const handleChange = (e) => {
    if (invalidField === e.target.name) setInvalidField('');
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    const validation = !formData.name.trim() ? ['name', 'Navn er påkrevd']
      : !formData.email.trim() || !validateEmail(formData.email) ? ['email', 'Gyldig e-postadresse er påkrevd']
      : !formData.subject.trim() ? ['subject', 'Emne er påkrevd']
      : !formData.message.trim() ? ['message', 'Melding er påkrevd'] : null;
    if (validation) {
      setInvalidField(validation[0]);
      setError(validation[1]);
      document.getElementById(`${id}-${validation[0]}`)?.focus();
      return;
    }
    setInvalidField('');

    setLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-contact-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          subject: formData.subject,
          message: formData.message
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Feil ved sending av melding');
      }

      setSuccess(true);
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
      });
    } catch (err) {
      setError(err.message || 'Det oppstod en feil ved sending av meldingen. Prøv igjen senere.');
      console.error('Kontaktskjema feil:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {success && (
        <div className="contact-form__success-alert contact-form__success" role="status">
          <strong>Takk for din henvendelse!</strong><br />
          Vi har mottatt meldingen din og vil svare så snart som mulig.
        </div>
      )}

      {error && <div className="contact-form__error-message contact-form__error" id={`${id}-error`} role="alert">{error}</div>}

      <form className="contact-form contact-form__fields" onSubmit={handleSubmit} noValidate aria-busy={loading}>
        <div className="contact-form__row contact-form__row--two-column">
          <div className="contact-form__field">
            <label className="contact-form__label" htmlFor={`${id}-name`}>Navn *</label>
            <input className="contact-form__input" id={`${id}-name`} type="text" name="name" autoComplete="name" value={formData.name} onChange={handleChange} placeholder="Ditt fulle navn" required aria-invalid={invalidField === 'name'} aria-describedby={invalidField === 'name' ? `${id}-error` : undefined} />
          </div>

          <div className="contact-form__field">
            <label className="contact-form__label" htmlFor={`${id}-email`}>E-post *</label>
            <input className="contact-form__input" id={`${id}-email`} type="email" name="email" autoComplete="email" value={formData.email} onChange={handleChange} placeholder="din@epost.no" required aria-invalid={invalidField === 'email'} aria-describedby={invalidField === 'email' ? `${id}-error` : undefined} />
          </div>
        </div>

        <div className="contact-form__row contact-form__row--two-column">
          <div className="contact-form__field">
            <label className="contact-form__label" htmlFor={`${id}-phone`}>Telefon (valgfritt)</label>
            <input className="contact-form__input" id={`${id}-phone`} type="tel" name="phone" autoComplete="tel" value={formData.phone} onChange={handleChange} placeholder="12 34 56 78" />
          </div>

          <div className="contact-form__field">
            <label className="contact-form__label" htmlFor={`${id}-subject`}>Emne *</label>
            <input className="contact-form__input" id={`${id}-subject`} type="text" name="subject" value={formData.subject} onChange={handleChange} placeholder="Hva gjelder henvendelsen?" required aria-invalid={invalidField === 'subject'} aria-describedby={invalidField === 'subject' ? `${id}-error` : undefined} />
          </div>
        </div>

        <div className="contact-form__field">
          <label className="contact-form__label" htmlFor={`${id}-message`}>Melding *</label>
          <textarea className="contact-form__textarea contact-form__message" id={`${id}-message`} name="message" value={formData.message} onChange={handleChange} placeholder="Skriv din melding her..." rows="6" required aria-invalid={invalidField === 'message'} aria-describedby={invalidField === 'message' ? `${id}-error` : undefined} />
        </div>

        <button className="button-base contact-form__submit contact-form__submit-button" type="submit" disabled={loading}>
          {loading ? 'Sender...' : 'Send melding'}
        </button>
      </form>
    </>
  );
}