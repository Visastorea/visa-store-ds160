
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { loadApplication, saveSectionData } from '@/components/storage';
import ProgressBar from '../components/ProgressBar';
import SectionCard from '../components/SectionCard';
import ConditionalField from '../components/ConditionalField';
import DateInput from '../components/DateInput';
import { formatNames } from '../components/utils/formatters';
import AutoSave from '../components/AutoSave';
import { schemas } from '@/lib/sectionSchemas';
import { validateWithSchema, toValidationMap } from '@/lib/validation';
import PhoneInput from '../components/PhoneInput';

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
{ name: "North Dakota", code: "ND" }, { name: "Ohio", code: "OH" }, { name: "Oklahoma", "code": "OK" },
{ name: "Oregon", code: "OR" }, { name: "Pennsylvania", code: "PA" }, { name: "Rhode Island", code: "RI" },
{ name: "South Carolina", code: "SC" }, { name: "South Dakota", code: "SD" }, { name: "Tennessee", code: "TN" },
{ name: "Texas", code: "TX" }, { name: "Utah", code: "UT" }, { name: "Vermont", code: "VT" },
{ name: "Virginia", code: "VA" }, { name: "Washington", code: "WA" }, { name: "West Virginia", code: "WV" },
{ name: "Wisconsin", code: "WI" }, { name: "Wyoming", code: "WY" }
];

const COUNTRIES = [
'Brasil',
'Afeganistão', 'África do Sul', 'Albânia', 'Alemanha', 'Andorra', 'Angola', 'Antígua e Barbuda',
'Arábia Saudita', 'Argélia', 'Argentina', 'Armênia', 'Austrália', 'Áustria', 'Azerbaijão',
'Bahamas', 'Bahrein', 'Bangladesh', 'Barbados', 'Bélgica', 'Belize', 'Benin', 'Bolívia',
'Bósnia e Herzegovina', 'Botswana', 'Brunei', 'Bulgária', 'Burkina Faso', 'Burundi',
'Butão', 'Cabo Verde', 'Camarões', 'Camboja', 'Canadá', 'Catar', 'Cazaquistão', 'Chade',
'Chile', 'China', 'Chipre', 'Colômbia', 'Comores', 'Congo', 'Coreia do Norte', 'Coreia do Sul',
'Costa do Marfim', 'Costa Rica', 'Croácia', 'Cuba', 'Dinamarca', 'Djibuti', 'Dominica',
'Egito', 'El Salvador', 'Emirados Árabes Unidos', 'Equador', 'Eritreia', 'Eslováquia',
'Eslovênia', 'Espanha', 'Estados Unidos', 'Estônia', 'Etiópia', 'Fiji', 'Filipinas',
'Finlândia', 'França', 'Gabão', 'Gâmbia', 'Gana', 'Geórgia', 'Granada', 'Grécia',
'Guatemala', 'Guiana', 'Guiné', 'Guiné-Bissau', 'Guiné Equatorial', 'Haiti', 'Honduras',
'Hungria', 'Iêmen', 'Ilhas Marshall', 'Ilhas Salomão', 'Índia', 'Indonésia', 'Irã', 'Iraque',
'Irlanda', 'Islândia', 'Israel', 'Itália', 'Jamaica', 'Japão', 'Jordânia', 'Kuwait',
'Laos', 'Lesoto', 'Letônia', 'Líbano', 'Libéria', 'Líbia', 'Liechtenstein', 'Lituânia',
'Luxemburgo', 'Macedônia do Norte', 'Madagascar', 'Malásia', 'Malauí', 'Maldivas', 'Mali',
'Malta', 'Marrocos', 'Maurício', 'Mauritânia', 'México', 'Mianmar', 'Micronésia', 'Moçambique',
'Moldávia', 'Mônaco', 'Mongólia', 'Montenegro', 'Namíbia', 'Nauru', 'Nepal', 'Nicarágua',
'Níger', 'Nigéria', 'Noruega', 'Nova Zelândia', 'Omã', 'Países Baixos', 'Palau', 'Panamá',
'Papua-Nova Guiné', 'Paquistão', 'Paraguai', 'Peru', 'Polônia', 'Portugal', 'Quênia',
'Quirguistão', 'Reino Unido', 'República Centro-Africana', 'República Checa',
'República Democrática do Congo', 'República Dominicana', 'Romênia', 'Ruanda', 'Rússia',
'Samoa', 'San Marino', 'Santa Lúcia', 'São Cristóvão e Nevis', 'São Tomé e Príncipe',
'São Vicente e Granadinas', 'Seicheles', 'Senegal', 'Serra Leoa', 'Sérvia', 'Singapura',
'Síria', 'Somália', 'Sri Lanka', 'Suazilândia', 'Sudão', 'Sudão do Sul', 'Suécia', 'Suíça',
'Suriname', 'Tailândia', 'Tajiquistão', 'Tanzânia', 'Timor-Leste', 'Togo', 'Tonga',
'Trinidad e Tobago', 'Tunísia', 'Turcomenistão', 'Turquia', 'Tuvalu', 'Ucrânia', 'Uganda',
'Uruguai', 'Uzbequistão', 'Vanuatu', 'Vaticano', 'Venezuela', 'Vietnã', 'Zâmbia', 'Zimbábue'
];

