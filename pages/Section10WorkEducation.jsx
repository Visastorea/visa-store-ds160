
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { loadApplication, saveSectionData } from '@/components/storage';
import ProgressBar from '../components/ProgressBar';
import SectionCard from '../components/SectionCard';
import ConditionalField from '../components/ConditionalField';
import PhoneInput from '../components/PhoneInput';
import DateInput from '../components/DateInput';
import CurrencyInput from '../components/CurrencyInput';
import { Plus, Trash2 } from 'lucide-react';
import { COUNTRIES } from '../components/utils/countries';
import { formatCityState } from '../components/utils/formatters';

const OCCUPATIONS = [
  { value: 'AGRICULTURE', label: 'Agricultura' },
  { value: 'ARTIST_PERFORMER', label: 'Artista/Artista' },
  { value: 'BUSINESS', label: 'Negócios' },
  { value: 'COMMUNICATIONS', label: 'Comunicações' },
  { value: 'CULINARY_FOOD_SERVICES', label: 'Culinária/Serviços de Alimentação' },
  { value: 'COMPUTER_SCIENCE', label: 'Ciência da Computação' },
  { value: 'EDUCATION', label: 'Educação' },
  { value: 'ENGINEERING', label: 'Engenharia' },
  { value: 'GOVERNMENT', label: 'Governo' },
  { value: 'HOMEMAKER', label: 'Do Lar' },
  { value: 'LEGAL_PROFESSION', label: 'Profissão Jurídica' },
  { value: 'MEDICAL_HEALTHCARE', label: 'Médico/Saúde' },
  { value: 'MILITARY', label: 'Militar' },
  { value: 'NATURAL_SCIENCE', label: 'Ciências Naturais' },
  { value: 'NOT_EMPLOYED', label: 'Não Empregado' },
  { value: 'PHYSICAL_SCIENCES', label: 'Ciências Físicas' },
  { value: 'RELIGIOUS_VOCATION', label: 'Vocação Religiosa' },
  { value: 'RESEARCH', label: 'Pesquisa' },
  { value: 'RETIRED', label: 'Aposentado' },
  { value: 'SOCIAL_SCIENCE', label: 'Ciências Sociais' },
  { value: 'STUDENT', label: 'Estudante' },
  { value: 'OTHER', label: 'Outro' }
];

const BRAZILIAN_STATES = [
  { name: "Acre", code: "AC" }, { name: "Alagoas", code: "AL" }, { name: "Amapá", code: "AP" },
  { name: "Amazonas", code: "AM" }, { name: "Bahia", code: "BA" }, { name: "Ceará", code: "CE" },
  { name: "Distrito Federal", code: "DF" }, { name: "Espírito Santo", code: "ES" }, { name: "Goiás", code: "GO" },
  { name: "Maranhão", code: "MA" }, { name: "Mato Grosso", code: "MT" }, { name: "Mato Grosso do Sul", code: "MS" },
  { name: "Minas Gerais", code: "MG" }, { name: "Pará", code: "PA" }, { name: "Paraíba", code: "PB" },
  { name: "Paraná", code: "PR" }, { name: "Pernambuco", code: "PE" }, { name: "Piauí", code: "PI" },
  { name: "Rio de Janeiro", code: "RJ" }, { name: "Rio Grande do Norte", code: "RN" }, { name: "Rio Grande do Sul", code: "RS" },
  { name: "Rondônia", code: "RO" }, { name: "Roraima", code: "RR" }, { name: "Santa Catarina", code: "SC" },
  { name: "São Paulo", code: "SP" }, { name: "Sergipe", code: "SE" }, { name: "Tocantins", code: "TO" }
];

