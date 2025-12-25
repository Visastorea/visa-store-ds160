
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { loadApplication, saveSectionData } from '@/components/storage';
import ProgressBar from '../components/ProgressBar';
import SectionCard from '../components/SectionCard';
import ConditionalField from '../components/ConditionalField';
import CPFInput from '../components/CPFInput';
import AutoSave from '../components/AutoSave';
import { schemas } from '@/lib/sectionSchemas';
import { validateWithSchema, toValidationMap } from '@/lib/validation';

const COUNTRIES = [
  'Brasil',
  'Afeganistão', 'África do Sul', 'Albânia', 'Alemanha', 'Andorra', 'Angola', 'Antígua e Barbuda',
  'Arábia Saudita', 'Argélia', 'Argentina', 'Armênia', 'Australiana', 'Áustria', 'Azerbaijão',
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
  'Laos', 'Lesoto', 'Letônia', 'Líbano', 'Libéria', 'Líbia', 'Liechtenstein', 'Lituana',
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
  'Suriname', 'Tailândia', 'Tajiquistão', 'Tanzaniana', 'Timor-Leste', 'Togo', 'Tonga',
  'Trinidad e Tobago', 'Tunísia', 'Turcomenistão', 'Turquia', 'Tuvalu', 'Ucrânia', 'Uganda',
  'Uruguai', 'Uzbequistão', 'Vanuatu', 'Vaticano', 'Venezuela', 'Vietnamita', 'Zâmbia', 'Zimbábue'
];

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

