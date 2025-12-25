
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { loadApplication, saveSectionData } from '@/components/storage';
import ProgressBar from '../components/ProgressBar';
import SectionCard from '../components/SectionCard';
import ConditionalField from '../components/ConditionalField';
import DateInput from '../components/DateInput'; // Imported DateInput

const US_STATES = [
{ name: "Alabama", code: "AL" }, { name: "Alaska", code: "AK" }, { name: "Arizona", code: "AZ" },
{ name: "Arkansas", code: "AR" }, { name: "California", code: "CA" }, { name: "Colorado", code: "CO" },
{ name: "Connecticut", code: "CT" }, { name: "Delaware", code: "DE" }, { name: "Florida", code: "FL" },
{ name: "Georgia", code: "GA" }, { name: "Hawaii", code: "HI" }, { name: "Idaho", code: "ID" },
{ name: "Illinois", code: "IL" }, { name: "Indiana", code: "IN" }, { name: "Iowa", code: "IA" },
{ name: "Kansas", code: "KS" }, { name: "Kentucky", code: "KY" }, { name: "Louisiana", code: "LA" },
{ name: "Maine", code: "ME" }, { name: "Maryland", code: "MD" }, { name: "Massachusetts", code: "MA" },
{ name: "Michigan", code: "MI" }, { name: "Minnesota", code: "MN" }, { name: "Mississippi", code: "MS" },
{ name: "Missouri", code: "MO" }, { name: "Montana", code: "MT" }, { name: "Nebraska", code: "NE" },
{ name: "Nevada", code: "NV" }, { name: "New Hampshire", code: "NH" }, { name: "New Jersey", code: "NJ" },
{ name: "New Mexico", code: "NM" }, { name: "New York", code: "NY" }, { name: "North Carolina", code: "NC" },
{ name: "North Dakota", code: "ND" }, { name: "Ohio", code: "OH" }, { name: "Oklahoma", code: "OK" },
{ name: "Oregon", code: "OR" }, { name: "Pennsylvania", code: "PA" }, { name: "Rhode Island", code: "RI" },
{ name: "South Carolina", code: "SC" }, { name: "South Dakota", code: "SD" }, { name: "Tennessee", code: "TN" },
{ name: "Texas", code: "TX" }, { name: "Utah", code: "UT" }, { name: "Vermont", code: "VT" },
{ name: "Virginia", code: "VA" }, { name: "Washington", code: "WA" }, { name: "West Virginia", code: "WV" },
{ name: "Wisconsin", code: "WI" }, { name: "Wyoming", code: "WY" }];


