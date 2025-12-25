
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { loadApplication, saveSectionData } from '@/components/storage';
import ProgressBar from '../components/ProgressBar';
import SectionCard from '../components/SectionCard';
import ConditionalField from '../components/ConditionalField';
import { formatNames } from '../components/utils/formatters';
import { Plus, Trash2 } from 'lucide-react';
import DateInput from '../components/DateInput';

const Section9Family = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const appId = new URLSearchParams(location.search).get('appId');

  const [application, setApplication] = useState(null);
  const [formData, setFormData] = useState({
    father: { surname: '', givenName: '', birthDate: '', knowsBirthDate: true, isInUS: false, usStatus: '' },
    mother: { surname: '', givenName: '', birthDate: '', knowsBirthDate: true, isInUS: false, usStatus: '' },
    hasRelativesInUS: false,
    relatives: [],
  });

  const [validation, setValidation] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Define today for maxDate prop
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
        if (app.data?.family) {
          // Merge existing data with default structure to ensure new fields are present if not in saved data
          setFormData((prev) => ({ 
            ...prev, 
            ...app.data.family,
            father: { ...prev.father, ...app.data.family.father },
            mother: { ...prev.mother, ...app.data.family.mother },
            relatives: app.data.family.relatives || [] // Ensure relatives is an array
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
      
      let processedValue = value;
      // Only format name fields that are surname or givenName
      if (['surname', 'givenName'].includes(keys.at(-1))) {
        processedValue = formatNames(value);
      }
      
      current[keys.at(-1)] = processedValue;
      return newState;
    });

    if (validation[path]) {
      setValidation(prev => ({ ...prev, [path]: null }));
    }
  };

  const addRelative = () => {
    setFormData(prev => ({
      ...prev,
      relatives: [...prev.relatives, { surname: '', givenName: '', relationship: '', usStatus: '' }]
    }));
  };

  const removeRelative = (index) => {
    setFormData(prev => ({
      ...prev,
      relatives: prev.relatives.filter((_, i) => i !== index)
    }));
  };

  const updateRelative = (index, field, value) => {
    setFormData(prev => {
      const newRelatives = [...prev.relatives];
      // Format names for relatives as well
      const processedValue = (field === 'surname' || field === 'givenName') ? formatNames(value) : value;
      newRelatives[index][field] = processedValue;
      return { ...prev, relatives: newRelatives };
    });
  };

  const validateSection = () => {
    const schema = schemas.family;
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
        const updatedApp = await saveSectionData(application, 'family', formData);
        setApplication(updatedApp);

        // Conditional navigation logic
        const maritalStatus = updatedApp.data?.personal?.maritalStatus;
        if (maritalStatus === 'MARRIED' || maritalStatus === 'LEGALLY_SEPARATED') {
            navigate(createPageUrl(`Section9aSpouse?appId=${appId}`));
        } else {
            navigate(createPageUrl(`Section10WorkEducation?appId=${appId}`));
        }

      } catch (error) {
        console.error("Failed to save and navigate:", error);
      } finally {
        setIsSaving(false);
      }
    } else {
      const firstErrorField = document.querySelector('.border-red-500');
      if (firstErrorField) {
        firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };
  
  const prevSection = () => {
    const appId = new URLSearchParams(location.search).get('appId');
    if (appId) {
      navigate(createPageUrl(`Section7Passport?appId=${appId}`));
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
  
  const renderParentFields = (parentType) => {
    const parentData = formData[parentType];
    const parentLabel = parentType === 'father' ? 'Pai' : 'Mãe';
    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Sobrenome do {parentLabel}</label>
                    <input 
                      type="text" 
                      value={parentData.surname} 
                      onChange={(e) => handleInputChange(`${parentType}.surname`, e.target.value)} 
                      className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${validation[`${parentType}.surname`] ? 'border-red-500' : ''}`} 
                    />
                    {validation[`${parentType}.surname`] && <p className="text-sm text-red-600 mt-1">{validation[`${parentType}.surname`]}</p>}
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nome do {parentLabel}</label>
                    <input 
                      type="text" 
                      value={parentData.givenName} 
                      onChange={(e) => handleInputChange(`${parentType}.givenName`, e.target.value)} 
                      className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${validation[`${parentType}.givenName`] ? 'border-red-500' : ''}`} 
                    />
                    {validation[`${parentType}.givenName`] && <p className="text-sm text-red-600 mt-1">{validation[`${parentType}.givenName`]}</p>}
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Data de Nascimento</label>
                 <DateInput 
                   value={parentData.birthDate} 
                   onChange={(val) => handleInputChange(`${parentType}.birthDate`, val)} 
                   error={validation[`${parentType}.birthDate`]} 
                   disabled={!parentData.knowsBirthDate}
                   maxDate={today}
                 />
                <div className="flex items-center mt-2">
                    <input 
                      type="checkbox" 
                      checked={!parentData.knowsBirthDate} 
                      onChange={(e) => handleInputChange(`${parentType}.knowsBirthDate`, !e.target.checked)} 
                      id={`${parentType}KnowsDob`} 
                    />
                    <label htmlFor={`${parentType}KnowsDob`} className="ml-2 text-sm text-gray-600">Não sei a data de nascimento</label>
                </div>
            </div>
             <ConditionalField 
               question={`Seu ${parentLabel} está nos EUA?`} 
               value={parentData.isInUS} 
               onValueChange={(val) => handleInputChange(`${parentType}.isInUS`, val)}
             >
                <div className="mt-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status nos EUA</label>
                    <select 
                      value={parentData.usStatus} 
                      onChange={(e) => handleInputChange(`${parentType}.usStatus`, e.target.value)} 
                      className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${validation[`${parentType}.usStatus`] ? 'border-red-500' : ''}`}
                    >
                        <option value="">Selecione...</option>
                        <option value="US_CITIZEN">Cidadão Americano</option>
                        <option value="LEGAL_PERMANENT_RESIDENT">Residente Permanente Legal (Green Card)</option>
                        <option value="NONIMMIGRANT">Não-imigrante (ex: visto de trabalho, estudante)</option>
                        <option value="OTHER">Outro</option>
                    </select>
                    {validation[`${parentType}.usStatus`] && <p className="text-sm text-red-600 mt-1">{validation[`${parentType}.usStatus`]}</p>}
                </div>
            </ConditionalField>
        </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <ProgressBar application={application} currentSectionId="family" />
      
      <div className="max-w-3xl mx-auto p-4 pt-8">
        <SectionCard
          icon="👨‍👩‍👧‍👦"
          title="Informações da Família"
          subtitle="Forneça informações sobre seus familiares."
        >
          <div className="space-y-8">
            <div>
                <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">Informações do Pai</h3>
                {renderParentFields('father')}
            </div>
            <div>
                <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">Informações da Mãe</h3>
                {renderParentFields('mother')}
            </div>
            
            <div>
                <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">Outros Parentes</h3>
                 <ConditionalField 
                   question="Você tem outros parentes imediatos (que não sejam seus pais) nos Estados Unidos?" 
                   value={formData.hasRelativesInUS} 
                   onValueChange={(val) => handleInputChange('hasRelativesInUS', val)}
                 >
                    <div className="space-y-4 mt-4">
                        {formData.relatives.map((relative, index) => (
                            <div key={index} className="p-4 border rounded-lg bg-gray-50 relative">
                                <button type="button" onClick={() => removeRelative(index)} className="absolute top-2 right-2 text-red-500 hover:text-red-700 p-1"><Trash2 size={16} /></button>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                     <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Sobrenome do Parente</label>
                                        <input 
                                          type="text" 
                                          value={relative.surname} 
                                          onChange={e => updateRelative(index, 'surname', e.target.value)} 
                                          className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${validation[`relatives.${index}.surname`] ? 'border-red-500' : ''}`}
                                        />
                                        {validation[`relatives.${index}.surname`] && <p className="text-sm text-red-600 mt-1">{validation[`relatives.${index}.surname`]}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Parente</label>
                                        <input 
                                          type="text" 
                                          value={relative.givenName} 
                                          onChange={e => updateRelative(index, 'givenName', e.target.value)} 
                                          className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${validation[`relatives.${index}.givenName`] ? 'border-red-500' : ''}`}
                                        />
                                        {validation[`relatives.${index}.givenName`] && <p className="text-sm text-red-600 mt-1">{validation[`relatives.${index}.givenName`]}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Relacionamento</label>
                                        <select 
                                          value={relative.relationship} 
                                          onChange={e => updateRelative(index, 'relationship', e.target.value)} 
                                          className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${validation[`relatives.${index}.relationship`] ? 'border-red-500' : ''}`}
                                        >
                                            <option value="">Selecione...</option>
                                            <option value="SPOUSE">Cônjuge</option>
                                            <option value="FIANCE_FIANCEE">Noivo(a)</option>
                                            <option value="CHILD">Filho(a)</option>
                                            <option value="SIBLING">Irmão/Irmã</option>
                                            <option value="GRANDPARENT">Avô/Avó</option>
                                            <option value="GRANDCHILD">Neto/Neta</option>
                                            <option value="UNCLE_AUNT">Tio/Tia</option>
                                            <option value="NEPHEW_NIECE">Sobrinho/Sobrinha</option>
                                            <option value="COUSIN">Primo/Prima</option>
                                            <option value="FATHER_IN_LAW_MOTHER_IN_LAW">Sogro/Sogra</option>
                                            <option value="SON_IN_LAW_DAUGHTER_IN_LAW">Genro/Nora</option>
                                            <option value="BROTHER_IN_LAW_SISTER_IN_LAW">Cunhado/Cunhada</option>
                                            <option value="LEGAL_GUARDIAN">Tutor Legal</option>
                                        </select>
                                        {validation[`relatives.${index}.relationship`] && <p className="text-sm text-red-600 mt-1">{validation[`relatives.${index}.relationship`]}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Status nos EUA</label>
                                         <select 
                                           value={relative.usStatus} 
                                           onChange={e => updateRelative(index, 'usStatus', e.target.value)} 
                                           className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${validation[`relatives.${index}.usStatus`] ? 'border-red-500' : ''}`}
                                         >
                                            <option value="">Selecione...</option>
                                            <option value="US_CITIZEN">Cidadão Americano</option>
                                            <option value="LEGAL_PERMANENT_RESIDENT">Residente Permanente Legal</option>
                                            <option value="NONIMMIGRANT">Não-imigrante</option>
                                            <option value="OTHER">Outro</option>
                                        </select>
                                        {validation[`relatives.${index}.usStatus`] && <p className="text-sm text-red-600 mt-1">{validation[`relatives.${index}.usStatus`]}</p>}
                                    </div>
                                </div>
                            </div>
                        ))}
                        <button type="button" onClick={addRelative} className="text-blue-600 hover:underline flex items-center gap-1"><Plus size={16}/> Adicionar Parente</button>
                    </div>
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

export default Section9Family;
