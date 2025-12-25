
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { loadApplication, saveSectionData } from '@/components/storage';
import ProgressBar from '../components/ProgressBar';
import SectionCard from '../components/SectionCard';
import CountryStateSelector from '../components/CountryStateSelector';
import ConditionalField from '../components/ConditionalField';
import DateInput from '../components/DateInput';
import AutoSave from '../components/AutoSave';
import { schemas } from '@/lib/sectionSchemas';
import { validateWithSchema, toValidationMap } from '@/lib/validation';

const BRAZILIAN_STATES = [
{ code: 'AC', name: 'Acre' }, { code: 'AL', name: 'Alagoas' }, { code: 'AP', name: 'Amapá' },
{ code: 'AM', name: 'Amazonas' }, { code: 'BA', name: 'Bahia' }, { code: 'CE', name: 'Ceará' },
{ code: 'DF', name: 'Distrito Federal' }, { code: 'ES', name: 'Espírito Santo' }, { code: 'GO', name: 'Goiás' },
{ code: 'MA', name: 'Maranhão' }, { code: 'MT', name: 'Mato Grosso' }, { code: 'MS', name: 'Mato Grosso do Sul' },
{ code: 'MG', name: 'Minas Gerais' }, { code: 'PA', name: 'Pará' }, { code: 'PB', name: 'Paraíba' },
{ code: 'PR', name: 'Paraná' }, { code: 'PE', name: 'Pernambuco' }, { code: 'PI', 'name': 'Piauí' },
{ code: 'RJ', name: 'Rio de Janeiro' }, { code: 'RN', name: 'Rio Grande do Norte' }, { code: 'RS', name: 'Rio Grande do Sul' },
{ code: 'RO', name: 'Rondônia' }, { code: 'RR', name: 'Roraima' }, { code: 'SC', name: 'Santa Catarina' },
{ code: 'SP', name: 'São Paulo' }, { code: 'SE', name: 'Sergipe' }, { code: 'TO', name: 'Tocantins' }];


