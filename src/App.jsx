import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import MinProfilPage from './pages/MinProfilPage';
import AdminPage from './pages/AdminPage.jsx';
import KontaktPage from './pages/KontaktPage.jsx';
import OmOssPage from './pages/OmOssPage.jsx';
import TilLeiePage from './pages/TilLeiePage';
import NyeHytterPage from './pages/NyeHytterPage';
import PopularPage from './pages/PopularPage';
import NyHyttePage from './pages/NyHyttePage';
import ShowCabinPage from "./pages/ShowCabinPage";
import PersonvernPage from './pages/PersonvernPage';
import TermsOfSale from './pages/TermsOfSale';
import VippsCallbackPage from './pages/VippsCallbackPage';
import DemoPaymentPage from './pages/DemoPaymentPage';
import NotFoundPage from './pages/NotFoundPage';
import { useAuth } from './contexts/AuthContext.jsx';
import CookieBanner from './components/ui/CookieBanner';

const pageTitles = {
  '/': 'Hjem', '/login': 'Logg inn', '/register': 'Registrer deg',
  '/min-profil': 'Min profil', '/admin': 'Adminpanel', '/kontakt': 'Kontakt oss',
  '/om-oss': 'Om oss', '/til-leie': 'Til leie', '/nye-hytter': 'Nye ferieboliger',
  '/popular': 'Populære ferieboliger', '/ny-hytte': 'Opprett annonse',
  '/personvern': 'Personvern', '/salgsbetingelser': 'Salgsbetingelser',
  '/vipps/callback': 'Betalingsstatus', '/demo-payment': 'Demo-betaling',
};

function AdminRoute({ children }) {
  const { user, profile, loading } = useAuth();
  if (loading) return <main className="admin-route__loading" id="hovedinnhold" tabIndex={-1}><p className="admin-route__status" role="status">Kontrollerer tilgang …</p></main>;
  if (!user || profile?.id !== user.id || profile?.role !== 'admin') return <Navigate to="/" replace />;
  return children;
}

function App() {
  const { pathname } = useLocation();
  useEffect(() => {
    document.title = `${pageTitles[pathname] || (pathname.startsWith('/hytte/') ? 'Feriebolig' : 'Side ikke funnet')} | Ferieplassen`;
  }, [pathname]);
  return (
    <>
      <a className="skip-link" href="#hovedinnhold">Hopp til hovedinnhold</a>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/min-profil" element={<MinProfilPage />} />
        <Route path="/admin" element={<AdminRoute><AdminPage /></AdminRoute>} />
        <Route path="/kontakt" element={<AdminRoute><KontaktPage /></AdminRoute>} />
        <Route path="/om-oss" element={<OmOssPage />} />
        <Route path="/til-leie" element={<TilLeiePage />} />
        <Route path="/nye-hytter" element={<NyeHytterPage />} />
        <Route path="/popular" element={<PopularPage />} />
        <Route path="/ny-hytte" element={<NyHyttePage />} />
        <Route path="/hytte/:id" element={<ShowCabinPage />} />
        <Route path="/personvern" element={<PersonvernPage />} />
        <Route path="/salgsbetingelser" element={<TermsOfSale />} />
        <Route path="/vipps/callback" element={<VippsCallbackPage />} />
        <Route path="/demo-payment" element={<DemoPaymentPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <CookieBanner />
    </>
  );
}

export default App;