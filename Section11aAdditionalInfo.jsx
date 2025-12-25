import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { loadApplication, saveSectionData } from '@/components/storage';
import ProgressBar from '../components/ProgressBar';
import SectionCard from '../components/SectionCard';
import ConditionalField from '../components/ConditionalField';
import AutoSave from '../components/AutoSave';
import { schemas } from '@/lib/sectionSchemas';
import { validateWithSchema, toValidationMap } from '@/lib/validation';
import { COUNTRIES } from '../components/utils/countries';

const Section11aAdditionalInfo = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const appId = new URLSearchParams(location.search).get('appId');

  const [application, setApplication] = useState(null);
  const [formData, setFormData] = useState({
    belongsToClan: false,
    clanName: '',
    languages: [{ language: 'Português' }],
    hasRecentTravel: false,
    countriesVisited: [{ country: '' }],
    belongsToOrganizations: false,
    organizations: [{ name: '' }],
    hasSpecialSkills: false,
    specialSkills: [{ skill: '' }],
    hasServedInMilitary: false,
    militaryService: [{ branch: '', rank: '', specialization: '', startDate: '', endDate: '' }],
  });

  const [validation, setValidation] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!appId || appId === 'null' || appId === 'undefined') {
      console.error("Section11a - Invalid appId detected, redirecting to dashboard");
      navigate(createPageUrl("Dashboard"));
      return;
    }

    const fetchApplication = async () => {
      try {
        const app = await loadApplication(appId);
        setApplication(app);
        if (app.data?.additionalInfo) {
          const loadedData = { ...app.data.additionalInfo };
          // Ensure languages array is not empty after loading
          if (!loadedData.languages || loadedData.languages.length === 0) {
            loadedData.languages = [{ language: 'Português' }];
          }
          // Ensure countriesVisited array has at least one item if it's empty
          if (loadedData.hasRecentTravel && (!loadedData.countriesVisited || loadedData.countriesVisited.length === 0)) {
            loadedData.countriesVisited = [{ country: '' }];
          }
          // Ensure organizations array has at least one item if it's empty
          if (loadedData.belongsToOrganizations && (!loadedData.organizations || loadedData.organizations.length === 0)) {
            loadedData.organizations = [{ name: '' }];
          }
          // Ensure specialSkills array has at least one item if it's empty
          if (loadedData.hasSpecialSkills && (!loadedData.specialSkills || loadedData.specialSkills.length === 0)) {
            loadedData.specialSkills = [{ skill: '' }];
          }
          // Ensure militaryService array has at least one item if it's empty
          if (loadedData.hasServedInMilitary && (!loadedData.militaryService || loadedData.militaryService.length === 0)) {
            loadedData.militaryService = [{ branch: '', rank: '', specialization: '', startDate: '', endDate: '' }];
          }

          setFormData((prev) => ({ ...prev, ...loadedData }));
        }
      } catch (error) {
        console.error("Failed to load application in Section11a:", error);
        navigate(createPageUrl("Dashboard"));
      }
      setIsLoading(false);
    };

    fetchApplication();
  }, [appId, navigate]);

  const handleInputChange = (field, value) => {
    setFormData(prev => {
      const newState = { ...prev, [field]: value };
      
      // Clear conditional fields when main question is set to false
      if (field === 'belongsToClan' && !value) newState.clanName = '';
      if (field === 'hasRecentTravel' && !value) newState.countriesVisited = [];
      if (field === 'belongsToOrganizations' && !value) newState.organizations = [];
      if (field === 'hasSpecialSkills' && !value) newState.specialSkills = [{ skill: '' }];
      if (field === 'hasServedInMilitary' && !value) newState.militaryService = [];
      
      return newState;
    });

    if (validation[field]) {
      setValidation(prev => ({ ...prev, [field]: null }));
    }
  };

  // Generic handlers for dynamic lists
  const addDynamicItem = (listName, itemStructure) => {
    setFormData(prev => ({
      ...prev,
      [listName]: [...prev[listName], itemStructure]
    }));
  };

  const removeDynamicItem = (listName, index) => {
    setFormData(prev => ({
      ...prev,
      [listName]: prev[listName].filter((_, i) => i !== index)
    }));
  };

  const handleDynamicListChange = (listName, index, field, value) => {
    setFormData(prev => ({
      ...prev,
      [listName]: prev[listName].map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const validateSection = () => {
    const schema = schemas.additionalInfo;
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
        const updatedApp = await saveSectionData(application, 'additionalInfo', formData);
        setApplication(updatedApp);
        navigate(createPageUrl(`Section11Security?appId=${appId}`));
      } catch (error) {
        console.error("Failed to save and navigate from Section11a:", error);
        alert("Ocorreu um erro ao salvar. Tente novamente.");
      } finally {
        setIsSaving(false);
      }
    }
  };
  
  const prevSection = async () => {
    // Save data before navigating back
    setIsSaving(true);
    try {
      const updatedApp = await saveSectionData(application, 'additionalInfo', formData);
      setApplication(updatedApp);
      navigate(createPageUrl(`Section10WorkEducation?appId=${appId}`));
    } catch (error) {
      console.error("Failed to save before navigating back:", error);
      // Navigate anyway to prevent user from being stuck
      navigate(createPageUrl(`Section10WorkEducation?appId=${appId}`));
    } finally {
      setIsSaving(false);
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
      <ProgressBar application={application} currentSectionId="additionalInfo" />
      
      <AutoSave
        application={application}
        sectionId="additionalInfo"
        formData={formData}
        onApplicationUpdate={setApplication}
      />

      <div className="max-w-3xl mx-auto p-4 pt-8">
        <SectionCard
          icon="ℹ️"
          title="Informações Adicionais"
          subtitle="Forneça detalhes sobre idiomas, viagens e afiliações."
        >
          <div className="space-y-8">
            {/* 1. Clan or Tribe */}
            <ConditionalField
              question="Você pertence a um clã ou tribo?"
              value={formData.belongsToClan}
              onValueChange={(value) => handleInputChange('belongsToClan', value)}
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nome do Clã ou Tribo:</label>
                <input 
                  type="text" 
                  value={formData.clanName} 
                  onChange={(e) => handleInputChange('clanName', e.target.value)} 
                  className="w-full form-input"
                />
              </div>
            </ConditionalField>

            {/* 2. Languages */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Idiomas</h3>
              <p className="text-sm text-gray-600 mb-4">Forneça uma lista de idiomas que você fala.</p>
              <div className="space-y-4">
                {formData.languages.map((item, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <input 
                      type="text" 
                      value={item.language} 
                      onChange={(e) => handleDynamicListChange('languages', index, 'language', e.target.value)} 
                      className="flex-1 form-input"
                      placeholder="Idioma"
                    />
                    {formData.languages.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeDynamicItem('languages', index)}
                        className="text-red-500 hover:text-red-700 p-2 text-sm"
                      >
                        Remover
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addDynamicItem('languages', { language: '' })}
                  className="text-blue-600 hover:underline flex items-center gap-2"
                >
                  + Adicionar Outro Idioma
                </button>
              </div>
            </div>

            {/* 3. Recent Travel */}
            <ConditionalField
              question="Você viajou para algum país/região nos últimos cinco anos?"
              value={formData.hasRecentTravel}
              onValueChange={(value) => handleInputChange('hasRecentTravel', value)}
            >
              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Lista de Países/Regiões Visitados:</label>
                {formData.countriesVisited.map((item, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <select 
                      value={item.country || ''} 
                      onChange={(e) => handleDynamicListChange('countriesVisited', index, 'country', e.target.value)} 
                      className="flex-1 form-input"
                    >
                      <option value="">SELECIONE UM PAÍS</option>
                      {COUNTRIES.map(c => (
                        <option key={c.iso2} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                    {formData.countriesVisited.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeDynamicItem('countriesVisited', index)}
                        className="text-red-500 hover:text-red-700 p-2 text-sm"
                      >
                        Remover
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addDynamicItem('countriesVisited', { country: '' })}
                  className="text-blue-600 hover:underline flex items-center gap-2"
                >
                  + Adicionar Outro País
                </button>
              </div>
            </ConditionalField>

            {/* 4. Organizations */}
            <ConditionalField
              question="Você pertenceu, contribuiu ou trabalhou para alguma organização profissional, social ou de caridade?"
              value={formData.belongsToOrganizations}
              onValueChange={(value) => handleInputChange('belongsToOrganizations', value)}
            >
              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Nome da Organização:</label>
                {formData.organizations.map((item, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <input 
                      type="text" 
                      value={item.name || ''} 
                      onChange={(e) => handleDynamicListChange('organizations', index, 'name', e.target.value)} 
                      className="flex-1 form-input"
                      placeholder="Nome da Organização"
                    />
                    {formData.organizations.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeDynamicItem('organizations', index)}
                        className="text-red-500 hover:text-red-700 p-2 text-sm"
                      >
                        Remover
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addDynamicItem('organizations', { name: '' })}
                  className="text-blue-600 hover:underline flex items-center gap-2"
                >
                  + Adicionar Outra Organização
                </button>
              </div>
            </ConditionalField>

            {/* 5. Specialized Skills - FIXED LOGIC */}
            <ConditionalField
              question="Você possui alguma habilidade ou treinamento especializado, como em armas de fogo, explosivos, nuclear, biológico ou químico?"
              value={formData.hasSpecialSkills}
              onValueChange={(value) => handleInputChange('hasSpecialSkills', value)}
            >
              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Especifique suas habilidades especializadas:</label>
                {formData.specialSkills.map((item, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <input 
                      type="text" 
                      value={item.skill || ''}
                      onChange={(e) => handleDynamicListChange('specialSkills', index, 'skill', e.target.value)} 
                      className="flex-1 form-input"
                      placeholder="Ex: Treinamento em armamento pesado, Experiência química"
                    />
                    {formData.specialSkills.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeDynamicItem('specialSkills', index)}
                        className="text-red-500 hover:text-red-700 p-2 text-sm"
                      >
                        Remover
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addDynamicItem('specialSkills', { skill: '' })}
                  className="text-blue-600 hover:underline flex items-center gap-2"
                >
                  + Adicionar Outra Habilidade
                </button>
              </div>
            </ConditionalField>

            {/* 6. Military Service */}
            <ConditionalField
              question="Você já serviu nas forças armadas?"
              value={formData.hasServedInMilitary}
              onValueChange={(value) => handleInputChange('hasServedInMilitary', value)}
            >
              <div className="space-y-6">
                <h4 className="font-semibold text-gray-700">Forneça as seguintes informações:</h4>
                {formData.militaryService.map((item, index) => (
                  <div key={index} className="p-4 border rounded-lg bg-gray-50/50 space-y-4">
                    <div className="flex justify-between items-center">
                      <h5 className="font-medium text-gray-800">Serviço Militar {index + 1}</h5>
                      {formData.militaryService.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeDynamicItem('militaryService', index)}
                          className="text-red-500 hover:text-red-700 p-2 text-sm"
                        >
                          Remover Serviço
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Nome do País/Região</label>
                        <input 
                          type="text" 
                          value={item.country || ''} 
                          onChange={(e) => handleDynamicListChange('militaryService', index, 'country', e.target.value)} 
                          className="w-full form-input"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Ramo do Serviço</label>
                        <input 
                          type="text" 
                          value={item.branch || ''}
                          onChange={(e) => handleDynamicListChange('militaryService', index, 'branch', e.target.value)} 
                          className="w-full form-input"
                          placeholder="Ex: Exército, Marinha"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Posto/Posição</label>
                        <input 
                          type="text" 
                          value={item.rank || ''}
                          onChange={(e) => handleDynamicListChange('militaryService', index, 'rank', e.target.value)} 
                          className="w-full form-input"
                          placeholder="Ex: Soldado, Sargento"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Especialidade Militar</label>
                        <input 
                          type="text" 
                          value={item.specialization || ''}
                          onChange={(e) => handleDynamicListChange('militaryService', index, 'specialization', e.target.value)}
                          className="w-full form-input"
                          placeholder="Ex: Infantaria, Médico"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Data de Início do Serviço</label>
                        <input 
                          type="date"
                          value={item.startDate || ''} 
                          onChange={(e) => handleDynamicListChange('militaryService', index, 'startDate', e.target.value)} 
                          className="w-full form-input"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Data de Término do Serviço</label>
                        <input 
                          type="date"
                          value={item.endDate || ''} 
                          onChange={(e) => handleDynamicListChange('militaryService', index, 'endDate', e.target.value)} 
                          className="w-full form-input"
                        />
                      </div>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addDynamicItem('militaryService', { 
                    country: '', branch: '', rank: '', specialization: '', startDate: '', endDate: '' 
                  })}
                  className="text-blue-600 hover:underline flex items-center gap-2"
                >
                  + Adicionar Outro Serviço Militar
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

export default Section11aAdditionalInfo;