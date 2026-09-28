import { useId, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../../lib/supabaseClient';

function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const id = useId();
  const navigate = useNavigate();

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!email.trim()) {
      newErrors.email = "E-post er påkrevd";
    } else if (!validateEmail(email)) {
      newErrors.email = "Ugyldig e-postformat";
    }

    if (!password) {
      newErrors.password = "Passord er påkrevd";
    } else if (password.length < 6) {
      newErrors.password = "Passord må være minst 6 tegn";
    }

    setFieldErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignIn = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);
    setFieldErrors({});

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
    } else {
      alert('Du er nå logget inn!');
      navigate("/");
    }

    setLoading(false);
  };

  return (
    <div className="sign-in">
      <h1 className="sign-in__title sign-in__heading" id={`${id}-heading`}>Logg inn på din konto</h1>
      <form className="sign-in__form" onSubmit={handleSignIn} aria-labelledby={`${id}-heading`} noValidate aria-busy={loading}>
        {Object.keys(fieldErrors).length > 0 && (
          <div className="sign-in__error" role="alert">Rett opp feilene i feltene nedenfor.</div>
        )}
        <div className="form-field sign-in__field">
          <label className="form-label sign-in__label" htmlFor={`${id}-email`}>E-postadresse</label>
          <input
            className="form-input sign-in__input"
            id={`${id}-email`}
            type="email"
            name="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={!!fieldErrors.email}
            aria-describedby={fieldErrors.email ? `${id}-email-error` : undefined}
          />
          {fieldErrors.email && (
            <div className="sign-in__error sign-in__field-error" id={`${id}-email-error`}>
              {fieldErrors.email}
            </div>
          )}
        </div>

        <div className="form-field sign-in__field">
          <label className="form-label sign-in__label" htmlFor={`${id}-password`}>Passord</label>
          <input
            className="form-input sign-in__input"
            id={`${id}-password`}
            type="password"
            name="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-invalid={!!fieldErrors.password}
            aria-describedby={fieldErrors.password ? `${id}-password-error` : undefined}
          />
          {fieldErrors.password && (
            <div className="sign-in__error sign-in__field-error" id={`${id}-password-error`}>
              {fieldErrors.password}
            </div>
          )}
        </div>

        {error && <div className="sign-in__error" role="alert">{error}</div>}

        <p className="sign-in__password-help sign-in__forgot-password-info">
          Tilbakestilling av passord er ikke tilgjengelig i denne demoen.
        </p>

        <button className="button-base button button--primary sign-in__submit-button" type="submit" disabled={loading}>
          {loading ? 'Logger inn...' : 'Logg inn'}
        </button>

        <p className="sign-in__register-info">Ikke registrert? Registrer deg her!</p>
        <button className="button-base button button--secondary sign-in__register-button" type="button" onClick={() => navigate('/register')}>
          Registrer deg
        </button>
      </form>
    </div>
  );
}

export default SignIn;