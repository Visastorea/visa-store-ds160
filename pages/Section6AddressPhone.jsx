
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { loadApplication, saveSectionData } from '@/components/storage';
import ProgressBar from '../components/ProgressBar';
import SectionCard from '../components/SectionCard';
import ConditionalField from '../components/ConditionalField';
import { COUNTRIES } from '../components/utils/countries';

const SOCIAL_MEDIA_PLATFORMS = [
  'Facebook', 'Twitter', 'Instagram', 'LinkedIn', 'YouTube', 'TikTok',
  'Snapchat', 'Pinterest', 'Reddit', 'WhatsApp', 'Telegram', 'WeChat', 'Outro'
];

const Section6AddressPhone = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const appId = new URLSearchParams(location.search).get('appId');

  const [application, setApplication] = useState(null);
  const [formData, setFormData] = useState({
    homeAddress: {
      street1: '',
      street2: '',
      city: '',
      state: '',
      zipCode: '',
      number: '', // Added number field
      country: 'Brasil'
    },
    mailingSameAsHome: true,
    mailingAddress: {
      street1: '',
      street2: '',
      city: '',
      state: '',
      zipCode: '',
      number: '', // Added number field
      country: 'Brasil'
    },
    primaryPhone: { dialCode: '55', number: '' },
    secondaryPhone: { dialCode: '55', number: '' },
    workPhone: { dialCode: '55', number: '' },
    email: '',
    socialMedia: [],
    hasUsedOtherPhone: false,
    otherPhones: [],
    hasUsedOtherEmail: false,
    otherEmails: [],
  });

  const [validation, setValidation] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const countryList = COUNTRIES.map(c => ({ name: c.name, value: c.iso2, dialCode: c.dialCode, emoji: c.emoji, phoneFormat: c.phoneFormat }));

  const handleCepLookup = async (cep, addressType) => {
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length !== 8) return;

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await response.json();

      if (data && !data.erro) {
        if (addressType === 'home') {
          setFormData(prev => ({
            ...prev,
            homeAddress: {
              ...prev.homeAddress,
              street1: data.logradouro,
              city: data.localidade,
              state: data.uf,
            }
          }));
        } else if (addressType === 'mailing') {
          setFormData(prev => ({
            ...prev,
            mailingAddress: {
              ...prev.mailingAddress,
              street1: data.logradouro,
              city: data.localidade,
              state: data.uf,
            }
          }));
        }
      } else {
        console.warn(`CEP not found or invalid for ${addressType}: ${cep}`);
        // Optionally clear auto-filled fields if CEP lookup fails
        if (addressType === 'home') {
          setFormData(prev => ({
            ...prev,
            homeAddress: {
              ...prev.homeAddress,
              street1: '',
              city: '',
              state: '',
            }
          }));
        } else if (addressType === 'mailing') {
          setFormData(prev => ({
            ...prev,
            mailingAddress: {
              ...prev.mailingAddress,
              street1: '',
              city: '',
              state: '',
            }
          }));
        }
      }
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
      // Optionally clear auto-filled fields on network error
      if (addressType === 'home') {
        setFormData(prev => ({
          ...prev,
          homeAddress: {
            ...prev.homeAddress,
            street1: '',
            city: '',
            state: '',
          }
        }));
      } else if (addressType === 'mailing') {
          setFormData(prev => ({
            ...prev,
            mailingAddress: {
              ...prev.mailingAddress,
              street1: '',
              city: '',
              state: '',
            }
          }));
      }
    }
  };


  useEffect(() => {
    if (!appId || appId === 'null' || appId === 'undefined') {
      console.error("Invalid appId, redirecting to dashboard");
      navigate(createPageUrl("Dashboard"));
      return;
    }

    const fetchApplication = async () => {
      try {
        const app = await loadApplication(appId);
        setApplication(app);
        if (app.data?.addressPhone) {
          // Ensure new fields are initialized even if not in saved data
          setFormData((prev) => ({
            ...prev,
            ...app.data.addressPhone,
            homeAddress: { ...prev.homeAddress, ...app.data.addressPhone.homeAddress },
            mailingAddress: { ...prev.mailingAddress, ...app.data.addressPhone.mailingAddress },
            hasUsedOtherPhone: app.data.addressPhone.hasUsedOtherPhone ?? false,
            otherPhones: app.data.addressPhone.otherPhones || [],
            hasUsedOtherEmail: app.data.addressPhone.hasUsedOtherEmail ?? false,
            otherEmails: app.data.addressPhone.otherEmails || [],
          }));
        }
      } catch (error) {
        console.error("Failed to load application:", error);
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

  const handleNestedChange = (path, value) => {
    setFormData((prev) => {
      const newState = JSON.parse(JSON.stringify(prev));
      const keys = path.split('.');
      const lastKey = keys.pop();
      let current = newState;
      for (const key of keys) {
        if (!current[key]) current[key] = {};
        current = current[key];
      }
      current[lastKey] = value;
      return newState;
    });
  };

  const addSocialMedia = () => {
    setFormData(prev => ({
      ...prev,
      socialMedia: [...prev.socialMedia, { platform: '', identifier: '' }]
    }));
  };

  const removeSocialMedia = (index) => {
    setFormData(prev => ({
      ...prev,
      socialMedia: prev.socialMedia.filter((_, i) => i !== index)
    }));
  };

  const updateSocialMedia = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      socialMedia: prev.socialMedia.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const addOtherPhone = () => {
    setFormData(prev => ({
        ...prev,
        otherPhones: [...prev.otherPhones, { dialCode: '55', number: '' }]
    }));
  };

  const removeOtherPhone = (index) => {
    setFormData(prev => ({
        ...prev,
        otherPhones: prev.otherPhones.filter((_, i) => i !== index)
    }));
  };

  const updateOtherPhone = (index, field, value) => {
    setFormData(prev => ({
        ...prev,
        otherPhones: prev.otherPhones.map((item, i) =>
            i === index ? { ...item, [field]: value } : item
        )
    }));
  };
  
  const addOtherEmail = () => {
    setFormData(prev => ({
        ...prev,
        otherEmails: [...prev.otherEmails, { email: '' }]
    }));
  };

  const removeOtherEmail = (index) => {
    setFormData(prev => ({
        ...prev,
        otherEmails: prev.otherEmails.filter((_, i) => i !== index)
    }));
  };

  const updateOtherEmail = (index, value) => {
    setFormData(prev => ({
        ...prev,
        otherEmails: prev.otherEmails.map((item, i) =>
            i === index ? { ...item, email: value } : item
        )
    }));
  };

  const validateSection = () => {
    const schema = schemas.addressPhone;
    if (!schema) {
      setValidation({});
      return true;
    }
    const { ok, errors } = validateWithSchema(schema, formData);
    setValidation(toValidationMap(errors));
    return ok;
  };

  const nextSection = async () => {
    // Re-extract appId inside the function to ensure it's the most current.
    const currentAppId = new URLSearchParams(location.search).get('appId');
    if (!currentAppId) {
        alert("Erro: ID da aplicação não encontrado. Não é possível continuar.");
        navigate(createPageUrl("Dashboard"));
        return;
    }

    if (validateSection()) {
      setIsSaving(true);
      try {
        const updatedApp = await saveSectionData(application, 'addressPhone', formData);
        setApplication(updatedApp);
        navigate(createPageUrl(`Section7Passport?appId=${currentAppId}`));
      } catch (error) {
        console.error("Failed to save and navigate:", error);
      } finally {
        setIsSaving(false);
      }
    }
  };

  const prevSection = () => {
    const currentAppId = new URLSearchParams(location.search).get('appId');
    if (currentAppId) {
        navigate(createPageUrl(`Section5USHistory?appId=${currentAppId}`));
    } else {
        // If appId is missing, navigate to dashboard as a fallback
        navigate(createPageUrl("Dashboard"));
    }
  };

  const formatPhoneNumber = (value, dialCode) => {
    const country = countryList.find(c => c.dialCode === dialCode);
    if (country && country.phoneFormat && country.phoneFormat.maskLogic) {
      return country.phoneFormat.maskLogic(value);
    } else {
      // Máscara genérica para países sem formatação específica
      const cleaned = value.replace(/\D/g, '');
      const maxLength = country?.phoneFormat?.maxLength || 15;
      return cleaned.substring(0, maxLength);
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
      <ProgressBar application={application} currentSectionId="addressPhone" />

      <div className="max-w-3xl mx-auto p-4 pt-8">
        <SectionCard
          icon="🏠"
          title="Endereço e Informações de Contato"
          subtitle="Forneça seus dados de endereço e contato atuais."
        >
          <div className="space-y-6">
            {/* Endereço Residencial */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">
                Endereço Residencial Atual
              </h3>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      CEP/Código Postal
                    </label>
                    <input
                      type="text"
                      inputMode="numeric" // Added
                      pattern="[0-9]*" // Added
                      value={formData.homeAddress.zipCode}
                      onChange={(e) => {
                        let value = e.target.value.replace(/\D/g, ''); // Remove tudo que não for dígito
                        value = value.substring(0, 8); // Limita a 8 dígitos (padrão CEP)
                        if (value.length > 5) { // Aplica a máscara XXXXX-XXX
                          value = value.replace(/^(\d{5})(\d)/, '$1-$2');
                        }
                        handleNestedChange('homeAddress.zipCode', value);
                      }}
                      onBlur={(e) => handleCepLookup(e.target.value, 'home')}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      placeholder="Ex: 01234-567"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Número
                    </label>
                    <input
                      type="text"
                      value={formData.homeAddress.number || ''}
                      onChange={(e) => handleNestedChange('homeAddress.number', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      placeholder="Ex: 123"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Endereço (Linha 1)
                  </label>
                  <input
                    type="text"
                    value={formData.homeAddress.street1}
                    onChange={(e) => handleNestedChange('homeAddress.street1', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    placeholder="Ex: Rua das Flores, 123"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Endereço (Linha 2) <span className="text-gray-500">(Opcional)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.homeAddress.street2}
                    onChange={(e) => handleNestedChange('homeAddress.street2', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    placeholder="Ex: Apartamento 101, Bloco A"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cidade
                    </label>
                    <input
                      type="text"
                      value={formData.homeAddress.city}
                      onChange={(e) => handleNestedChange('homeAddress.city', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      placeholder="Ex: São Paulo"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Estado/Província
                    </label>
                    <input
                      type="text"
                      value={formData.homeAddress.state}
                      onChange={(e) => handleNestedChange('homeAddress.state', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      placeholder="Ex: São Paulo"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    País
                  </label>
                  <select
                    value={formData.homeAddress.country}
                    onChange={(e) => handleNestedChange('homeAddress.country', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  >
                    {countryList.map(country => (
                      <option key={country.value} value={country.name}>
                        {country.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Endereço de Correspondência */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">
                Endereço de Correspondência
              </h3>

              <label className="block text-sm font-medium text-gray-700 mb-2">
                O endereço de correspondência é o mesmo que o endereço residencial?
              </label>
              <div className="flex items-center gap-4 mb-4">
                <button
                  type="button"
                  onClick={() => handleInputChange('mailingSameAsHome', true)}
                  className={`px-6 py-2 border rounded-lg transition-all text-sm font-medium ${
                    formData.mailingSameAsHome
                      ? 'border-blue-500 bg-blue-100 text-blue-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  Sim
                </button>
                <button
                  type="button"
                  onClick={() => handleInputChange('mailingSameAsHome', false)}
                  className={`px-6 py-2 border rounded-lg transition-all text-sm font-medium ${
                    !formData.mailingSameAsHome
                      ? 'border-blue-500 bg-blue-100 text-blue-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  Não
                </button>
              </div>

              {!formData.mailingSameAsHome && (
                <div className="space-y-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        CEP/Código Postal
                      </label>
                      <input
                        type="text"
                        inputMode="numeric" // Added
                        pattern="[0-9]*" // Added
                        value={formData.mailingAddress.zipCode}
                        onChange={(e) => {
                          let value = e.target.value.replace(/\D/g, ''); // Remove tudo que não for dígito
                          value = value.substring(0, 8); // Limita a 8 dígitos (padrão CEP)
                          if (value.length > 5) { // Aplica a máscara XXXXX-XXX
                            value = value.replace(/^(\d{5})(\d)/, '$1-$2');
                          }
                          handleNestedChange('mailingAddress.zipCode', value);
                        }}
                        onBlur={(e) => handleCepLookup(e.target.value, 'mailing')}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Número
                      </label>
                      <input
                        type="text"
                        value={formData.mailingAddress.number || ''}
                        onChange={(e) => handleNestedChange('mailingAddress.number', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                        placeholder="Ex: 123"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Endereço (Linha 1)
                    </label>
                    <input
                      type="text"
                      value={formData.mailingAddress.street1}
                      onChange={(e) => handleNestedChange('mailingAddress.street1', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Endereço (Linha 2) <span className="text-gray-500">(Opcional)</span>
                    </label>
                    <input
                      type="text"
                      value={formData.mailingAddress.street2}
                      onChange={(e) => handleNestedChange('mailingAddress.street2', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Cidade
                      </label>
                      <input
                        type="text"
                        value={formData.mailingAddress.city}
                        onChange={(e) => handleNestedChange('mailingAddress.city', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Estado/Província
                      </label>
                      <input
                        type="text"
                        value={formData.mailingAddress.state}
                        onChange={(e) => handleNestedChange('mailingAddress.state', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      País
                    </label>
                    <select
                      value={formData.mailingAddress.country}
                      onChange={(e) => handleNestedChange('mailingAddress.country', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    >
                      {countryList.map(country => (
                        <option key={country.value} value={country.name}>
                          {country.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Informações de Contato */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">
                Informações de Contato
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Telefone Principal
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={formData.primaryPhone.dialCode}
                      onChange={(e) => handleNestedChange('primaryPhone.dialCode', e.target.value)}
                      className="w-40 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    >
                      {countryList.map(country => (
                        <option key={country.value} value={country.dialCode}>
                          {country.emoji} +{country.dialCode}
                        </option>
                      ))}
                    </select>
                    <input
                      type="tel"
                      value={formData.primaryPhone.number}
                      onChange={(e) => {
                        const formattedValue = formatPhoneNumber(e.target.value, formData.primaryPhone.dialCode);
                        handleNestedChange('primaryPhone.number', formattedValue);
                      }}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      placeholder="Ex: 11 99999-9999"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Telefone Secundário <span className="text-gray-500">(Opcional)</span>
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={formData.secondaryPhone.dialCode}
                      onChange={(e) => handleNestedChange('secondaryPhone.dialCode', e.target.value)}
                      className="w-40 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    >
                      {countryList.map(country => (
                        <option key={country.value} value={country.dialCode}>
                          {country.emoji} +{country.dialCode}
                        </option>
                      ))}
                    </select>
                    <input
                      type="tel"
                      value={formData.secondaryPhone.number}
                      onChange={(e) => {
                        const formattedValue = formatPhoneNumber(e.target.value, formData.secondaryPhone.dialCode);
                        handleNestedChange('secondaryPhone.number', formattedValue);
                      }}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      placeholder="Ex: 11 99999-9999"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Telefone do Trabalho <span className="text-gray-500">(Opcional)</span>
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={formData.workPhone.dialCode}
                      onChange={(e) => handleNestedChange('workPhone.dialCode', e.target.value)}
                      className="w-40 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    >
                      {countryList.map(country => (
                        <option key={country.value} value={country.dialCode}>
                          {country.emoji} +{country.dialCode}
                        </option>
                      ))}
                    </select>
                    <input
                      type="tel"
                      value={formData.workPhone.number}
                      onChange={(e) => {
                        const formattedValue = formatPhoneNumber(e.target.value, formData.workPhone.dialCode);
                        handleNestedChange('workPhone.number', formattedValue);
                      }}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      placeholder="Ex: 11 3333-3333"
                    />
                  </div>
                </div>

                <ConditionalField
                  question="Você usou outro número de telefone nos últimos 5 anos?"
                  value={formData.hasUsedOtherPhone}
                  onValueChange={(value) => handleInputChange('hasUsedOtherPhone', value)}
                >
                  <div className="space-y-4">
                    {formData.otherPhones.map((phone, index) => (
                      <div key={index} className="p-4 border rounded-lg bg-gray-50/50">
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-sm font-medium text-gray-700">Outro Telefone {index + 1}</label>
                            <button type="button" onClick={() => removeOtherPhone(index)} className="text-red-600 hover:text-red-800 text-sm font-medium">Remover</button>
                        </div>
                        <div className="flex gap-2">
                            <select
                                value={phone.dialCode}
                                onChange={(e) => updateOtherPhone(index, 'dialCode', e.target.value)}
                                className="w-40 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                                {countryList.map(c => <option key={c.value} value={c.dialCode}>{c.emoji} +{c.dialCode}</option>)}
                            </select>
                            <input
                                type="tel"
                                value={phone.number}
                                onChange={(e) => {
                                    const formatted = formatPhoneNumber(e.target.value, phone.dialCode);
                                    updateOtherPhone(index, 'number', formatted);
                                }}
                                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                      </div>
                    ))}
                    <button type="button" onClick={addOtherPhone} className="w-full sm:w-auto px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors">+ Adicionar Telefone</button>
                  </div>
                </ConditionalField>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    E-mail
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    placeholder="Ex: seuemail@exemplo.com"
                  />
                </div>

                <ConditionalField
                  question="Você usou outro endereço de e-mail nos últimos 5 anos?"
                  value={formData.hasUsedOtherEmail}
                  onValueChange={(value) => handleInputChange('hasUsedOtherEmail', value)}
                >
                  <div className="space-y-4">
                    {formData.otherEmails.map((email, index) => (
                      <div key={index} className="p-4 border rounded-lg bg-gray-50/50">
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-sm font-medium text-gray-700">Outro E-mail {index + 1}</label>
                            <button type="button" onClick={() => removeOtherEmail(index)} className="text-red-600 hover:text-red-800 text-sm font-medium">Remover</button>
                        </div>
                        <input
                            type="email"
                            value={email.email}
                            onChange={(e) => updateOtherEmail(index, e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="Ex: outroemail@exemplo.com"
                        />
                      </div>
                    ))}
                    <button type="button" onClick={addOtherEmail} className="w-full sm:w-auto px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors">+ Adicionar E-mail</button>
                  </div>
                </ConditionalField>

              </div>
            </div>

            {/* Redes Sociais */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">
                Redes Sociais <span className="text-gray-500 font-normal text-sm">(Opcional)</span>
              </h3>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-4">
                <p className="text-sm text-blue-800">
                  <strong>Importante:</strong> Liste apenas as redes sociais que você usa nos últimos 5 anos.
                  Não é obrigatório, mas pode fortalecer sua aplicação se você tem um perfil ativo e profissional.
                </p>
              </div>

              {formData.socialMedia.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg">
                  <p className="text-gray-500 mb-4">Nenhuma rede social adicionada</p>
                  <button
                    type="button"
                    onClick={addSocialMedia}
                    className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
                  >
                    + Adicionar Rede Social
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {formData.socialMedia.map((item, index) => (
                    <div key={index} className="p-4 border border-gray-200 rounded-lg bg-white">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="font-semibold text-gray-800">
                          Rede Social {index + 1}
                        </h4>
                        <button
                          type="button"
                          onClick={() => removeSocialMedia(index)}
                          className="text-red-600 hover:text-red-800 text-sm font-medium"
                        >
                          Remover
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Plataforma
                          </label>
                          <select
                            value={item.platform}
                            onChange={(e) => updateSocialMedia(index, 'platform', e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                          >
                            <option value="">Selecione...</option>
                            {SOCIAL_MEDIA_PLATFORMS.map(platform => (
                              <option key={platform} value={platform}>
                                {platform}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Nome de Usuário/URL
                          </label>
                          <input
                            type="text"
                            value={item.identifier}
                            onChange={(e) => updateSocialMedia(index, 'identifier', e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                            placeholder="Ex: @seuusuario ou URL completa"
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={addSocialMedia}
                    className="w-full py-3 border-2 border-dashed border-blue-300 text-blue-600 rounded-lg hover:border-blue-400 hover:text-blue-700 font-medium transition-colors"
                  >
                    + Adicionar Outra Rede Social
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-between items-center mt-8">
            <button
              onClick={prevSection}
              className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium transition-colors disabled:opacity-50"
            >
              ← Voltar
            </button>
            <button
              onClick={nextSection}
              disabled={isSaving}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Salvando...' : 'Próximo →'}
            </button>
          </div>
        </SectionCard>
      </div>
    </div>
  );
};

export default Section6AddressPhone;
