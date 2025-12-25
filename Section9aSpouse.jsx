
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { loadApplication, saveSectionData } from '@/components/storage';
import ProgressBar from '../components/ProgressBar';
import SectionCard from '../components/SectionCard';
import ConditionalField from '../components/ConditionalField'; // Keep ConditionalField if it's used elsewhere, but not for this component's address logic.
import DateInput from '../components/DateInput';
import { formatNames } from '../components/utils/formatters';
import { COUNTRIES } from '../components/utils/countries';
import { BRAZILIAN_STATES } from '../components/utils/brazilianStates'; // Assuming you have this utility file

const NATIONALITIES = [
  'Afegã', 'Sul-africana', 'Albanesa', 'Alemã', 'Americana', 'Andorrana', 'Angolana', 'Antiguense',
  'Saudita', 'Argelina', 'Argentina', 'Armênia', 'Australiana', 'Austríaca', 'Azerbaijana',
  'Bahamense', 'Bareinita', 'Bangladense', 'Barbadense', 'Belga', 'Belizenha', 'Beninense', 'Boliviana',
  'Bósnia', 'Botsuanesa', 'Brasileira', 'Bruneana', 'Búlgara', 'Burquinense', 'Burundiana',
  'Butanesa', 'Cabo-verdiana', 'Camaronesa', 'Cambojana', 'Canadense', 'Catari', 'Cazaque', 'Chadiana',
  'Chilena', 'Chinesa', 'Cipriota', 'Colombiana', 'Comorense', 'Congolesa', 'Norte-coreana', 'Sul-coreana',
  'Marfinense', 'Costa-riquenha', 'Croata', 'Cubana', 'Dinamarquesa', 'Djibutiense', 'Dominiquense',
  'Egípcia', 'Salvadorenha', 'Emiradense', 'Equatoriana', 'Eritreia', 'Eslovaca',
  'Eslovena', 'Espanhola', 'Estoniana', 'Etíope', 'Fijiana', 'Filipina',
  'Finlandesa', 'Francesa', 'Gabonesa', 'Gambiana', 'Ganense', 'Georgiana', 'Granadina', 'Grega',
  'Guatemalteca', 'Guianense', 'Guineense', 'Guiné-equatoriana', 'Guineense-bissau', 'Haitiana', 'Holandesa', 'Hondurenha',
  'Húngara', 'Iemenita', 'Marshallesa', 'Salomonense', 'Indiana', 'Indonésia', 'Iraniana', 'Iraquiana',
  'Irlandesa', 'Islandesa', 'Israelense', 'Italiana', 'Jamaicana', 'Japonesa', 'Jordaniana', 'Kuwaitiana',
  'Laosiana', 'Lesotense', 'Letã', 'Libanesa', 'Liberiana', 'Líbia', 'Liechtensteinense', 'Lituana',
  'Luxemburguesa', 'Norte-macedônica', 'Malgaxe', 'Malaia', 'Malauiana', 'Maldívia', 'Maliana',
  'Maltesa', 'Marroquina', 'Mauriciana', 'Mauritana', 'Mexicana', 'Mianmarense', 'Micronésia', 'Moçambicana',
  'Moldávia', 'Monegasca', 'Mongol', 'Montenegrina', 'Namibiana', 'Nauruana', 'Nepalesa', 'Nicaraguense',
  'Nigerina', 'Nigeriana', 'Norueguesa', 'Neozelandesa', 'Omanense', 'Palauense', 'Panamenha',
  'Papua nova-guineense', 'Paquistanesa', 'Paraguaia', 'Peruana', 'Polonesa', 'Portuguesa', 'Queniana',
  'Quirguiz', 'Britânica', 'Centro-africana', 'Tcheca',
  'Congolesa (Rep. Dem.)', 'Dominicana', 'Romena', 'Ruandesa', 'Russa',
  'Samoana', 'São-marinense', 'Santa-lucense', 'São-cristovense', 'São-tomense',
  'São-vicentina', 'Seichelense', 'Senegalesa', 'Serra-leonesa', 'Sérvia', 'Singapuriana',
  'Síria', 'Somali', 'Cingalesa', 'Suazi', 'Sudanesa', 'Sul-sudanês', 'Sueca', 'Suíça',
  'Surinamesa', 'Tailandesa', 'Tadjique', 'Tanzaniana', 'Timorense', 'Togolesa', 'Tonganesa',
  'Trinitária', 'Tunisiana', 'Turcomena', 'Turca', 'Tuvaluana', 'Ucraniana', 'Ugandesa',
  'Uruguaia', 'Uzbeque', 'Vanuatuense', 'Vaticana', 'Venezuelana', 'Vietnamita', 'Zambiana', 'Zimbabuense'
].sort((a, b) => a.localeCompare(b));

