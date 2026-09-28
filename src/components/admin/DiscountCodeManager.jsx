import React, { useState, useEffect, useId } from 'react';
import supabase from '../../lib/supabaseClient';

export default function DiscountCodeManager() {
  const id = useId();
  const [codes, setCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    code: '',
    duration_months: 1,
    valid_until: '',
    description: '',
  });
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const fetchCodes = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('discount_codes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Feil ved henting av rabattkoder:', error);
      setErrorMessage('Kunne ikke hente rabattkoder. Sjekk at tabellen finnes i databasen.');
    } else {
      setCodes(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCodes();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.code || !formData.valid_until) {
      alert('Vennligst fyll ut alle felt');
      return;
    }

    const { data, error } = await supabase
      .from('discount_codes')
      .insert({
        code: formData.code.toUpperCase(),
        duration_months: parseInt(formData.duration_months),
        valid_until: formData.valid_until,
        description: formData.description || null,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        setErrorMessage(`Rabattkoden "${formData.code.toUpperCase()}" finnes allerede.`);
      } else {
        console.error('Feil ved oppretting av rabattkode:', error);
        setErrorMessage('Kunne ikke opprette rabattkode. Sjekk at du har admin-rettigheter.');
      }
      setTimeout(() => setErrorMessage(''), 5000);
      return;
    }

    setCodes([data, ...codes]);
    setFormData({ code: '', duration_months: 1, valid_until: '', description: '' });
    setErrorMessage('');
    setSuccessMessage(`Rabattkode "${data.code}" opprettet!`);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleDelete = async (id, code) => {
    if (!window.confirm(`Er du sikker på at du vil slette rabattkoden "${code}"?`)) {
      return;
    }

    const { error } = await supabase
      .from('discount_codes')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Feil ved sletting av rabattkode:', error);
      setErrorMessage('Kunne ikke slette rabattkoden.');
      setTimeout(() => setErrorMessage(''), 5000);
      return;
    }

    setCodes(codes.filter(c => c.id !== id));
    setErrorMessage('');
    setSuccessMessage(`Rabattkode "${code}" slettet.`);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const toggleActive = async (id) => {
    const code = codes.find(c => c.id === id);
    if (!code) return;

    const { error } = await supabase
      .from('discount_codes')
      .update({ is_active: !code.is_active })
      .eq('id', id);

    if (error) {
      console.error('Feil ved endring av status:', error);
      setErrorMessage('Kunne ikke endre status på rabattkoden.');
      setTimeout(() => setErrorMessage(''), 5000);
      return;
    }

    setCodes(codes.map(c =>
      c.id === id ? { ...c, is_active: !c.is_active } : c
    ));
  };

  const isExpired = (validUntil) => {
    return new Date(validUntil) < new Date();
  };

  if (loading) {
    return (
      <div className="discount-code-manager">
        <h2 className="discount-code-manager__title">Rabattkoder</h2>
        <p className="discount-code-manager__empty-message discount-code-manager__loading">Laster rabattkoder...</p>
      </div>
    );
  }

  return (
    <div className="discount-code-manager">
      <h2 className="discount-code-manager__title">Rabattkoder</h2>

      {successMessage && <div className="discount-code-manager__success-message discount-code-manager__success">{successMessage}</div>}
      {errorMessage && <div className="discount-code-manager__success-message discount-code-manager__error-message discount-code-manager__error">{errorMessage}</div>}

      <form className="discount-code-manager__form" onSubmit={handleSubmit}>
        <div className="discount-code-manager__form-grid">
          <div className="discount-code-manager__field">
            <label className="discount-code-manager__label" htmlFor={`${id}-code`}>Kode-navn *</label>
            <input
              className="discount-code-manager__input"
              id={`${id}-code`}
              type="text"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              placeholder="SUMMER2025"
              maxLength={20}
            />
          </div>

          <div className="discount-code-manager__field">
            <label className="discount-code-manager__label" htmlFor={`${id}-duration`}>Varighet (måneder gratis) *</label>
            <select
              className="discount-code-manager__select"
              id={`${id}-duration`}
              value={formData.duration_months}
              onChange={(e) => setFormData({ ...formData, duration_months: e.target.value })}
            >
              <option value="1">1 måned</option>
              <option value="2">2 måneder</option>
              <option value="3">3 måneder</option>
              <option value="6">6 måneder</option>
              <option value="12">12 måneder</option>
            </select>
          </div>

          <div className="discount-code-manager__field">
            <label className="discount-code-manager__label" htmlFor={`${id}-valid-until`}>Gyldig til dato *</label>
            <input
              className="discount-code-manager__input"
              id={`${id}-valid-until`}
              type="date"
              value={formData.valid_until}
              onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          <div className="discount-code-manager__field">
            <label className="discount-code-manager__label" htmlFor={`${id}-description`}>Beskrivelse (valgfritt)</label>
            <input
              className="discount-code-manager__input"
              id={`${id}-description`}
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Velkomsttilbud - 1 mnd gratis"
            />
          </div>

          <div className="discount-code-manager__field discount-code-manager__submit-field align-end">
            <button className="button-base button discount-code-manager__button discount-code-manager__submit-button" type="submit">Opprett rabattkode</button>
          </div>
        </div>
      </form>

      <table className="discount-code-manager__table discount-code-manager__codes-table">
        <thead>
          <tr>
            <th className="discount-code-manager__table-heading discount-code-manager__column-heading">Kode</th>
            <th className="discount-code-manager__table-heading discount-code-manager__column-heading">Varighet</th>
            <th className="discount-code-manager__table-heading discount-code-manager__column-heading">Gyldig til</th>
            <th className="discount-code-manager__table-heading discount-code-manager__column-heading">Beskrivelse</th>
            <th className="discount-code-manager__table-heading discount-code-manager__column-heading">Status</th>
            <th className="discount-code-manager__table-heading discount-code-manager__column-heading">Handlinger</th>
          </tr>
        </thead>
        <tbody>
          {codes.map((code) => (
            <tr className="discount-code-manager__code-row" key={code.id}>
              <td className="discount-code-manager__table-cell discount-code-manager__code-value" data-label="Kode"><strong>{code.code}</strong></td>
              <td className="discount-code-manager__table-cell discount-code-manager__duration" data-label="Varighet">{code.duration_months} måned{code.duration_months > 1 ? 'er' : ''} gratis</td>
              <td className="discount-code-manager__table-cell discount-code-manager__expiry" data-label="Gyldig til">{new Date(code.valid_until).toLocaleDateString('nb-NO')}</td>
              <td className="discount-code-manager__table-cell discount-code-manager__description" data-label="Beskrivelse">{code.description || '—'}</td>
              <td className="discount-code-manager__table-cell discount-code-manager__status" data-label="Status">
                {isExpired(code.valid_until) ? (
                  <span className="discount-code-manager__status discount-code-manager__status-badge" data-active="false">Utløpt</span>
                ) : (
                  <span className="discount-code-manager__status discount-code-manager__status-badge" data-active={code.is_active ? 'true' : 'false'}>
                    {code.is_active ? 'Aktiv' : 'Inaktiv'}
                  </span>
                )}
              </td>
              <td className="discount-code-manager__table-cell discount-code-manager__actions-cell" data-label="Handlinger">
                <div className="discount-code-manager__actions">
                  <button
                    className="button-base button discount-code-manager__button discount-code-manager__toggle-button small"
                    type="button"
                    onClick={() => toggleActive(code.id)}
                    disabled={isExpired(code.valid_until)}
                  >
                    {code.is_active ? 'Deaktiver' : 'Aktiver'}
                  </button>
                  <button
                    className="button-base button discount-code-manager__button discount-code-manager__delete-button small"
                    type="button"
                    data-variant="delete"
                    onClick={() => handleDelete(code.id, code.code)}
                  >
                    Slett
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {codes.length === 0 && (
        <p className="discount-code-manager__empty-message discount-code-manager__empty">
          Ingen rabattkoder opprettet enda.
        </p>
      )}
    </div>
  );
}
