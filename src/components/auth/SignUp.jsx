import { useEffect, useId, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import supabase from '../../lib/supabaseClient';
import { ensureSignupProfile } from '../../utils/ensureSignupProfile';
import Tooltip from '../ui/Tooltip';
import HelpText from '../ui/HelpText';

const PROFILE_TIMEOUT_MS = 12000;

const withTimeout = (promise, timeoutMs, message) => {
  let timeoutId;
  const timeout = new Promise((_, reject) => {
    timeoutId = window.setTimeout(() => reject(new Error(message)), timeoutMs);
  });
  return Promise.race([promise, timeout]).finally(() => window.clearTimeout(timeoutId));
};

function SignUp() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [region, setRegion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [accountCreated, setAccountCreated] = useState(false);
  const [recoveringProfile, setRecoveringProfile] = useState(false);
  const submissionRef = useRef(false);
  const accountCreatedRef = useRef(false);
  const accountUserIdRef = useRef(null);
  const mountedRef = useRef(true);
  const id = useId();
  const navigate = useNavigate();
  const { getCurrentSessionUser, refreshProfile } = useAuth();

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const provisionProfile = async (profileUser) => ensureSignupProfile(
    profileUser,
    {
      email: profileUser.email ?? email.trim(),
      name: firstName.trim(),
      last_name: lastName.trim(),
      region: region.trim(),
    },
    {
      findById: async (userId) => {
        const { data, error: lookupError } = await withTimeout(
          supabase
            .from('profiles')
            .select('id')
            .eq('id', userId)
            .maybeSingle(),
          PROFILE_TIMEOUT_MS,
          'Profiloppslaget tok for lang tid. Prøv igjen fra Min Profil.',
        );
        if (lookupError) throw lookupError;
        return data;
      },
      insert: async (profile) => {
        const { error: insertError } = await withTimeout(
          supabase.from('profiles').insert(profile),
          PROFILE_TIMEOUT_MS,
          'Oppretting av profilen tok for lang tid. Ikke registrer deg på nytt.',
        );
        if (insertError) throw insertError;
      },
    },
  );

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password) => {
    return {
      length: password.length >= 8,
      hasLetter: /[a-zA-Z]/.test(password),
      hasNumber: /\d/.test(password),
    };
  };

  const validateForm = () => {
    const newErrors = {};

    if (!firstName.trim()) {
      newErrors.firstName = "Fornavn er påkrevd";
    } else if (firstName.trim().length < 2) {
      newErrors.firstName = "Fornavn må være minst 2 tegn";
    }

    if (!lastName.trim()) {
      newErrors.lastName = "Etternavn er påkrevd";
    } else if (lastName.trim().length < 2) {
      newErrors.lastName = "Etternavn må være minst 2 tegn";
    }

    if (!email.trim()) {
      newErrors.email = "E-post er påkrevd";
    } else if (!validateEmail(email)) {
      newErrors.email = "Ugyldig e-postformat";
    }

    const passwordValidation = validatePassword(password);
    if (!password) {
      newErrors.password = "Passord er påkrevd";
    } else if (!passwordValidation.length) {
      newErrors.password = "Passord må være minst 8 tegn";
    } else if (!passwordValidation.hasLetter) {
      newErrors.password = "Passord må inneholde minst én bokstav";
    } else if (!passwordValidation.hasNumber) {
      newErrors.password = "Passord må inneholde minst ett tall";
    }

    setFieldErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignUp = async (e) => {
    e.preventDefault();

    if (submissionRef.current || accountCreatedRef.current) return;
    if (!validateForm()) {
      return;
    }

    submissionRef.current = true;
    setLoading(true);
    setError(null);
    setStatus(null);
    setFieldErrors({});

    let signUpTimer;
    try {
      const signUpTimeout = new Promise((_, reject) => {
        signUpTimer = window.setTimeout(
          () => reject(new Error('Registreringen svarte ikke innen tidsgrensen. Kontoen kan være opprettet. Prøv å logge inn eller sjekk e-posten din før du forsøker igjen.')),
          20000,
        );
      });
      const { data, error: signUpError } = await Promise.race([
        supabase.auth.signUp({ email: email.trim(), password }),
        signUpTimeout,
      ]);
      window.clearTimeout(signUpTimer);

      if (signUpError) {
        if (mountedRef.current) {
          setError(signUpError.message || 'Registreringen kunne ikke fullføres. Prøv igjen.');
        }
        return;
      }

      const user = data?.user ?? data?.session?.user ?? null;
      if (!user?.id) {
        if (mountedRef.current) {
          setError('Registreringen ble ikke bekreftet av innloggingstjenesten. Prøv igjen eller kontakt kundestøtte.');
        }
        return;
      }

      accountCreatedRef.current = true;
      accountUserIdRef.current = user.id;
      if (!mountedRef.current) return;
      setAccountCreated(true);

      if (!data?.session) {
        const duplicateAccount = Array.isArray(user.identities) && user.identities.length === 0;
        setStatus(
          duplicateAccount
            ? 'Vi kan ikke bekrefte om denne adressen nettopp ble registrert. Hvis du allerede har en konto, logg inn. Ellers sjekk e-posten for en bekreftelseslenke. Ikke registrer deg på nytt før du har kontrollert dette.'
            : 'Registreringen er mottatt. Bekreft e-postadressen via lenken vi har sendt før du logger inn. Du trenger ikke registrere deg på nytt.',
        );
        return;
      }

      if (!mountedRef.current) return;
      await provisionProfile(user);
      if (!mountedRef.current) return;
      await refreshProfile(user.id);
      if (!mountedRef.current) return;
      navigate('/', { replace: true });
    } catch (signupError) {
      if (!mountedRef.current) return;
      const timedOut = signupError?.message?.includes('tidsgrensen');
      if (timedOut) {
        accountCreatedRef.current = true;
        setAccountCreated(true);
      }
      setError(
        accountUserIdRef.current
          ? `Kontoen er opprettet, men profiloppsettet ble ikke bekreftet: ${signupError?.message || 'ukjent feil'}. Ikke registrer deg på nytt. Prøv profilgjenoppretting eller logg inn senere.`
          : accountCreatedRef.current
            ? `Vi kunne ikke bekrefte om kontoen ble opprettet: ${signupError?.message || 'ukjent feil'}. Ikke registrer deg på nytt ennå. Sjekk e-posten eller prøv å logge inn, og bruk profilgjenoppretting når du har en aktiv økt.`
            : signupError?.message || 'Registreringen kunne ikke fullføres. Prøv igjen.',
      );
    } finally {
      window.clearTimeout(signUpTimer);
      submissionRef.current = false;
      if (mountedRef.current) setLoading(false);
    }
  };

  const handleProfileRecovery = async () => {
    if (submissionRef.current || !accountCreatedRef.current) return;
    submissionRef.current = true;
    setRecoveringProfile(true);
    setError(null);
    setStatus(null);
    try {
      const recoveredUser = await getCurrentSessionUser();
      if (!mountedRef.current) return;
      if (
        accountUserIdRef.current &&
        recoveredUser.id !== accountUserIdRef.current
      ) {
        throw new Error('Den innloggede kontoen er ikke kontoen som ble registrert her. Logg inn med riktig e-postadresse.')
      }
      if (
        !recoveredUser.email ||
        recoveredUser.email.trim().toLowerCase() !== email.trim().toLowerCase()
      ) {
        throw new Error('Logg inn med e-postadressen som ble brukt ved registreringen før profilen kan fullføres.')
      }

      accountUserIdRef.current = recoveredUser.id;
      await provisionProfile(recoveredUser);
      if (!mountedRef.current) return;
      await refreshProfile(recoveredUser.id);
      if (!mountedRef.current) return;
      navigate('/', { replace: true });
    } catch (recoveryError) {
      if (mountedRef.current) {
        setError(
          `Profilen kunne ikke fullføres: ${recoveryError?.message || 'ukjent feil'}. Du kan prøve profildelen på nytt uten å registrere kontoen igjen.`,
        );
      }
    } finally {
      submissionRef.current = false;
      if (mountedRef.current) setRecoveringProfile(false);
    }
  };


  return (
    <div className="sign-up">
      <h1 className="sign-up__title sign-up__heading" id={`${id}-heading`}>Opprett konto</h1>

      <HelpText icon="🎯">
        <strong>Velkommen til Ferieplassen!</strong><br />
        Opprett din konto for å leie ut din feriebolig eller finne drømmeboligen.
        Alle felt merket med * er påkrevd.
      </HelpText>

      <form className="sign-up__form" onSubmit={handleSignUp} aria-labelledby={`${id}-heading`} noValidate aria-busy={loading}>
        {Object.keys(fieldErrors).length > 0 && (
          <div className="sign-up__error" role="alert">Rett opp feilene i feltene nedenfor.</div>
        )}
        <div className="form-field sign-up__field">
          <label className="form-label sign-up__label" htmlFor={`${id}-firstName`}>Fornavn</label>
          <input
            className="form-input sign-up__input"
            id={`${id}-firstName`}
            type="text"
            autoComplete="given-name"
            required
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            aria-invalid={!!fieldErrors.firstName}
            aria-describedby={fieldErrors.firstName ? `${id}-firstName-error` : undefined}
          />
          {fieldErrors.firstName && (
            <div className="sign-up__error sign-up__field-error" id={`${id}-firstName-error`}>
              {fieldErrors.firstName}
            </div>
          )}
        </div>

        <div className="form-field sign-up__field">
          <label className="form-label sign-up__label" htmlFor={`${id}-lastName`}>Etternavn</label>
          <input
            className="form-input sign-up__input"
            id={`${id}-lastName`}
            type="text"
            autoComplete="family-name"
            required
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            aria-invalid={!!fieldErrors.lastName}
            aria-describedby={fieldErrors.lastName ? `${id}-lastName-error` : undefined}
          />
          {fieldErrors.lastName && (
            <div className="sign-up__error sign-up__field-error" id={`${id}-lastName-error`}>
              {fieldErrors.lastName}
            </div>
          )}
        </div>

        <div className="form-field sign-up__field">
          <label className="form-label sign-up__label" htmlFor={`${id}-email`}>E-postadresse</label>
          <input
            className="form-input sign-up__input"
            id={`${id}-email`}
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={!!fieldErrors.email}
            aria-describedby={fieldErrors.email ? `${id}-email-error` : undefined}
          />
          {fieldErrors.email && (
            <div className="sign-up__error sign-up__field-error" id={`${id}-email-error`}>
              {fieldErrors.email}
            </div>
          )}
        </div>

        <div className="form-field sign-up__field">
          <Tooltip text="Passordet bør være minst 8 tegn langt og inneholde både bokstaver og tall for sikkerhet.">
            <label className="form-label sign-up__label" htmlFor={`${id}-password`}>Passord</label>
          </Tooltip>
          <input
            className="form-input sign-up__input"
            id={`${id}-password`}
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Minst 8 tegn, bokstaver og tall"
            aria-invalid={!!fieldErrors.password}
            aria-describedby={fieldErrors.password ? `${id}-password-error` : undefined}
          />
          {fieldErrors.password && (
            <div className="sign-up__error sign-up__field-error" id={`${id}-password-error`}>
              {fieldErrors.password}
            </div>
          )}
        </div>

        <div className="form-field sign-up__field">
          <Tooltip text="Området ditt hjelper andre brukere å finne lokale feriebolig og gir deg relevante anbefalinger.">
            <label className="form-label sign-up__label" htmlFor={`${id}-region`}>Område (valgfritt)</label>
          </Tooltip>
          <input
            className="form-input sign-up__input"
            id={`${id}-region`}
            type="text"
            placeholder="Eks: Akershus, Oslo, Nordland..."
            value={region}
            onChange={(e) => setRegion(e.target.value)}
          />
        </div>

        {error && (
          <div className="sign-up__error" role="alert">
            {error}
            {accountCreated && <> <Link to="/login">Gå til innlogging</Link></>}
          </div>
        )}
        {status && (
          <div className="sign-up__error" role="alert">
            {status} <Link to="/login">Gå til innlogging</Link>
          </div>
        )}

        <button className="button-base sign-up__submit sign-up__submit-button" type="submit" disabled={loading || accountCreated}>
          {loading ? 'Registrerer...' : 'Registrer deg'}
        </button>
        {accountCreated && (
          <button className="button-base sign-up__recovery-button" type="button" onClick={handleProfileRecovery} disabled={loading || recoveringProfile}>
            {recoveringProfile ? 'Kontrollerer innlogging…' : 'Fullfør profilsynkronisering'}
          </button>
        )}
      </form>
    </div>
  );
}

export default SignUp;