const Section9aSpouse = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const appId = new URLSearchParams(location.search).get('appId');

  const [application, setApplication] = useState(null);
  const [formData, setFormData] = useState({
    surname: '',
    givenName: '',
    birthDate: '',
    nationality: 'Brasileira', // Changed initial value
    cityOfBirth: '',
    countryOfBirth: 'Brasil',
    isAddressSameAsApplicant: true,
    address: {
        street1: '',
        street2: '',
        number: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'Brasil'
    }
  });

  const [validation, setValidation] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const today = new Date();

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
        if (app.data?.spouse) {
          setFormData((prev) => ({ 
            ...prev, 
            ...app.data.spouse,
            address: { ...prev.address, ...app.data.spouse.address },
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

  const handleInputChange = (path, value) => {
    setFormData(prev => {
      const keys = path.split('.');
      const newState = JSON.parse(JSON.stringify(prev));
      let current = newState;
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      current[keys.at(-1)] = ['surname', 'givenName'].includes(keys.at(-1)) ? formatNames(value) : value;
      return newState;
    });
    if (validation[path]) {
      setValidation(prev => ({ ...prev, [path]: null }));
    }
  };

  const handleCepLookup = async (cep, addressPath) => {
    if (cep && cep.replace(/\D/g, '').length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cep.replace(/\D/g, '')}/json/`);
        const data = await response.json();
        if (!data.erro) {
          handleInputChange(`${addressPath}.street1`, data.logradouro || '');
          handleInputChange(`${addressPath}.city`, data.localidade || '');
          handleInputChange(`${addressPath}.state`, data.uf || '');
        }
      } catch (error) {
        console.error('Erro ao buscar CEP:', error);
      }
    }
  };
  
  const validateSection = () => {
    const schema = schemas.spouse;
    if (!schema) {
      setValidation({});
      return true;
    }
    const { ok, errors } = validateWithSchema(schema, formData);
    setValidation(toValidationMap(errors));
    return ok;
  };

  const nextSection = async () => {
    if (validateSection()) {
      setIsSaving(true);
      try {
        const updatedApp = await saveSectionData(application, 'spouse', formData);
        setApplication(updatedApp);
        navigate(createPageUrl(`Section10WorkEducation?appId=${appId}`));
      } catch (error) {
        console.error("Failed to save and navigate:", error);
      } finally {
        setIsSaving(false);
      }
    }
  };
  
  const prevSection = () => navigate(createPageUrl(`Section9Family?appId=${appId}`));

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const renderAddressFields = () => (
    <div className="space-y-4 mt-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">CEP</label>
          <input
            type="text"
            value={formData.address.zipCode}
            onChange={(e) => handleInputChange('address.zipCode', e.target.value)}
            onBlur={(e) => handleCepLookup(e.target.value, 'address')}
            className="w-full form-input"
            placeholder="00000-000"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Endereço (Rua, Avenida)</label>
                <input type="text" value={formData.address.street1} onChange={(e) => handleInputChange('address.street1', e.target.value)} className="w-full form-input" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Número</label>
                <input type="text" value={formData.address.number} onChange={(e) => handleInputChange('address.number', e.target.value)} className="w-full form-input" />
            </div>
        </div>
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Complemento (opcional)</label>
            <input type="text" value={formData.address.street2} onChange={(e) => handleInputChange('address.street2', e.target.value)} className="w-full form-input" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cidade</label>
                <input type="text" value={formData.address.city} onChange={(e) => handleInputChange('address.city', e.target.value)} className="w-full form-input" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
                 <select value={formData.address.state} onChange={(e) => handleInputChange('address.state', e.target.value)} className="w-full form-input">
                    <option value="">Selecione...</option>
                    {BRAZILIAN_STATES.map(s => <option key={s.code} value={s.code}>{s.name}</option>)}
                </select>
            </div>
        </div>
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">País</label>
             <select value={formData.address.country} onChange={(e) => handleInputChange('address.country', e.target.value)} className="w-full form-input">
                {COUNTRIES.map(c => <option key={c.iso2} value={c.name}>{c.name}</option>)}
            </select>
        </div>
    </div>
  );

  const spouseFullName = `${formData.givenName || ''} ${formData.surname || ''}`.trim();

  return (
    <div className="min-h-screen bg-gray-50">
      <ProgressBar application={application} currentSectionId="spouse" />
      <div className="max-w-3xl mx-auto p-4 pt-8">
        <SectionCard icon="❤️" title="Informações do Cônjuge" subtitle="Forneça os detalhes do seu cônjuge ou parceiro(a).">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Sobrenome</label>
                    <input type="text" value={formData.surname} onChange={(e) => handleInputChange('surname', e.target.value)} className={`w-full form-input ${validation['surname'] ? 'border-red-500' : ''}`} />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nome</label>
                    <input type="text" value={formData.givenName} onChange={(e) => handleInputChange('givenName', e.target.value)} className={`w-full form-input ${validation['givenName'] ? 'border-red-500' : ''}`} />
                </div>
            </div>
            
            <DateInput label="Data de Nascimento" value={formData.birthDate} onChange={(val) => handleInputChange('birthDate', val)} maxDate={today} error={validation['birthDate']} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nacionalidade</label>
                    <select
                      value={formData.nationality}
                      onChange={(e) => handleInputChange('nationality', e.target.value)}
                      className={`w-full form-input ${validation['nationality'] ? 'border-red-500' : ''}`}
                    >
                      {NATIONALITIES.map(nationality => (
                        <option key={nationality} value={nationality}>{nationality}</option>
                      ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Cidade de Nascimento</label>
                    <input type="text" value={formData.cityOfBirth} onChange={(e) => handleInputChange('cityOfBirth', e.target.value)} className={`w-full form-input ${validation['cityOfBirth'] ? 'border-red-500' : ''}`} />
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">País de Nascimento</label>
                <select value={formData.countryOfBirth} onChange={(e) => handleInputChange('countryOfBirth', e.target.value)} className={`w-full form-input ${validation['countryOfBirth'] ? 'border-red-500' : ''}`} >
                    {COUNTRIES.map(c => <option key={c.iso2} value={c.name}>{c.name}</option>)}
                </select>
            </div>

            <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50/50">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                O endereço de {spouseFullName || 'seu cônjuge'} é o mesmo que o seu?
              </label>
              <div className="flex items-center gap-4 mb-4">
                <button
                  type="button"
                  onClick={() => handleInputChange('isAddressSameAsApplicant', false)} // Set to false if NOT same (i.e., 'Não')
                  className={`px-6 py-2 border rounded-lg transition-all text-sm font-medium ${
                    formData.isAddressSameAsApplicant === false
                      ? 'border-blue-500 bg-blue-100 text-blue-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  Não
                </button>
                <button
                  type="button"
                  onClick={() => handleInputChange('isAddressSameAsApplicant', true)} // Set to true if IS same (i.e., 'Sim')
                  className={`px-6 py-2 border rounded-lg transition-all text-sm font-medium ${
                    formData.isAddressSameAsApplicant === true
                      ? 'border-blue-500 bg-blue-100 text-blue-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  Sim
                </button>
              </div>
              
              {!formData.isAddressSameAsApplicant && (
                <div className="pt-4 border-t border-gray-200">
                  {renderAddressFields()}
                </div>
              )}
            </div>
          </div>
          <div className="flex justify-between items-center mt-8">
            <button onClick={prevSection} className="btn-secondary">← Voltar</button>
            <button onClick={nextSection} disabled={isSaving} className="btn-primary">{isSaving ? 'Salvando...' : 'Próximo →'}</button>
          </div>
        </SectionCard>
      </div>
    </div>
  );
};

export default Section9aSpouse;
