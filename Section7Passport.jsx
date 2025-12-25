import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { loadApplication, saveSectionData } from '@/components/storage';
import ProgressBar from '../components/ProgressBar';
import SectionCard from '../components/SectionCard';
import ConditionalField from '../components/ConditionalField';
import { COUNTRIES } from '../components/utils/countries';
import DateInput from '../components/DateInput';

const PASSPORT_VALIDATION = {
  'br': /^[A-Z]{2}\d{6}$/, // Brazil: 2 letters, 6 numbers
  'us': /^\d{9}$/ // USA: 9 numbers
};

const Section7Passport = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const appId = new URLSearchParams(location.search).get('appId');

  const [application, setApplication] = useState(null);
  const [formData, setFormData] = useState({
    passportNumber: '',
    passportIssuingCountry: 'br', // Default to 'br' (Brazil)
    passportIssuingCity: '',
    passportIssuingState: '',
    issuanceDate: '',
    expirationDate: '',
    hasLostPassport: false,
    lostPassports: []
  });

  const [validation, setValidation] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const countryList = COUNTRIES.map(c => ({ name: c.name, value: c.iso2 }));

  useEffect(() => {
    if (!appId || appId === 'null' || appId === 'undefined') {
      navigate(createPageUrl("Dashboard"));
      return;
    }

    const fetchApplication = async () => {
      try {
        const app = await loadApplication(appId);
        setApplication(app);

        const passportData = app.data?.passport || {};
        if (!passportData.lostPassports) passportData.lostPassports = [];
        
        // Garante que o país emissor padrão seja 'br' (Brasil) se não estiver definido
        if (!passportData.passportIssuingCountry) {
            passportData.passportIssuingCountry = 'br';
        }

        setFormData((prev) => ({ ...prev, ...passportData }));
      } catch (error) {
        navigate(createPageUrl("Dashboard"));
      }
      setIsLoading(false);
    };

    fetchApplication();
  }, [appId, navigate]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (validation[field]) {
      setValidation((prev) => ({ ...prev, [field]: null }));
    }
  };

  const handleLostPassportChange = (index, field, value) => {
    const newLostPassports = [...formData.lostPassports];
    newLostPassports[index][field] = value;
    setFormData(prev => ({ ...prev, lostPassports: newLostPassports }));
  };

  const addLostPassport = () => {
    setFormData(prev => ({
      ...prev,
      lostPassports: [...prev.lostPassports, { number: '', country: 'br', explanation: '' }]
    }));
  };

  const removeLostPassport = (index) => {
    setFormData(prev => ({
      ...prev,
      lostPassports: prev.lostPassports.filter((_, i) => i !== index)
    }));
  };

  const validateSection = () => {
    const schema = schemas.passport;
    if (!schema) {
      setValidation({});
      return true;
    }
    const { ok, errors } = validateWithSchema(schema, formData);
    setValidation(toValidationMap(errors));
    return ok;
  };

  const nextSection = async () => {
    const appId = new URLSearchParams(location.search).get('appId');
    if (!appId || appId === 'null' || appId === 'undefined') {
      alert("Erro: ID da aplicação não encontrado. Não é possível continuar.");
      navigate(createPageUrl("Dashboard"));
      return;
    }
    
    if (validateSection()) {
      setIsSaving(true);
      try {
        const updatedApp = await saveSectionData(application, 'passport', formData);
        setApplication(updatedApp);
        navigate(createPageUrl(`Section9Family?appId=${appId}`));
      } catch (error) {
        console.error("Failed to save passport data:", error);
      } finally {
        setIsSaving(false);
      }
    }
  };

  const prevSection = () => {
    if (appId && appId !== 'null' && appId !== 'undefined') {
      navigate(createPageUrl(`Section6AddressPhone?appId=${appId}`));
    } else {
      navigate(createPageUrl("Dashboard"));
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ProgressBar application={application} currentSectionId="passport" />

      <div className="max-w-3xl mx-auto p-4 pt-8">
        <SectionCard
          icon="🛂"
          title="Informações do Passaporte"
          subtitle="Forneça os detalhes do seu passaporte ou documento de viagem."
        >
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Número do Passaporte</label>
                <input
                  type="text"
                  value={formData.passportNumber}
                  onChange={(e) => handleInputChange('passportNumber', e.target.value.toUpperCase())}
                  className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${validation.passportNumber ? 'border-red-500' : ''}`}
                />
                {validation.passportNumber && (
                  <p className="text-sm text-red-600 mt-1">{validation.passportNumber}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">País que Emitiu o Passaporte</label>
                <select
                  value={formData.passportIssuingCountry}
                  onChange={(e) => handleInputChange('passportIssuingCountry', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                >
                  {countryList.map(country => (
                    <option key={country.value} value={country.value}>{country.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Onde o passaporte foi emitido?</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Cidade</label>
                  <input
                    type="text"
                    value={formData.passportIssuingCity}
                    onChange={(e) => handleInputChange('passportIssuingCity', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Estado/Província/Região</label>
                  <input
                    type="text"
                    value={formData.passportIssuingState}
                    onChange={(e) => handleInputChange('passportIssuingState', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <DateInput
                label="Data de Emissão"
                value={formData.issuanceDate}
                onChange={(value) => handleInputChange('issuanceDate', value)}
                maxDate={new Date().toISOString().split('T')[0]}
                error={validation.issuanceDate}
              />
              <DateInput
                label="Data de Expiração"
                value={formData.expirationDate}
                onChange={(value) => handleInputChange('expirationDate', value)}
                minDate={formData.issuanceDate}
                error={validation.expirationDate}
              />
            </div>

            <ConditionalField
              question="Você já perdeu um passaporte ou teve um roubado?"
              value={formData.hasLostPassport}
              onValueChange={(val) => handleInputChange('hasLostPassport', val)}
            >
              <div className="space-y-4">
                {formData.lostPassports.map((passport, index) => (
                  <div key={index} className="p-4 border rounded-lg bg-gray-50 space-y-4 relative">
                    <button
                      type="button"
                      onClick={() => removeLostPassport(index)}
                      className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                    >
                      ×
                    </button>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Número do Passaporte Perdido/Roubado</label>
                        <input
                          type="text"
                          value={passport.number}
                          onChange={(e) => handleLostPassportChange(index, 'number', e.target.value.toUpperCase())}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">País Emissor</label>
                        <select
                          value={passport.country}
                          onChange={(e) => handleLostPassportChange(index, 'country', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                        >
                          {countryList.map(country => (
                            <option key={country.value} value={country.value}>{country.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Explique</label>
                      <textarea
                        value={passport.explanation}
                        onChange={(e) => handleLostPassportChange(index, 'explanation', e.target.value)}
                        rows="3"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                        placeholder="Descreva as circunstâncias da perda ou roubo do passaporte..."
                      />
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addLostPassport}
                  className="text-blue-600 hover:underline"
                >
                  + Fornecer Detalhes
                </button>
              </div>
            </ConditionalField>
          </div>

          <div className="flex justify-between items-center mt-8">
            <button
              onClick={prevSection}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50 transition duration-200 ease-in-out"
            >
              ← Voltar
            </button>
            <button
              onClick={nextSection}
              disabled={isSaving}
              className="form-nav-button"
            >
              {isSaving ? 'Salvando...' : 'Próximo →'}
            </button>
          </div>
        </SectionCard>
      </div>
    </div>
  );
};

export default Section7Passport;