const Section10WorkEducation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const appId = new URLSearchParams(location.search).get('appId');

  const [application, setApplication] = useState(null);
  const [formData, setFormData] = useState({
    primaryOccupation: '',
    otherOccupationDetails: '', // New field for "OTHER" occupation
    currentEmployer: {
      name: '',
      address: { cep: '', street1: '', street2: '', number: '', city: '', state: '', country: 'Brasil' },
      phone: { iso2: 'br', dialCode: '55', number: '' },
      startDate: '',
      monthlySalary: '',
      duties: ''
    },
    wasPreviouslyEmployed: false,
    previousEmployers: [],
    attendedEducation: false,
    educationInstitutions: []
  });

  const [validation, setValidation] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const today = new Date(); // Used for maxDate on date inputs

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
        if (app.data?.workEducation) {
          setFormData((prev) => ({
            ...prev,
            ...app.data.workEducation,
            otherOccupationDetails: app.data.workEducation.otherOccupationDetails || ''
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

      // Apply city/state formatting
      if (['city', 'state'].includes(keys.at(-1)) && typeof value === 'string') {
        current[keys.at(-1)] = formatCityState(value);
      } else {
        current[keys.at(-1)] = value;
      }

      // Clear otherOccupationDetails if occupation is not "OTHER"
      if (path === 'primaryOccupation' && value !== 'OTHER') {
        newState.otherOccupationDetails = '';
      }

      return newState;
    });

    if (validation[path]) {
      setValidation(prev => ({ ...prev, [path]: null }));
    }
  };

  const handleCepBlur = async (cep, addressPath) => {
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

  const addToList = (listName) => {
    let newItem;
    if (listName === 'previousEmployers') {
      newItem = {
        name: '',
        address: { cep: '', street1: '', street2: '', number: '', city: '', state: '', country: 'Brasil' },
        phone: { iso2: 'br', dialCode: '55', number: '' },
        jobTitle: '',
        supervisorSurname: '',
        supervisorGivenName: '',
        knowsSupervisor: true,
        startDate: '',
        endDate: '',
        duties: ''
      };
    } else if (listName === 'educationInstitutions') {
      newItem = {
        name: '',
        address: { cep: '', street1: '', street2: '', number: '', city: '', state: '', country: 'Brasil' },
        course: '',
        startDate: '',
        endDate: ''
      };
    }
    setFormData(prev => ({ ...prev, [listName]: [...prev[listName], newItem] }));
  };

  const removeFromList = (listName, index) => {
    setFormData(prev => ({ ...prev, [listName]: prev[listName].filter((_, i) => i !== index) }));
  };

  const updateListItem = (listName, index, path, value) => {
    setFormData(prev => {
      const newList = [...prev[listName]];
      const keys = path.split('.');
      let current = newList[index];
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      current[keys.at(-1)] = value;
      return { ...prev, [listName]: newList };
    });
  };

  const validateSection = () => {
    const schema = schemas.workEducation;
    if (!schema) {
      setValidation({});
      return true;
    }
    const { ok, errors } = validateWithSchema(schema, formData);
    setValidation(toValidationMap(errors));
    return ok;
  };

    // Validate "OTHER" occupation details
    if (formData.primaryOccupation === 'OTHER' && !formData.otherOccupationDetails) {
      newValidation['otherOccupationDetails'] = 'Especificação é obrigatória quando "Outro" está selecionado.';
      isValid = false;
    }

    setValidation(newValidation);
    return isValid;
  };

  const nextSection = async () => {
    const currentAppId = new URLSearchParams(location.search).get('appId');
    if (!currentAppId || currentAppId === 'null' || currentAppId === 'undefined') {
      alert("Erro: ID da aplicação não encontrado. Não é possível continuar.");
      navigate(createPageUrl("Dashboard"));
      return;
    }

    if (validateSection()) {
      setIsSaving(true);
      try {
        const updatedApp = await saveSectionData(application, 'workEducation', formData);
        setApplication(updatedApp);
        navigate(createPageUrl(`Section11aAdditionalInfo?appId=${currentAppId}`));
      } catch (error) {
        console.error("Failed to save and navigate:", error);
      } finally {
        setIsSaving(false);
      }
    }
  };

  const prevSection = async () => {
    const currentAppId = new URLSearchParams(location.search).get('appId');
    if (!currentAppId || currentAppId === 'null' || currentAppId === 'undefined') {
      console.error("Invalid appId for previous section, redirecting to dashboard");
      navigate(createPageUrl("Dashboard"));
      return;
    }

    // The application object should be in state, no need to re-fetch unless necessary
    const maritalStatus = application?.data?.personal?.maritalStatus;

    if (maritalStatus === 'MARRIED' || maritalStatus === 'LEGALLY_SEPARATED') {
      navigate(createPageUrl(`Section9aSpouse?appId=${currentAppId}`));
    } else {
      navigate(createPageUrl(`Section9Family?appId=${currentAppId}`));
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const renderAddressFields = (basePath, currentAddress, showCountry = true) => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">CEP</label>
        <input
          type="text"
          value={currentAddress?.cep || ''}
          onChange={e => handleInputChange(`${basePath}.cep`, e.target.value)}
          onBlur={e => handleCepBlur(e.target.value, basePath)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
          placeholder="00000-000"
          maxLength={9}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-3">
          <label className="block text-sm font-medium text-gray-700 mb-2">Endereço (Rua/Avenida)</label>
          <input
            type="text"
            value={currentAddress?.street1 || ''}
            onChange={e => handleInputChange(`${basePath}.street1`, e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Número</label>
          <input
            type="text"
            value={currentAddress?.number || ''}
            onChange={e => handleInputChange(`${basePath}.number`, e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            placeholder="123"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Complemento (apto/casa/bloco...) (Opcional)</label>
        <input
          type="text"
          value={currentAddress?.street2 || ''}
          onChange={e => handleInputChange(`${basePath}.street2`, e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
          placeholder="Apartamento, casa, bloco, etc."
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Cidade</label>
          <input
            type="text"
            value={currentAddress?.city || ''}
            onChange={e => handleInputChange(`${basePath}.city`, e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Estado/Província/Região</label>
          <select
            value={currentAddress?.state || ''}
            onChange={e => handleInputChange(`${basePath}.state`, e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
          >
            <option value="">Selecione o estado...</option>
            {BRAZILIAN_STATES.map(state => (
              <option key={state.code} value={state.name}>{state.name}</option>
            ))}
          </select>
        </div>
      </div>

      {showCountry && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">País</label>
          <select
            value={currentAddress?.country || 'Brasil'}
            onChange={e => handleInputChange(`${basePath}.country`, e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
          >
            {COUNTRIES.map(country => (
              <option key={country.iso2} value={country.name}>{country.name}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  );

  const renderCurrentEmployerFields = () => (
    <div className="p-4 border rounded-lg bg-gray-50/50 space-y-4 mt-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Nome do Empregador ou Escola</label>
        <input
          type="text"
          value={formData.currentEmployer.name}
          onChange={e => handleInputChange('currentEmployer.name', e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
        />
      </div>

      <div>
        <h4 className="text-md font-semibold text-gray-700 mb-3">Endereço</h4>
        {renderAddressFields('currentEmployer.address', formData.currentEmployer.address)}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Telefone</label>
        <PhoneInput
          value={formData.currentEmployer.phone}
          onChange={val => handleInputChange('currentEmployer.phone', val)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <DateInput
            label="Data de Início"
            value={formData.currentEmployer.startDate}
            onChange={val => handleInputChange('currentEmployer.startDate', val)}
            maxDate={today}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Renda Mensal Bruta (Sem os descontos)</label>
          <CurrencyInput
            value={formData.currentEmployer.monthlySalary}
            onChange={val => handleInputChange('currentEmployer.monthlySalary', val)}
            placeholder="0,00"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Descreva suas atividades</label>
        <textarea
          value={formData.currentEmployer.duties}
          onChange={e => handleInputChange('currentEmployer.duties', e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors w-full h-32"
          rows="4"
          placeholder="Descreva brevemente suas funções e responsabilidades..."
        />
      </div>
    </div>
  );

  const renderPreviousEmployerFields = () => {
    if (!formData.wasPreviouslyEmployed) return null;

    return (
      <div className="space-y-4">
        {formData.previousEmployers.map((employer, index) => (
          <div key={index} className="p-4 border rounded-lg bg-white shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-semibold text-gray-800">Empregador Anterior {index + 1}</h4>
              <button
                type="button"
                onClick={() => removeFromList('previousEmployers', index)}
                className="text-red-600 hover:text-red-800 text-sm font-medium flex items-center gap-1"
              >
                <Trash2 className="w-4 h-4" /> Remover
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nome do Empregador</label>
                <input
                  type="text"
                  value={employer.name}
                  onChange={e => updateListItem('previousEmployers', index, 'name', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                />
              </div>

              <div>
                <h4 className="text-md font-semibold text-gray-700 mb-3">Endereço</h4>
                {renderAddressFields(`previousEmployers.${index}.address`, employer.address)}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Telefone</label>
                <PhoneInput
                  value={employer.phone}
                  onChange={val => updateListItem('previousEmployers', index, 'phone', val)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cargo</label>
                <input
                  type="text"
                  value={employer.jobTitle}
                  onChange={e => updateListItem('previousEmployers', index, 'jobTitle', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <DateInput
                  label="Data de Início"
                  value={employer.startDate}
                  onChange={val => updateListItem('previousEmployers', index, 'startDate', val)}
                  maxDate={employer.endDate ? new Date(employer.endDate) : today}
                />
                <DateInput
                  label="Data de Saída"
                  value={employer.endDate}
                  onChange={val => updateListItem('previousEmployers', index, 'endDate', val)}
                  minDate={employer.startDate ? new Date(employer.startDate) : null}
                  maxDate={today}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Descreva suas atividades</label>
                <textarea
                  value={employer.duties}
                  onChange={e => updateListItem('previousEmployers', index, 'duties', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors w-full h-32"
                  rows="4"
                  placeholder="Descreva brevemente suas funções e responsabilidades..."
                />
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Supervisor</label>
                <div className="space-y-4 p-3 border border-gray-200 rounded-md bg-gray-50">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={`knowsSupervisor-${index}`}
                      checked={employer.knowsSupervisor}
                      onChange={e => updateListItem('previousEmployers', index, 'knowsSupervisor', e.target.checked)}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor={`knowsSupervisor-${index}`} className="text-sm font-medium text-gray-700">Conhece o supervisor?</label>
                  </div>
                  {employer.knowsSupervisor && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Sobrenome do Supervisor</label>
                        <input
                          type="text"
                          value={employer.supervisorSurname}
                          onChange={e => updateListItem('previousEmployers', index, 'supervisorSurname', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Nome do Supervisor</label>
                        <input
                          type="text"
                          value={employer.supervisorGivenName}
                          onChange={e => updateListItem('previousEmployers', index, 'supervisorGivenName', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={() => addToList('previousEmployers')}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <Plus className="w-5 h-5" /> Adicionar Empregador Anterior
        </button>
      </div>
    );
  };

  const renderEducationFields = () => {
    if (!formData.attendedEducation) return null;

    return (
      <div className="space-y-4">
        {formData.educationInstitutions.map((education, index) => (
          <div key={index} className="p-4 border rounded-lg bg-white shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-semibold text-gray-800">Instituição Educacional {index + 1}</h4>
              <button
                type="button"
                onClick={() => removeFromList('educationInstitutions', index)}
                className="text-red-600 hover:text-red-800 text-sm font-medium flex items-center gap-1"
              >
                <Trash2 className="w-4 h-4" /> Remover
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nome da Instituição</label>
                <input
                  type="text"
                  value={education.name}
                  onChange={e => updateListItem('educationInstitutions', index, 'name', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                />
              </div>

              <div>
                <h4 className="text-md font-semibold text-gray-700 mb-3">Endereço</h4>
                {renderAddressFields(`educationInstitutions.${index}.address`, education.address)}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Curso/Programa/Área de Estudo</label>
                <input
                  type="text"
                  value={education.course}
                  onChange={e => updateListItem('educationInstitutions', index, 'course', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <DateInput
                  label="Data de Início"
                  value={education.startDate}
                  onChange={(value) => updateListItem('educationInstitutions', index, 'startDate', value)}
                  maxDate={education.endDate ? new Date(education.endDate) : today}
                />
                <DateInput
                  label="Data de Conclusão"
                  value={education.endDate}
                  onChange={(value) => updateListItem('educationInstitutions', index, 'endDate', value)}
                  minDate={education.startDate ? new Date(education.startDate) : null}
                  maxDate={today}
                />
              </div>
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={() => addToList('educationInstitutions')}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <Plus className="w-5 h-5" /> Adicionar Instituição Educacional
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <ProgressBar application={application} currentSectionId="workEducation" />

      <div className="max-w-3xl mx-auto p-4 pt-8">
        <SectionCard
          icon="💼"
          title="Trabalho, Educação e Treinamento"
          subtitle="Forneça informações sobre seu trabalho atual, empregos anteriores e educação."
        >
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Ocupação Principal</h3>
              <select
                value={formData.primaryOccupation}
                onChange={e => handleInputChange('primaryOccupation', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              >
                <option value="">Selecione...</option>
                {OCCUPATIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>

              {/* Conditional field for "OTHER" occupation */}
              {formData.primaryOccupation === 'OTHER' && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Por favor, especifique:</label>
                  <input
                    type="text"
                    value={formData.otherOccupationDetails}
                    onChange={e => handleInputChange('otherOccupationDetails', e.target.value)}
                    className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${validation.otherOccupationDetails ? 'border-red-500' : ''}`}
                    placeholder="Descreva sua ocupação..."
                  />
                  {validation.otherOccupationDetails && (
                    <p className="text-sm text-red-600 mt-1">{validation.otherOccupationDetails}</p>
                  )}
                </div>
              )}

              {formData.primaryOccupation && !['NOT_EMPLOYED', 'RETIRED', 'HOMEMAKER'].includes(formData.primaryOccupation) && renderCurrentEmployerFields()}
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">Emprego Anterior</h3>
              <ConditionalField
                question="Você já foi empregado(a) anteriormente?"
                value={formData.wasPreviouslyEmployed}
                onValueChange={val => handleInputChange('wasPreviouslyEmployed', val)}
              >
                {renderPreviousEmployerFields()}
              </ConditionalField>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">Educação</h3>
              <ConditionalField
                question="Você já frequentou alguma instituição educacional em nível secundário ou superior?"
                value={formData.attendedEducation}
                onValueChange={val => handleInputChange('attendedEducation', val)}
              >
                {renderEducationFields()}
              </ConditionalField>
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

export default Section10WorkEducation;