const Section5USHistory = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const appId = new URLSearchParams(location.search).get('appId');

  const [application, setApplication] = useState(null);
  const [formData, setFormData] = useState({
    hasBeenInUS: false,
    previousVisits: [],
    hasDriverLicense: false,
    driverLicenses: [],
    hasUSVisa: false,
    dateLastVisaIssued: '',
    visaNumber: '',
    visaNumberUnknown: false,
    sameCountryAsPassport: true,
    visaIssuedCountry: '',
    visaLostStolen: false,
    visaLostStolenYear: '',
    visaLostStolenExplanation: '',
    hadUSVisaRefused: false,
    visaRefusalExplanation: '',
    hasImmigrationPetition: false,
    immigrationPetitionExplanation: ''
  });

  const [validation, setValidation] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!appId || appId === 'null' || appId === 'undefined' || appId === '-') {
      console.error("Invalid appId, redirecting to dashboard");
      navigate(createPageUrl("Dashboard"));
      return;
    }

    const fetchApplication = async () => {
      try {
        const app = await loadApplication(appId);
        setApplication(app);
        if (app.data?.usHistory) {
          setFormData((prev) => ({ ...prev, ...app.data.usHistory }));
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
    setFormData((prev) => {
      const newState = { ...prev, [field]: value };
      if (field === 'hasBeenInUS' && !value) newState.previousVisits = [];
      if (field === 'hasDriverLicense' && !value) newState.driverLicenses = [];
      if (field === 'hasUSVisa' && !value) {
        newState.dateLastVisaIssued = '';
        newState.visaNumber = '';
        newState.visaNumberUnknown = false;
        newState.sameCountryAsPassport = true;
        newState.visaIssuedCountry = '';
        newState.visaLostStolen = false;
        newState.visaLostStolenYear = '';
        newState.visaLostStolenExplanation = '';
      }
      if (field === 'hadUSVisaRefused' && !value) newState.visaRefusalExplanation = '';
      if (field === 'hasImmigrationPetition' && !value) newState.immigrationPetitionExplanation = '';
      return newState;
    });

    if (validation[field]) {
      setValidation((prev) => ({ ...prev, [field]: null }));
    }
  };

  const addPreviousVisit = () => {
    setFormData((prev) => ({
      ...prev,
      previousVisits: [...prev.previousVisits, {
        dateArrived: '',
        lengthOfStay: '',
        stayUnit: 'DAYS'
      }]
    }));
  };

  const removePreviousVisit = (index) => {
    setFormData((prev) => ({
      ...prev,
      previousVisits: prev.previousVisits.filter((_, i) => i !== index)
    }));
  };

  const updatePreviousVisit = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      previousVisits: prev.previousVisits.map((visit, i) =>
      i === index ? { ...visit, [field]: value } : visit
      )
    }));
  };

  const addDriverLicense = () => {
    setFormData((prev) => ({
      ...prev,
      driverLicenses: [...prev.driverLicenses, {
        number: '',
        state: ''
      }]
    }));
  };

  const removeDriverLicense = (index) => {
    setFormData((prev) => ({
      ...prev,
      driverLicenses: prev.driverLicenses.filter((_, i) => i !== index)
    }));
  };

  const updateDriverLicense = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      driverLicenses: prev.driverLicenses.map((license, i) =>
      i === index ? { ...license, [field]: value } : license
      )
    }));
  };

  const validateSection = () => {
    const schema = schemas.usHistory;
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
        const updatedApp = await saveSectionData(application, 'usHistory', formData);
        setApplication(updatedApp);
        navigate(createPageUrl(`Section6AddressPhone?appId=${currentAppId}`));
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
        navigate(createPageUrl(`Section4TravelCompanions?appId=${currentAppId}`));
    } else {
        navigate(createPageUrl("Dashboard"));
    }
  };

  const today = new Date().toISOString().split('T')[0];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>);

  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ProgressBar application={application} currentSectionId="usHistory" />
      
      <div className="max-w-3xl mx-auto p-4 pt-8">
        <SectionCard
          icon="🏛️"
          title="Histórico nos EUA"
          subtitle="Informações sobre suas experiências anteriores com os Estados Unidos.">

          <div className="space-y-6">
            <ConditionalField
              question="Você já esteve nos Estados Unidos?"
              value={formData.hasBeenInUS}
              onValueChange={(value) => handleInputChange('hasBeenInUS', value)}>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Visitas Anteriores aos EUA</h3>
                
                {formData.previousVisits.length === 0 ?
                <div className="text-center py-8 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg">
                    <p className="text-gray-500 mb-4">Adicione as últimas 5 visitas.</p>
                    <button
                    type="button"
                    onClick={addPreviousVisit}
                    className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
                  >
                      + Adicionar Visita Anterior
                    </button>
                  </div> :

                <div className="space-y-4">
                    {formData.previousVisits.map((visit, index) =>
                  <div key={index} className="p-4 border border-gray-200 rounded-lg bg-white">
                        <div className="flex justify-between items-center mb-4">
                          <h4 className="font-semibold text-gray-800">
                            Visita {index + 1}
                          </h4>
                          <button
                        type="button"
                        onClick={() => removePreviousVisit(index)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium">

                            Remover
                          </button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <DateInput
                        label="Data de Chegada"
                        value={visit.dateArrived}
                        onChange={(value) => updatePreviousVisit(index, 'dateArrived', value)}
                        maxDate={today} />

                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Duração da Estadia
                            </label>
                            <div className="flex gap-2">
                              <input
                            type="number"
                            min="1"
                            value={visit.lengthOfStay}
                            onChange={(e) => updatePreviousVisit(index, 'lengthOfStay', e.target.value)}
                            className="w-1/2 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                            placeholder="Ex: 15" />

                              <select
                            value={visit.stayUnit}
                            onChange={(e) => updatePreviousVisit(index, 'stayUnit', e.target.value)}
                            className="w-1/2 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors">

                                <option value="DAYS">Dia(s)</option>
                                <option value="WEEKS">Semana(s)</option>
                                <option value="MONTHS">Mês(es)</option>
                                <option value="YEARS">Ano(s)</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      </div>
                  )}
                    
                    <button
                    type="button"
                    onClick={addPreviousVisit}
                    className="w-full py-3 border-2 border-dashed border-blue-300 text-blue-600 rounded-lg hover:border-blue-400 hover:text-blue-700 font-medium transition-colors">

                      + Adicionar Outra Visita
                    </button>
                  </div>
                }
              </div>
            </ConditionalField>

            <ConditionalField
              question="Você possui ou já possuiu carteira de motorista dos EUA?"
              value={formData.hasDriverLicense}
              onValueChange={(value) => handleInputChange('hasDriverLicense', value)}>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Carteiras de Motorista dos EUA</h3>
                
                {formData.driverLicenses.length === 0 ?
                <div className="text-center py-8 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg">
                    <p className="text-gray-500 mb-4">Nenhuma carteira registrada</p>
                    <button
                    type="button"
                    onClick={addDriverLicense}
                    className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors">

                      + Adicionar Carteira
                    </button>
                  </div> :

                <div className="space-y-4">
                    {formData.driverLicenses.map((license, index) =>
                  <div key={index} className="p-4 border border-gray-200 rounded-lg bg-white">
                        <div className="flex justify-between items-center mb-4">
                          <h4 className="font-semibold text-gray-800">
                            Carteira {index + 1}
                          </h4>
                          <button
                        type="button"
                        onClick={() => removeDriverLicense(index)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium">

                            Remover
                          </button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Número da Carteira
                            </label>
                            <input
                          type="text"
                          value={license.number}
                          onChange={(e) => updateDriverLicense(index, 'number', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                          placeholder="Ex: DL123456789" />

                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Estado Emissor
                            </label>
                            <select
                          value={license.state}
                          onChange={(e) => updateDriverLicense(index, 'state', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors">

                              <option value="">Selecione o estado...
                                </option>
                              {US_STATES.map((state) =>
                          <option key={state.code} value={state.code}>
                                  {state.name}
                                </option>
                          )}
                            </select>
                          </div>
                        </div>
                      </div>
                  )}
                    
                    <button
                    type="button"
                    onClick={addDriverLicense}
                    className="w-full py-3 border-2 border-dashed border-blue-300 text-blue-600 rounded-lg hover:border-blue-400 hover:text-blue-700 font-medium transition-colors">

                      + Adicionar Outra Carteira
                    </button>
                  </div>
                }
              </div>
            </ConditionalField>

            <ConditionalField
              question="Você já teve um visto americano?"
              value={formData.hasUSVisa}
              onValueChange={(value) => handleInputChange('hasUSVisa', value)}>

              <div className="space-y-4">
                <DateInput
                  label="Data da Emissão de seu último visto (se não souber, deixe em branco)"
                  value={formData.dateLastVisaIssued}
                  onChange={(value) => handleInputChange('dateLastVisaIssued', value)}
                  maxDate={today} />


                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Você sabe o número do visto?
                  </label>
                  <div className="flex items-center gap-4 mb-2">
                    <button
                      type="button"
                      onClick={() => handleInputChange('visaNumberUnknown', false)}
                      className={`px-6 py-2 border rounded-lg transition-all text-sm font-medium ${
                      !formData.visaNumberUnknown ?
                      'border-blue-500 bg-blue-100 text-blue-700' :
                      'border-gray-300 hover:border-gray-400'}`
                      }>

                      Sim, sei o número
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInputChange('visaNumberUnknown', true)}
                      className={`px-6 py-2 border rounded-lg transition-all text-sm font-medium ${
                      formData.visaNumberUnknown ?
                      'border-blue-500 bg-blue-100 text-blue-700' :
                      'border-gray-300 hover:border-gray-400'}`
                      }>

                      Não sei o número
                    </button>
                  </div>

                  {!formData.visaNumberUnknown &&
                  <input
                    type="text"
                    value={formData.visaNumber}
                    onChange={(e) => handleInputChange('visaNumber', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    placeholder="Ex: AA1234567" />

                  }
                </div>
              </div>
            </ConditionalField>

            <ConditionalField
              question="Você já teve um visto americano negado, cancelado, revogado ou você foi recusado na admissão no porto de entrada dos EUA?"
              value={formData.hadUSVisaRefused}
              onValueChange={(value) => handleInputChange('hadUSVisaRefused', value)}>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Por favor, explique as circunstâncias
                </label>
                <textarea
                  value={formData.visaRefusalExplanation}
                  onChange={(e) => handleInputChange('visaRefusalExplanation', e.target.value)}
                  rows="4"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="Descreva detalhadamente o que aconteceu, quando ocorreu, qual foi o motivo informado, etc." />

              </div>
            </ConditionalField>

            <ConditionalField
              question="Alguém já apresentou uma petição de imigração em seu nome junto ao Serviço de Cidadania e Imigração dos EUA?"
              value={formData.hasImmigrationPetition}
              onValueChange={(value) => handleInputChange('hasImmigrationPetition', value)}>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Forneça detalhes sobre a petição
                </label>
                <textarea
                  value={formData.immigrationPetitionExplanation}
                  onChange={(e) => handleInputChange('immigrationPetitionExplanation', e.target.value)}
                  rows="4"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="Descreva quem apresentou a petição, quando, tipo de petição, status atual, etc." />

              </div>
            </ConditionalField>
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
    </div>);

};

export default Section5USHistory;
