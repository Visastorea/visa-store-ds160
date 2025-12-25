
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

const formatNames = (name) => {
  const prepositions = ['da', 'de', 'do', 'das', 'dos', 'e'];
  return name
    .split(' ')
    .map((word) => 
      prepositions.includes(word.toLowerCase()) 
        ? word.toLowerCase() 
        : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    )
    .join(' ');
};

const Section4TravelCompanions = () => {
  const navigate = useNavigate();
  const location = useLocation();
  // Keep this appId declaration for initial useEffect and general component state management
  const appId = new URLSearchParams(location.search).get('appId'); 

  const [application, setApplication] = useState(null);
  const [formData, setFormData] = useState({
    hasCompanions: false,
    companions: []
  });

  const [validation, setValidation] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

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
        if (app.data?.travelCompanions) {
          setFormData((prev) => ({ ...prev, ...app.data.travelCompanions }));
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
      if (field === 'hasCompanions' && !value) {
        newState.companions = [];
      }
      return newState;
    });

    if (validation[field]) {
      setValidation((prev) => ({ ...prev, [field]: null }));
    }
  };

  const addCompanion = () => {
    setFormData(prev => ({
      ...prev,
      companions: [...prev.companions, {
        surnames: '',
        givenNames: '',
        relationship: ''
      }]
    }));
  };

  const updateCompanion = (index, field, value) => {
    let processedValue = value;
    if (field === 'surnames' || field === 'givenNames') {
      processedValue = formatNames(value);
    }

    setFormData(prev => ({
      ...prev,
      companions: prev.companions.map((companion, i) =>
        i === index ? { ...companion, [field]: processedValue } : companion
      )
    }));
  };

  const removeCompanion = (index) => {
    setFormData(prev => ({
      ...prev,
      companions: prev.companions.filter((_, i) => i !== index)
    }));
  };

  const validateSection = () => {
    const schema = schemas.travelCompanions;
    if (!schema) {
      setValidation({});
      return true;
    }
    const { ok, errors } = validateWithSchema(schema, formData);
    setValidation(toValidationMap(errors));
    return ok;
  };

  const nextSection = async () => {
    // Re-extract appId to ensure it's available for navigation, as per instructions
    const appId = new URLSearchParams(location.search).get('appId'); 
    if (!appId || appId === 'null' || appId === 'undefined') {
        alert("Erro: ID da aplicação não encontrado. Não é possível continuar.");
        navigate(createPageUrl("Dashboard"));
        return;
    }

    if (validateSection()) {
      setIsSaving(true);
      try {
        const updatedApp = await saveSectionData(application, 'travelCompanions', formData);
        setApplication(updatedApp);
        navigate(createPageUrl(`Section5USHistory?appId=${appId}`));
      } catch (error) {
        console.error("Failed to save and navigate:", error);
      } finally {
        setIsSaving(false);
      }
    }
  };

  const prevSection = () => {
    // Re-extract appId for navigation, as per instructions
    const appId = new URLSearchParams(location.search).get('appId');
    if (appId && appId !== 'null' && appId !== 'undefined') { // Added null/undefined check for consistency
      navigate(createPageUrl(`Section3Travel?appId=${appId}`));
    } else {
      console.error("Invalid appId for previous section, redirecting to dashboard");
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
      <ProgressBar application={application} currentSectionId="travelCompanions" />
      
      {/* AutoSave Component */}
      <AutoSave 
        application={application}
        sectionId="travelCompanions"
        formData={formData}
        onApplicationUpdate={setApplication}
      />
      
      <div className="max-w-3xl mx-auto p-4 pt-8">
        <SectionCard
          icon="👥"
          title="Acompanhantes de Viagem"
          subtitle="Informações sobre pessoas que viajarão com você."
        >
          <div className="space-y-6">
            <ConditionalField
              question="Existem outras pessoas viajando com você?"
              value={formData.hasCompanions}
              onValueChange={(value) => handleInputChange('hasCompanions', value)}
            >
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    Pessoas Viajando Com Você
                  </h3>
                  
                  {formData.companions.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg">
                      <p className="text-gray-500 mb-4">Nenhum acompanhante adicionado</p>
                      <button
                        type="button"
                        onClick={addCompanion}
                        className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
                      >
                        + Adicionar Acompanhante
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {formData.companions.map((companion, index) => (
                        <div key={index} className="p-4 border border-gray-200 rounded-lg bg-white">
                          <div className="flex justify-between items-center mb-4">
                            <h4 className="font-semibold text-gray-800">
                              Acompanhante {index + 1}
                            </h4>
                            <button
                              type="button"
                              onClick={() => removeCompanion(index)}
                              className="text-red-600 hover:text-red-800 text-sm font-medium"
                            >
                              Remover
                            </button>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Sobrenomes do Acompanhante
                              </label>
                              <input
                                type="text"
                                value={companion.surnames}
                                onChange={(e) => updateCompanion(index, 'surnames', e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                placeholder="Ex: Silva Santos"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Nomes do Acompanhante
                              </label>
                              <input
                                type="text"
                                value={companion.givenNames}
                                onChange={(e) => updateCompanion(index, 'givenNames', e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                placeholder="Ex: Maria José"
                              />
                            </div>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Relacionamento com Você
                            </label>
                            <select
                              value={companion.relationship}
                              onChange={(e) => updateCompanion(index, 'relationship', e.target.value)}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                            >
                              <option value="">Selecione o relacionamento...</option>
                              <option value="SPOUSE">Cônjuge</option>
                              <option value="CHILD">Filho(a)</option>
                              <option value="PARENT">Pai/Mãe</option>
                              <option value="SIBLING">Irmão/Irmã</option>
                              <option value="OTHER RELATIVE">Outro Parente</option>
                              <option value="FRIEND">Amigo(a)</option>
                              <option value="COLLEAGUE">Colega</option>
                              <option value="OTHER">Outro</option>
                            </select>
                          </div>
                        </div>
                      ))}
                      
                      <button
                        type="button"
                        onClick={addCompanion}
                        className="w-full py-3 border-2 border-dashed border-blue-300 text-blue-600 rounded-lg hover:border-blue-400 hover:text-blue-700 font-medium transition-colors"
                      >
                        + Adicionar Outro Acompanhante
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </ConditionalField>
            
            {!formData.hasCompanions && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  <strong>✓ Viagem Individual:</strong> Você indicou que estará viajando sozinho(a). 
                  Isso é perfeitamente normal e não afetará sua aplicação de visto.
                </p>
              </div>
            )}
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

export default Section4TravelCompanions;