const Section1Personal = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [application, setApplication] = useState(null);
  const [formData, setFormData] = useState({
    surnames: '',
    givenNames: '',
    hasOtherNames: false,
    otherNames: [], // Array to hold multiple other names
    sex: '',
    maritalStatus: '',
    birthDate: '',
    birthCity: '',
    birthState: '',
    birthCountry: 'Brasil' // Default to Brasil
  });

  const [validation, setValidation] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const currentAppId = urlParams.get('appId');
    
    console.log('Section1Personal - appId from URL:', currentAppId);
    console.log('Section1Personal - window.location.search:', window.location.search);
    
    const isValidAppId = currentAppId &&
                         currentAppId !== 'null' &&
                         currentAppId !== 'undefined' &&
                         String(currentAppId).trim() !== '' &&
                         currentAppId !== '-';

    if (!isValidAppId) {
      console.error("Section1Personal - Invalid appId detected:", currentAppId);
      console.error("Section1Personal - Redirecting to dashboard");
      navigate(createPageUrl("Dashboard"));
      return;
    }

    const fetchApplication = async () => {
      try {
        const app = await loadApplication(currentAppId);
        setApplication(app);

        let initialData = app.data?.personal || {};

        // Lógica de autopreenchimento de cidade/estado
        if (app.data?.personal?.placeOfBirthRaw && !initialData.birthCity && !initialData.birthState) {
          const placeOfBirthRaw = app.data.personal.placeOfBirthRaw;
          const parts = placeOfBirthRaw.split('/');
          if (parts.length === 2) {
            const city = parts[0].trim();
            const stateCode = parts[1].trim();
            const stateMatch = BRAZILIAN_STATES.find((s) => s.code === stateCode);

            if (city) {
              initialData.birthCity = city.charAt(0).toUpperCase() + city.slice(1).toLowerCase();
            }
            if (stateMatch) {
              initialData.birthState = stateMatch.code; // Usar o código do estado
            }
          }
        }
        
        // Garante que o país de nascimento seja 'Brasil' se não estiver definido
        if (!initialData.birthCountry) {
            initialData.birthCountry = 'Brasil';
        }

        setFormData((prev) => ({ ...prev, ...initialData }));

      } catch (error) {
        console.error("Section1Personal - Failed to load application:", error);
        alert("Erro ao carregar aplicação. Redirecionando para o dashboard.");
        navigate(createPageUrl("Dashboard"));
      }
      setIsLoading(false);
    };

    fetchApplication();
  }, [location.search, navigate]); // Depend on location.search to react to URL changes

  const formatNames = (name) => {
    const prepositions = ['da', 'de', 'do', 'das', 'dos', 'e'];
    return name.
    split(' ').
    map((word) =>
    prepositions.includes(word.toLowerCase()) ?
    word.toLowerCase() :
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).
    join(' ');
  };

  const handleInputChange = (field, value) => {
    let processedValue = value;

    if (field === 'surnames' || field === 'givenNames' || field === 'birthCity') {
      processedValue = formatNames(value);
    }

    setFormData((prev) => {
      const newState = { ...prev, [field]: processedValue };
      if (field === 'hasOtherNames' && !processedValue) {
        newState.otherNames = [];
      }
      return newState;
    });

    if (validation[field]) {
      setValidation((prev) => ({ ...prev, [field]: null }));
    }
  };

  const addOtherName = () => {
    setFormData((prev) => ({
      ...prev,
      otherNames: [...prev.otherNames, { surname: '', givenName: '' }]
    }));
  };

  const updateOtherName = (index, field, value) => {
    const processedValue = formatNames(value);
    setFormData((prev) => ({
      ...prev,
      otherNames: prev.otherNames.map((name, i) =>
      i === index ? { ...name, [field]: processedValue } : name
      )
    }));
  };

  const removeOtherName = (index) => {
    setFormData((prev) => ({
      ...prev,
      otherNames: prev.otherNames.filter((_, i) => i !== index)
    }));
  };

  const validateSection = () => {
    const schema = schemas.personal;
    if (!schema) {
      setValidation({});
      return true;
    }
    const { ok, errors } = validateWithSchema(schema, formData);
    setValidation(toValidationMap(errors));
    return ok;
  };

  const nextSection = async () => {
    // Get appId from URL inside the function for the save operation
    const appId = new URLSearchParams(location.search).get('appId');
    if (!appId || appId === 'null' || appId === 'undefined') {
      alert("Erro: ID da aplicação não encontrado. Não foi possível salvar.");
      navigate(createPageUrl("Dashboard"));
      return;
    }

    if (validateSection()) {
      setIsSaving(true);
      try {
        const updatedApp = await saveSectionData(application, 'personal', formData);
        setApplication(updatedApp);
        navigate(createPageUrl(`Section2Nationality?appId=${appId}`));
      } catch (error) {
        alert("Erro ao salvar os dados. Tente novamente.");
        setIsSaving(false);
      }
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
      <ProgressBar application={application} currentSectionId="personal" />
      
      {/* AutoSave Component */}
      <AutoSave 
        application={application}
        sectionId="personal"
        formData={formData}
        onApplicationUpdate={setApplication}
      />
      
      <div className="w-full max-w-none px-4 sm:px-6 lg:px-8 py-4 sm:py-8 mx-auto">
        <div className="max-w-3xl mx-auto">
          <SectionCard
            icon="👤"
            title="Informações Pessoais 1"
            subtitle="Preencha os dados exatamente como estão em seu passaporte.">

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sobrenome (como consta no passaporte)</label>
                <input
                  type="text"
                  value={formData.surnames}
                  onChange={(e) => handleInputChange('surnames', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${validation.surnames ? 'border-red-500' : 'border-gray-300'}`} />

                {validation.surnames && <p className="text-red-500 text-sm mt-1">{validation.surnames}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nome (como consta no passaporte)</label>
                <input
                  type="text"
                  value={formData.givenNames}
                  onChange={(e) => handleInputChange('givenNames', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${validation.givenNames ? 'border-red-500' : 'border-gray-300'}`} />

                {validation.givenNames && <p className="text-red-500 text-sm mt-1">{validation.givenNames}</p>}
              </div>
            </div>

            <ConditionalField
              question="Você já utilizou outros nomes (ex: de solteiro(a), religioso, profissional, apelido, etc.)?"
              value={formData.hasOtherNames}
              onValueChange={(value) => handleInputChange('hasOtherNames', value)}>

              <div className="space-y-4">
                {formData.otherNames.map((otherName, index) =>
                <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg bg-gray-50">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Sobrenome Utilizado</label>
                      <input
                      type="text"
                      value={otherName.surname}
                      onChange={(e) => updateOtherName(index, 'surname', e.target.value)}
                      className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500" />

                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Nome Utilizado</label>
                      <input
                      type="text"
                      value={otherName.givenName}
                      onChange={(e) => updateOtherName(index, 'givenName', e.target.value)}
                      className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500" />

                    </div>
                    <div className="col-span-1 md:col-span-2 flex justify-end">
                      <button
                      type="button"
                      onClick={() => removeOtherName(index)}
                      className="px-4 py-2 text-red-600 hover:text-red-800 text-sm">
                        Remover
                      </button>
                    </div>
                  </div>
                )}
                
                <button
                  type="button"
                  onClick={addOtherName}
                  className="w-full sm:w-auto px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors">

                  + Adicionar outro nome utilizado
                </button>
              </div>
            </ConditionalField>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sexo</label>
                <select
                  value={formData.sex}
                  onChange={(e) => handleInputChange('sex', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${validation.sex ? 'border-red-500' : 'border-gray-300'}`}>

                  <option value="">Selecione...</option>
                  <option value="MALE">Masculino</option>
                  <option value="FEMALE">Feminino</option>
                </select>
                 {validation.sex && <p className="text-red-500 text-sm mt-1">{validation.sex}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Estado Civil</label>
                <select
                  value={formData.maritalStatus}
                  onChange={(e) => handleInputChange('maritalStatus', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${validation.maritalStatus ? 'border-red-500' : 'border-gray-300'}`}>

                  <option value="">Selecione...</option>
                  <option value="MARRIED">Casado(a)</option>
                  <option value="SINGLE">Solteiro(a)</option>
                  <option value="WIDOWED">Viúvo(a)</option>
                  <option value="DIVORCED">Divorciado(a)</option>
                  <option value="LEGALLY_SEPARATED">União Estável/Parceria Doméstica</option>
                  <option value="CIVIL_UNION_DOMESTIC_PARTNERSHIP">Separado(a) Legalmente</option>
                </select>
                 {validation.maritalStatus && <p className="text-red-500 text-sm mt-1">{validation.maritalStatus}</p>}
              </div>
            </div>
            
            <div className="mb-6">
              <h3 className="text-md font-semibold text-gray-800 mb-2">Data e Local de Nascimento</h3>
              <div className="p-4 border rounded-lg space-y-4">
                <DateInput
                  label="Data de Nascimento"
                  value={formData.birthDate}
                  onChange={(value) => handleInputChange('birthDate', value)}
                  error={validation.birthDate}
                  maxDate={today}
                  required
                  calendarTrigger="icon-only"
                />

                <CountryStateSelector
                  selectedCountry={formData.birthCountry}
                  selectedState={formData.birthState}
                  selectedCity={formData.birthCity}
                  onCountryChange={(country) => {
                    handleInputChange('birthCountry', country);
                    if (country !== 'Brasil') handleInputChange('birthState', '');
                  }}
                  onStateChange={(state) => handleInputChange('birthState', state)}
                  onCityChange={(city) => handleInputChange('birthCity', city)}
                  error={{
                    country: validation.birthCountry,
                    state: validation.birthState,
                    city: validation.birthCity
                  }} />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-8">
              <div className="w-full sm:w-auto"></div>
              <button
                onClick={nextSection}
                disabled={isSaving}
                className="form-nav-button">
                {isSaving ? 'Salvando...' : 'Próximo →'}
              </button>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>);

};

export default Section1Personal;