const CONTACT_TYPES = [
  { value: 'person', label: 'Pessoa' },
  { value: 'hotel', label: 'Hotel' },
  { value: 'organization', label: 'Organização' }
];

const RELATIONSHIP_OPTIONS = [
  'FAMILY_MEMBER', 'FRIEND', 'BUSINESS_ASSOCIATE', 'EMPLOYER', 'SCHOOL_OFFICIAL', 
  'TRAVEL_AGENT', 'TOUR_OPERATOR', 'OTHER'
];

const Section3Travel = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [application, setApplication] = useState(null);
  const [formData, setFormData] = useState({
    specificPlans: undefined,
    arrivalDate: '',
    arrivalFlight: '',
    arrivalCity: '',
    departureDate: '',
    departureFlight: '',
    departureCity: '',
    locationsToVisit: [{ location: '' }],
    intendedArrivalDate: '',
    intendedStayDuration: '',
    intendedStayUnit: 'WEEKS',
    stayAddress: { street1: '', street2: '', city: '', state: '', zip: '' },
    payer: {
      entity: 'SELF',
      surnames: '',
      givenNames: '',
      phone: '',
      email: '',
      relationship: '',
      addressSameAsApplicant: true,
      address: { street1: '', street2: '', city: '', state: '', zip: '', country: 'Brasil' },
      companyName: '',
      companyRelationship: ''
    },
    hasUSContact: false,
    usContact: {
      contactType: 'person',
      surname: '',
      givenName: '',
      organizationName: '',
      relationship: '',
      address: {
        street1: '',
        street2: '',
        city: '',
        state: '',
        zipCode: ''
      },
      phone: { iso2: 'us', dialCode: '1', number: '' },
      email: '',
    }
  });

  const [validation, setValidation] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    console.log("=== SECTION3 TRAVEL DEBUG ===");
    console.log("Location:", location);
    console.log("Search params:", location.search);
    
    const urlParams = new URLSearchParams(location.search);
    const appId = urlParams.get('appId');
    
    console.log("Extracted appId:", appId);
    console.log("AppId type:", typeof appId);

    if (!appId || appId === 'null' || appId === 'undefined' || appId.trim() === '' || appId === '-') {
      console.error("Invalid appId, redirecting to dashboard:", appId);
      navigate(createPageUrl("Dashboard"));
      return;
    }

    const fetchApplication = async () => {
      try {
        console.log("Loading application with ID:", appId);
        const app = await loadApplication(appId);
        console.log("Application loaded:", app);
        setApplication(app);
        if (app.data?.travel) {
          setFormData((prev) => ({ 
            ...prev, 
            ...app.data.travel, 
            specificPlans: app.data.travel.specificPlans !== undefined ? app.data.travel.specificPlans : undefined,
            hasUSContact: app.data.travel.hasUSContact ?? false,
            usContact: { ...prev.usContact, ...(app.data.travel.usContact || {}) }
          }));
        }
      } catch (error) {
        console.error("Failed to load application:", error);
        navigate(createPageUrl("Dashboard"));
      }
      setIsLoading(false);
    };

    fetchApplication();
  }, [location.search, navigate]);

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
      let current = newState;
      for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        if (!current[key] || typeof current[key] !== 'object') {
          current[key] = {};
        }
        current = current[key];
      }
      const lastKey = keys[keys.length - 1];
      current[lastKey] = value;

      if (path === 'payer.addressSameAsApplicant' && value === true) {
        newState.payer.address = { street1: '', street2: '', city: '', state: '', zip: '', country: 'Brasil' };
      }
      
      // Formatação automática para nomes
      if (path === 'payer.surnames' || path === 'payer.givenNames') {
          current[lastKey] = formatNames(value);
      }
      
      return newState;
    });
  };

  const addLocation = () => {
    setFormData((prev) => ({ ...prev, locationsToVisit: [...prev.locationsToVisit, { location: '' }] }));
  };

  const removeLocation = (index) => {
    setFormData((prev) => ({ ...prev, locationsToVisit: prev.locationsToVisit.filter((_, i) => i !== index) }));
  };

  const updateLocation = (index, value) => {
    const newLocations = [...formData.locationsToVisit];
    newLocations[index].location = formatNames(value);
    setFormData((prev) => ({ ...prev, locationsToVisit: newLocations }));
  };

  const validateSection = () => {
    const schema = schemas.travel;
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
        const updatedApp = await saveSectionData(application, 'travel', formData);
        setApplication(updatedApp);
        navigate(createPageUrl(`Section4TravelCompanions?appId=${appId}`));
      } catch (error) {
        console.error("Failed to save and navigate:", error);
      } finally {
        setIsSaving(false);
      }
    }
  };

  const prevSection = () => {
    const appId = new URLSearchParams(location.search).get('appId');
    if (appId) {
      navigate(createPageUrl(`Section2Nationality?appId=${appId}`));
    } else {
      navigate(createPageUrl("Dashboard"));
    }
  };

  const today = new Date().toISOString().split('T')[0];

  const formInputClasses = "w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors";

  const renderPayerFields = () => {
    switch (formData.payer.entity) {
      case 'OTHER PERSON':
        return (
          <div className="p-4 border rounded-lg bg-gray-50/50 space-y-4 mt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sobrenome do Pagador</label>
                <input 
                  type="text" 
                  value={formData.payer.surnames} 
                  onChange={(e) => handleNestedChange('payer.surnames', e.target.value)} 
                  className={formInputClasses}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nome do Pagador</label>
                <input 
                  type="text" 
                  value={formData.payer.givenNames} 
                  onChange={(e) => handleNestedChange('payer.givenNames', e.target.value)} 
                  className={formInputClasses}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Telefone</label>
                <input 
                  type="tel" 
                  value={formData.payer.phone} 
                  onChange={(e) => handleNestedChange('payer.phone', e.target.value)} 
                  className={formInputClasses}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">E-mail</label>
                <input 
                  type="email" 
                  value={formData.payer.email} 
                  onChange={(e) => handleNestedChange('payer.email', e.target.value)} 
                  className={formInputClasses}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Relação com você</label>
              <select 
                value={formData.payer.relationship} 
                onChange={(e) => handleNestedChange('payer.relationship', e.target.value)} 
                className={formInputClasses}
              >
                <option value="">Selecione...</option>
                <option value="CHILD">Filho(a)</option>
                <option value="PARENT">Pai/Mãe</option>
                <option value="SPOUSE">Cônjuge</option>
                <option value="OTHER RELATIVE">Outro Parente</option>
                <option value="FRIEND">Amigo(a)</option>
                <option value="OTHER">Outro</option>
              </select>
            </div>
            
            <label className="block text-sm font-medium text-gray-700 mb-2">O endereço do pagador é o mesmo que o seu?</label>
            <div className="flex items-center gap-4">
              <button 
                type="button" 
                onClick={() => handleNestedChange('payer.addressSameAsApplicant', true)} 
                className={`px-6 py-2 border rounded-lg transition-all text-sm font-medium ${formData.payer.addressSameAsApplicant ? 'border-blue-500 bg-blue-100 text-blue-700' : 'border-gray-300 hover:border-gray-400'}`}
              >
                Sim
              </button>
              <button 
                type="button" 
                onClick={() => handleNestedChange('payer.addressSameAsApplicant', false)} 
                className={`px-6 py-2 border rounded-lg transition-all text-sm font-medium ${!formData.payer.addressSameAsApplicant ? 'border-blue-500 bg-blue-100 text-blue-700' : 'border-gray-300 hover:border-gray-400'}`}
              >
                Não
              </button>
            </div>

            {!formData.payer.addressSameAsApplicant && (
              <div className="space-y-4 pt-4 border-t">
                <h4 className="font-semibold text-gray-600">Endereço do Pagador</h4>
                <input 
                  className={formInputClasses}
                  placeholder="Endereço Linha 1" 
                  value={formData.payer.address.street1} 
                  onChange={(e) => handleNestedChange('payer.address.street1', e.target.value)} 
                />
                <input 
                  className={formInputClasses}
                  placeholder="Endereço Linha 2 (Opcional)" 
                  value={formData.payer.address.street2} 
                  onChange={(e) => handleNestedChange('payer.address.street2', e.target.value)} 
                />
                <input 
                  className={formInputClasses}
                  placeholder="Cidade" 
                  value={formData.payer.address.city} 
                  onChange={(e) => handleNestedChange('payer.address.city', e.target.value)} 
                />
                <input 
                  className={formInputClasses}
                  placeholder="Estado/Província" 
                  value={formData.payer.address.state} 
                  onChange={(e) => handleNestedChange('payer.address.state', e.target.value)} 
                />
                <input 
                  className={formInputClasses}
                  placeholder="CEP" 
                  value={formData.payer.address.zip} 
                  onChange={(e) => handleNestedChange('payer.address.zip', e.target.value)} 
                />
                <select 
                  value={formData.payer.address.country} 
                  onChange={(e) => handleNestedChange('payer.address.country', e.target.value)} 
                  className={formInputClasses}
                >
                  {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            )}
          </div>
        );

      case 'OTHER COMPANY/ORGANIZATION':
        return (
          <div className="p-4 border rounded-lg bg-gray-50/50 space-y-4 mt-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nome da Empresa/Organização</label>
              <input 
                type="text" 
                value={formData.payer.companyName} 
                onChange={(e) => handleNestedChange('payer.companyName', e.target.value)} 
                className={formInputClasses}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Telefone</label>
              <input 
                type="tel" 
                value={formData.payer.phone} 
                onChange={(e) => handleNestedChange('payer.phone', e.target.value)} 
                className={formInputClasses}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Relação com você</label>
              <input 
                type="text" 
                value={formData.payer.companyRelationship} 
                onChange={(e) => handleNestedChange('payer.companyRelationship', e.target.value)} 
                className={formInputClasses}
              />
            </div>
            <div className="space-y-4 pt-4 border-t">
              <h4 className="font-semibold text-gray-600">Endereço da Empresa</h4>
              <input 
                className={formInputClasses}
                placeholder="Endereço Linha 1" 
                value={formData.payer.address.street1} 
                onChange={(e) => handleNestedChange('payer.address.street1', e.target.value)} 
              />
              <input 
                className={formInputClasses}
                placeholder="Endereço Linha 2 (Opcional)" 
                value={formData.payer.address.street2} 
                onChange={(e) => handleNestedChange('payer.address.street2', e.target.value)} 
              />
              <input 
                className={formInputClasses}
                placeholder="Cidade" 
                value={formData.payer.address.city} 
                onChange={(e) => handleNestedChange('payer.address.city', e.target.value)} 
              />
              <input 
                className={formInputClasses}
                placeholder="Estado/Província" 
                value={formData.payer.address.state} 
                onChange={(e) => handleNestedChange('payer.address.state', e.target.value)} 
              />
              <input 
                className={formInputClasses}
                placeholder="CEP" 
                value={formData.payer.address.zip} 
                onChange={(e) => handleNestedChange('payer.address.zip', e.target.value)} 
              />
              <select 
                value={formData.payer.address.country} 
                onChange={(e) => handleNestedChange('payer.address.country', e.target.value)} 
                className={formInputClasses}
              >
                {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
        );

      default:
        return null;
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
      <ProgressBar application={application} currentSectionId="travel" />
      
      <AutoSave 
        application={application}
        sectionId="travel"
        formData={formData}
        onApplicationUpdate={setApplication}
      />
      
      <div className="max-w-3xl mx-auto p-4 pt-8">
        <SectionCard
          icon="✈️"
          title="Informações sobre a Viagem"
          subtitle="Forneça detalhes sobre seus planos de viagem para os EUA."
        >
          <ConditionalField
            question="Você já tem as datas e os locais da sua viagem DEFINIDOS?"
            value={formData.specificPlans}
            onValueChange={(value) => handleInputChange('specificPlans', value)}
          >
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Itinerário Completo</h3>
              <DateInput
                label="Data de Chegada"
                value={formData.arrivalDate}
                onChange={(value) => handleInputChange('arrivalDate', value)}
                minDate={today}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Voo de Chegada (se souber)</label>
                  <input 
                    type="text" 
                    value={formData.arrivalFlight} 
                    onChange={(e) => handleInputChange('arrivalFlight', e.target.value)} 
                    className={formInputClasses}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Cidade de Chegada</label>
                  <input 
                    type="text" 
                    value={formData.arrivalCity} 
                    onChange={(e) => handleInputChange('arrivalCity', formatNames(e.target.value))}
                    className={formInputClasses}
                  />
                </div>
              </div>
              <hr className="my-4" />
              <DateInput
                label="Data de Partida"
                value={formData.departureDate}
                onChange={(value) => handleInputChange('departureDate', value)}
                minDate={formData.arrivalDate || today}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Voo de Partida (se souber)</label>
                  <input 
                    type="text" 
                    value={formData.departureFlight} 
                    onChange={(e) => handleInputChange('departureFlight', e.target.value)} 
                    className={formInputClasses}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Cidade de Partida</label>
                  <input 
                    type="text" 
                    value={formData.departureCity} 
                    onChange={(e) => handleInputChange('departureCity', formatNames(e.target.value))}
                    className={formInputClasses}
                  />
                </div>
              </div>
              <hr className="my-4" />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Locais que planeja visitar nos EUA</label>
                {formData.locationsToVisit.map((loc, index) => (
                  <div key={index} className="flex items-center gap-2 mb-2">
                    <input 
                      type="text" 
                      value={loc.location} 
                      onChange={(e) => updateLocation(index, e.target.value)} 
                      className={formInputClasses}
                      placeholder="Ex: Orlando, FL" 
                    />
                    {formData.locationsToVisit.length > 1 && (
                      <button 
                        type="button" 
                        onClick={() => removeLocation(index)} 
                        className="px-3 py-2 text-red-600 hover:bg-red-100 rounded-lg"
                      >
                        Remover
                      </button>
                    )}
                  </div>
                ))}
                <button 
                  type="button" 
                  onClick={addLocation} 
                  className="mt-2 px-8 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium transition-colors disabled:opacity-50 text-sm"
                >
                  + Adicionar Local
                </button>
              </div>
            </div>
          </ConditionalField>

          {formData.specificPlans === false && (
            <div className="space-y-4 my-6">
              <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Plano Estimado</h3>
              <DateInput
                label="Data Estimada de Chegada"
                value={formData.intendedArrivalDate}
                onChange={(value) => handleInputChange('intendedArrivalDate', value)}
                minDate={today}
              />
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Duração Estimada da Estadia</label>
                <div className="flex gap-2">
                  <input 
                    type="number" 
                    value={formData.intendedStayDuration} 
                    onChange={(e) => handleInputChange('intendedStayDuration', e.target.value)} 
                    className="w-1/2 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  />
                  <select 
                    value={formData.intendedStayUnit} 
                    onChange={(e) => handleInputChange('intendedStayUnit', e.target.value)} 
                    className="w-1/2 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  >
                    <option value="DAYS">Dia(s)</option>
                    <option value="WEEKS">Semana(s)</option>
                    <option value="MONTHS">Mês(es)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {formData.specificPlans !== undefined && (
            <div className="space-y-4 mt-6">
              <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Endereço de Hospedagem nos EUA</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Endereço (Linha 1)</label>
                <input 
                  type="text" 
                  value={formData.stayAddress.street1} 
                  onChange={(e) => handleNestedChange('stayAddress.street1', e.target.value)} 
                  className={formInputClasses}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Endereço (Linha 2) <span className="text-gray-500">(Opcional)</span></label>
                <input 
                  type="text" 
                  value={formData.stayAddress.street2} 
                  onChange={(e) => handleNestedChange('stayAddress.street2', e.target.value)} 
                  className={formInputClasses}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Cidade</label>
                  <input 
                    type="text" 
                    value={formData.stayAddress.city} 
                    onChange={(e) => handleNestedChange('stayAddress.city', e.target.value)} 
                    className={formInputClasses}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
                  <select 
                    value={formData.stayAddress.state} 
                    onChange={(e) => handleNestedChange('stayAddress.state', e.target.value)} 
                    className={formInputClasses}
                  >
                    <option value="">Selecione...</option>
                    {US_STATES.map((state) => <option key={state.code} value={state.code}>{state.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ZIP Code (se souber)</label>
                <input 
                  type="text" 
                  value={formData.stayAddress.zip} 
                  onChange={(e) => handleNestedChange('stayAddress.zip', e.target.value)} 
                  className={formInputClasses}
                />
              </div>
            </div>
          )}
          
          <div className="mt-6">
            <ConditionalField
              question="Você já tem um contato nos EUA que possa confirmar sua identidade?"
              value={formData.hasUSContact}
              onValueChange={(value) => handleInputChange('hasUSContact', value)}
            >
              <div className="space-y-6">
                {/* Contact Type Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Tipo de Contato nos EUA
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {CONTACT_TYPES.map(type => (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => handleNestedChange('usContact.contactType', type.value)}
                        className={`p-4 border-2 rounded-lg text-center transition-all ${
                          formData.usContact.contactType === type.value
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Contact Information */}
                {formData.usContact.contactType === 'person' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Sobrenome</label>
                      <input 
                        type="text" 
                        value={formData.usContact.surname} 
                        onChange={(e) => handleNestedChange('usContact.surname', formatNames(e.target.value))} 
                        className={formInputClasses}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Nome</label>
                      <input 
                        type="text" 
                        value={formData.usContact.givenName} 
                        onChange={(e) => handleNestedChange('usContact.givenName', formatNames(e.target.value))} 
                        className={formInputClasses}
                      />
                    </div>
                  </div>
                )}

                {formData.usContact.contactType === 'organization' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nome da Organização</label>
                    <input 
                      type="text" 
                      value={formData.usContact.organizationName} 
                      onChange={(e) => handleNestedChange('usContact.organizationName', formatNames(e.target.value))} 
                      className={formInputClasses}
                    />
                  </div>
                )}

                {formData.usContact.contactType === 'person' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Relacionamento</label>
                    <select 
                      value={formData.usContact.relationship} 
                      onChange={(e) => handleNestedChange('usContact.relationship', e.target.value)} 
                      className={formInputClasses}
                    >
                      <option value="">Selecione...</option>
                      <option value="FAMILY_MEMBER">Membro da Família</option>
                      <option value="FRIEND">Amigo(a)</option>
                      <option value="BUSINESS_ASSOCIATE">Associado de Negócios</option>
                      <option value="EMPLOYER">Empregador</option>
                      <option value="SCHOOL_OFFICIAL">Funcionário da Escola</option>
                      <option value="TRAVEL_AGENT">Agente de Viagem</option>
                      <option value="TOUR_OPERATOR">Operador de Turismo</option>
                      <option value="OTHER">Outro</option>
                    </select>
                  </div>
                )}

                {/* Address */}
                <div className="space-y-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Endereço (Linha 1)</label>
                    <input 
                      type="text" 
                      value={formData.usContact.address.street1} 
                      onChange={(e) => handleNestedChange('usContact.address.street1', e.target.value)} 
                      className={formInputClasses}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Endereço (Linha 2) - Opcional</label>
                    <input 
                      type="text" 
                      value={formData.usContact.address.street2} 
                      onChange={(e) => handleNestedChange('usContact.address.street2', e.target.value)} 
                      className={formInputClasses}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Cidade</label>
                      <input 
                        type="text" 
                        value={formData.usContact.address.city} 
                        onChange={(e) => handleNestedChange('usContact.address.city', formatNames(e.target.value))} 
                        className={formInputClasses}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
                      <select 
                        value={formData.usContact.address.state} 
                        onChange={(e) => handleNestedChange('usContact.address.state', e.target.value)} 
                        className={formInputClasses}
                      >
                        <option value="">Selecione...</option>
                        {US_STATES.map(state => (
                          <option key={state.code} value={state.code}>{state.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">CEP (ZIP Code)</label>
                    <input 
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={formData.usContact.address.zipCode} 
                      onChange={(e) => handleNestedChange('usContact.address.zipCode', e.target.value)} 
                      className={`${formInputClasses} w-1/3`}
                      placeholder="12345"
                    />
                  </div>
                </div>

                {/* Contact Info */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Informações de Contato</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Telefone</label>
                    <PhoneInput 
                      value={formData.usContact.phone} 
                      onChange={(val) => handleNestedChange('usContact.phone', val)}
                      placeholder="Número nos EUA"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">E-mail</label>
                    <input 
                      type="email" 
                      value={formData.usContact.email} 
                      onChange={(e) => handleNestedChange('usContact.email', e.target.value)} 
                      className={formInputClasses}
                      placeholder="email@exemplo.com"
                    />
                  </div>
                </div>
              </div>
            </ConditionalField>
          </div>
          
          <div className="space-y-4 mt-6">
            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Responsável Financeiro</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Quem está pagando pela sua viagem?</label>
              <select 
                value={formData.payer.entity} 
                onChange={(e) => handleNestedChange('payer.entity', e.target.value)} 
                className={formInputClasses}
              >
                <option value="SELF">Eu mesmo</option>
                <option value="OTHER PERSON">Outra Pessoa</option>
                <option value="OTHER COMPANY/ORGANIZATION">Outra Empresa/Organização</option>
              </select>
            </div>
            {renderPayerFields()}
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

export default Section3Travel;