const Section2Nationality = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [application, setApplication] = useState(null);
  const [formData, setFormData] = useState({
    countryOfOrigin: 'Brasileira',
    hasOtherNationality: false,
    otherNationalities: [],
    isPermanentResident: false,
    permanentResidentCountry: '',
    nationalId: '',
    hasUSIdentification: false,
    hasSocialSecurity: false,
    usSocialSecurityNumber: '',
    hasTaxpayerId: false,
    usTaxpayerId: ''
  });

  const [validation, setValidation] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const appId = urlParams.get('appId');
    
    console.log('Section2Nationality - appId from URL:', appId);
    console.log('Section2Nationality - location.search:', location.search);
    
    // Validação mais permissiva para debug
    if (!appId || appId === 'null' || appId === 'undefined' || String(appId).trim() === '' || appId === '-') {
      console.error("Section2Nationality - Invalid appId detected:", appId);
      console.error("Section2Nationality - Redirecting to dashboard");
      navigate(createPageUrl("Dashboard"));
      return;
    }

    const fetchApplication = async () => {
      try {
        const app = await loadApplication(appId);
        setApplication(app);

        const loadedData = app.data?.nationality || {};
        
        // Garante que a nacionalidade padrão seja 'Brasileira' se não estiver definida ou for nula
        if (!loadedData.countryOfOrigin) {
          loadedData.countryOfOrigin = 'Brasileira';
        }
        
        // Merge loaded data, ensuring new fields are present if not in saved data
        setFormData((prev) => ({
          ...prev,
          ...loadedData,
          hasUSIdentification: loadedData.hasUSIdentification ?? false, // Ensure new field is initialized
        }));
        
      } catch (error) {
        console.error("Section2Nationality - Failed to load application:", error);
        navigate(createPageUrl("Dashboard"));
      }
      setIsLoading(false);
    };

    fetchApplication();
  }, [location.search, navigate]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => {
      const newState = { ...prev, [field]: value };
      if (field === 'hasOtherNationality' && !value) newState.otherNationalities = [];
      if (field === 'isPermanentResident' && !value) newState.permanentResidentCountry = '';

      // Reset US identification fields if hasUSIdentification becomes false
      if (field === 'hasUSIdentification' && !value) {
        newState.hasSocialSecurity = false;
        newState.usSocialSecurityNumber = '';
        newState.hasTaxpayerId = false;
        newState.usTaxpayerId = '';
      }
      // Reset individual US ID fields if their respective flags become false
      if (field === 'hasSocialSecurity' && !value) newState.usSocialSecurityNumber = '';
      if (field === 'hasTaxpayerId' && !value) newState.usTaxpayerId = '';
      return newState;
    });

    if (validation[field]) {
      setValidation((prev) => ({ ...prev, [field]: null }));
    }
  };

  const validateSection = () => {
    const schema = schemas.nationality;
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
        const updatedApp = await saveSectionData(application, 'nationality', formData);
        setApplication(updatedApp);
        navigate(createPageUrl(`Section3Travel?appId=${appId}`));
      } catch (error) {
        console.error("Failed to save and navigate:", error);
      } finally {
        setIsSaving(false);
      }
    }
  };

  const prevSection = () => {
    const appId = new URLSearchParams(location.search).get('appId');
    if (!appId || appId === 'null' || appId === 'undefined' || String(appId).trim() === '' || appId === '-') {
        navigate(createPageUrl("Dashboard"));
    } else {
        navigate(createPageUrl(`Section1Personal?appId=${appId}`));
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
      <ProgressBar application={application} currentSectionId="nationality" />
      
      {/* AutoSave Component */}
      <AutoSave 
        application={application}
        sectionId="nationality"
        formData={formData}
        onApplicationUpdate={setApplication}
      />
      
      <div className="max-w-3xl mx-auto p-4 pt-8">
        <SectionCard
          icon="🌍"
          title="Informações Pessoais 2"
          subtitle="Detalhes sobre sua nacionalidade e documentos."
        >
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Nacionalidade de Origem</label>
            <select
              value={formData.countryOfOrigin}
              onChange={(e) => handleInputChange('countryOfOrigin', e.target.value)}
              className="w-full form-input"
            >
              {NATIONALITIES.map(nationality => (
                <option key={nationality} value={nationality}>{nationality}</option>
              ))}
            </select>
          </div>

          <ConditionalField
            question="Você possui ou já possuiu alguma outra nacionalidade além da indicada acima?"
            value={formData.hasOtherNationality}
            onValueChange={(value) => handleInputChange('hasOtherNationality', value)}
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Outras Nacionalidades</label>
              <select
                multiple
                value={formData.otherNationalities}
                onChange={(e) => {
                  const values = Array.from(e.target.selectedOptions, option => option.value);
                  handleInputChange('otherNationalities', values);
                }}
                className="w-full form-input h-32"
              >
                {NATIONALITIES.map(nationality => (
                  <option key={nationality} value={nationality}>{nationality}</option>
                ))}
              </select>
              <p className="text-sm text-gray-600 mt-1">Segure Ctrl (ou Cmd no Mac) para selecionar múltiplas opções</p>
            </div>
          </ConditionalField>

          <ConditionalField
            question="Você é residente permanente de um país diferente da sua nacionalidade de origem?"
            value={formData.isPermanentResident}
            onValueChange={(value) => handleInputChange('isPermanentResident', value)}
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">País de Residência Permanente</label>
              <select
                value={formData.permanentResidentCountry}
                onChange={(e) => handleInputChange('permanentResidentCountry', e.target.value)}
                className={`w-full form-input ${validation.permanentResidentCountry ? 'border-red-500' : ''}`}
              >
                <option value="">Selecione o país...</option>
                {COUNTRIES.map(country => (
                  <option key={country} value={country}>{country}</option>
                ))}
              </select>
              {validation.permanentResidentCountry && (
                <p className="text-red-500 text-sm mt-1">{validation.permanentResidentCountry}</p>
              )}
            </div>
          </ConditionalField>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Número de Identificação Nacional (CPF ou similar)</label>
            <CPFInput
              value={formData.nationalId}
              onChange={(value) => handleInputChange('nationalId', value)}
              error={validation.nationalId}
              placeholder="000.000.000-00"
            />
          </div>

          {/* Reconstrução da Seção de Segurança - Agrupando identificações dos EUA */}
          <ConditionalField
            question="Você possui algum número de identificação fiscal dos EUA (Social Security Number - SSN ou Taxpayer Identification Number - ITIN)?"
            value={formData.hasUSIdentification}
            onValueChange={(value) => handleInputChange('hasUSIdentification', value)}
          >
            {formData.hasUSIdentification && (
              <>
                <ConditionalField
                  question="Você possui Número do Social Security dos EUA (SSN)?"
                  value={formData.hasSocialSecurity}
                  onValueChange={(value) => handleInputChange('hasSocialSecurity', value)}
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Número do Social Security (SSN)</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={formData.usSocialSecurityNumber}
                      onChange={(e) => {
                        let value = e.target.value.replace(/\D/g, '');
                        value = value.substring(0, 9);

                        if (value.length > 5) {
                          value = value.replace(/^(\d{3})(\d{2})(\d{4}).*/, '$1-$2-$3');
                        } else if (value.length > 3) {
                          value = value.replace(/^(\d{3})(\d{2}).*/, '$1-$2');
                        } else if (value.length > 0) {
                          value = value.replace(/^(\d{3}).*/, '$1');
                        }
                        handleInputChange('usSocialSecurityNumber', value);
                      }}
                      className="w-full form-input"
                      placeholder="000-00-0000"
                    />
                  </div>
                </ConditionalField>

                <ConditionalField
                  question="Você possui Número de Identificação de Contribuinte dos EUA (ITIN ou EIN)?"
                  value={formData.hasTaxpayerId}
                  onValueChange={(value) => handleInputChange('hasTaxpayerId', value)}
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Taxpayer ID (ITIN/EIN)</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={formData.usTaxpayerId}
                      onChange={(e) => {
                        let value = e.target.value.replace(/\D/g, '');

                        if (value.length > 9) {
                          value = value.substring(0, 9);
                        }

                        if (value.startsWith('9')) {
                          if (value.length > 5) {
                            value = value.replace(/^(\d{3})(\d{2})(\d{4}).*/, '$1-$2-$3');
                          } else if (value.length > 3) {
                            value = value.replace(/^(\d{3})(\d{2}).*/, '$1-$2');
                          } else if (value.length > 0) {
                            value = value.replace(/^(\d{3}).*/, '$1');
                          }
                        } else {
                          if (value.length > 2) {
                            value = value.replace(/^(\d{2})(\d{7}).*/, '$1-$2');
                          }
                        }
                        handleInputChange('usTaxpayerId', value);
                      }}
                      className="w-full form-input"
                      placeholder="999-99-9999 ou 00-0000000"
                    />
                  </div>
                </ConditionalField>
              </>
            )}
          </ConditionalField>

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
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Salvando...' : 'Próximo →'}
            </button>
          </div>
        </SectionCard>
      </div>
    </div>
  );
};

export default Section2Nationality;
