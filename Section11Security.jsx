
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { loadApplication, saveSectionData } from '@/components/storage';
import ProgressBar from '../components/ProgressBar';
import SectionCard from '../components/SectionCard';
import ConditionalField from '../components/ConditionalField';

const Section11Security = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const appId = new URLSearchParams(location.search).get('appId');

  const [application, setApplication] = useState(null);
  const [formData, setFormData] = useState({
    // Part 1
    q1_communicableDisease: false,
    q1_communicableDisease_exp: '',
    q2_mentalDisorder: false,
    q2_mentalDisorder_exp: '',
    q3_drugAbuser: false,
    q3_drugAbuser_exp: '',
    // Part 2
    q4_arrested: false,
    q4_arrested_exp: '',
    q5_controlledSubstances: false,
    q5_controlledSubstances_exp: '',
    q6_prostitution: false,
    q6_prostitution_exp: '',
    q7_moneyLaundering: false,
    q7_moneyLaundering_exp: '',
    q8_humanTrafficking: false,
    q8_humanTrafficking_exp: '',
    q9_aidedHumanTrafficking: false,
    q9_aidedHumanTrafficking_exp: '',
    q10_benefitedHumanTrafficking: false,
    q10_benefitedHumanTrafficking_exp: '',
    // Part 3
    q11_espionage: false,
    q11_espionage_exp: '',
    q12_terroristActivities: false,
    q12_terroristActivities_exp: '',
    q13_terroristSupport: false,
    q13_terroristSupport_exp: '',
    q14_terroristMember: false,
    q14_terroristMember_exp: '',
    q15_terroristFamily: false,
    q15_terroristFamily_exp: '',
    q16_genocide: false,
    q16_genocide_exp: '',
    q17_torture: false,
    q17_torture_exp: '',
    q18_extrajudicialKilling: false,
    q18_extrajudicialKilling_exp: '',
    q19_childSoldiers: false,
    q19_childSoldiers_exp: '',
    q20_religiousFreedomViolation: false,
    q20_religiousFreedomViolation_exp: '',
    q21_populationControls: false,
    q21_populationControls_exp: '',
    q22_organTransplantation: false,
    q22_organTransplantation_exp: '',
    // Part 4
    q23_visaFraud: false,
    q23_visaFraud_exp: '',
    q24_deported: false,
    q24_deported_exp: '',
    // Part 5
    q25_childCustody: false,
    q25_childCustody_exp: '',
    q26_voted: false,
    q26_voted_exp: '',
    q27_renouncedCitizenship: false,
    q27_renouncedCitizenship_exp: '',
  });

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
        if (app.data?.security) {
          setFormData((prev) => ({ ...prev, ...app.data.security }));
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
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  
  const handleConditionalChange = (questionField, explanationField, value) => {
      setFormData(prev => ({
          ...prev,
          [questionField]: value,
          [explanationField]: value ? prev[explanationField] : ''
      }));
  };

  const validateSection = () => {
    const schema = schemas.security;
    if (!schema) {
      setValidation({});
      return true;
    }
    const { ok, errors } = validateWithSchema(schema, formData);
    setValidation(toValidationMap(errors));
    return ok;
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
        const updatedApp = await saveSectionData(application, 'security', formData);
        setApplication(updatedApp);
        navigate(createPageUrl(`Review?appId=${currentAppId}`));
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
      navigate(createPageUrl(`Section11aAdditionalInfo?appId=${currentAppId}`));
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

  const renderQuestion = (qId, qText) => (
    <ConditionalField
        question={qText}
        value={formData[qId]}
        onValueChange={(value) => handleConditionalChange(qId, `${qId}_exp`, value)}
    >
        <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Explique (Opcional):</label>
            <textarea
                value={formData[`${qId}_exp`]}
                onChange={(e) => handleInputChange(`${qId}_exp`, e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors h-24"
                placeholder="Forneça detalhes..."
            />
        </div>
    </ConditionalField>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <ProgressBar application={application} currentSectionId="security" />
      
      <div className="max-w-3xl mx-auto p-4 pt-8">
        <SectionCard
          icon="🛡️"
          title="Questões de Segurança e Antecedentes"
          subtitle="Responda honestamente às seguintes perguntas. Nenhum campo é obrigatório."
        >
          <div className="space-y-8">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Importante:</strong> Responder "Sim" a uma pergunta não significa automaticamente que você não é elegível para um visto.
              </p>
            </div>

            {/* Part 1 */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">Parte 1 - Saúde</h3>
              <div className="space-y-6">
                {renderQuestion('q1_communicableDisease', 'Você tem alguma doença transmissível de importância para a saúde pública (exemplos incluem cancroide, gonorreia, sífilis infecciosa, tuberculose ativa, etc.)?')}
                {renderQuestion('q2_mentalDisorder', 'Você tem algum transtorno mental ou físico que represente ou possa representar uma ameaça à segurança ou bem-estar de si mesmo ou de outros?')}
                {renderQuestion('q3_drugAbuser', 'Você é ou já foi um usuário de drogas ou dependente químico?')}
              </div>
            </div>

            {/* Part 2 */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">Parte 2 - Criminal</h3>
              <div className="space-y-6">
                {renderQuestion('q4_arrested', 'Você já foi preso ou condenado por qualquer ofensa ou crime, mesmo que tenha sido objeto de perdão, anistia ou outra ação similar?')}
                {renderQuestion('q5_controlledSubstances', 'Você já violou, ou se envolveu em uma conspiração para violar, qualquer lei relacionada a substâncias controladas?')}
                {renderQuestion('q6_prostitution', 'Você está vindo para os Estados Unidos para se envolver em prostituição ou vício comercializado, ou esteve envolvido em prostituição ou prospecção de prostitutas nos últimos 10 anos?')}
                {renderQuestion('q7_moneyLaundering', 'Você já esteve envolvido, ou procura se envolver, em lavagem de dinheiro?')}
                {renderQuestion('q8_humanTrafficking', 'Você já cometeu ou conspirou para cometer um crime de tráfico de pessoas nos Estados Unidos ou fora dos Estados Unidos?')}
                {renderQuestion('q9_aidedHumanTrafficking', 'Você já ajudou, instigou, auxiliou ou conspirou com um indivíduo que cometeu ou conspirou para cometer um crime grave de tráfico de pessoas nos Estados Unidos ou fora dos Estados Unidos?')}
                {renderQuestion('q10_benefitedHumanTrafficking', 'Você é cônjuge, filho ou filha de um indivíduo que cometeu ou conspirou para cometer um crime de tráfico de pessoas nos Estados Unidos ou fora dos Estados Unidos e, nos últimos cinco anos, beneficiou-se conscientemente das atividades de tráfico?')}
              </div>
            </div>

            {/* Part 3 */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">Parte 3 - Segurança</h3>
              <div className="space-y-6">
                {renderQuestion('q11_espionage', 'Você pretende se envolver em espionagem, sabotagem, violações de controle de exportação ou qualquer outra atividade ilegal enquanto estiver nos Estados Unidos?')}
                {renderQuestion('q12_terroristActivities', 'Você pretende se envolver em atividades terroristas enquanto estiver nos Estados Unidos ou já se envolveu em atividades terroristas?')}
                {renderQuestion('q13_terroristSupport', 'Você já forneceu ou pretende fornecer assistência financeira ou outro tipo de apoio a terroristas ou organizações terroristas?')}
                {renderQuestion('q14_terroristMember', 'Você é membro ou representante de uma organização terrorista?')}
                {renderQuestion('q15_terroristFamily', 'Você é cônjuge, filho ou filha de um indivíduo que se envolveu em atividade terrorista, incluindo o fornecimento de assistência financeira ou outro apoio a terroristas ou organizações terroristas nos últimos cinco anos?')}
                {renderQuestion('q16_genocide', 'Você já ordenou, incitou, cometeu, auxiliou ou participou de genocídio?')}
                {renderQuestion('q17_torture', 'Você já cometeu, ordenou, incitou, auxiliou ou participou de tortura?')}
                {renderQuestion('q18_extrajudicialKilling', 'Você já cometeu, ordenou, incitou, auxiliou ou participou de assassinatos extrajudiciais, assassinatos políticos ou outros atos de violência?')}
                {renderQuestion('q19_childSoldiers', 'Você já se envolveu no recrutamento ou uso de crianças-soldado?')}
                {renderQuestion('q20_religiousFreedomViolation', 'Você, enquanto servia como funcionário do governo, foi responsável ou realizou diretamente, a qualquer momento, violações particularmente graves da liberdade religiosa?')}
                {renderQuestion('q21_populationControls', 'Você já esteve diretamente envolvido no estabelecimento ou aplicação de controles populacionais que forçaram uma mulher a se submeter a um aborto contra sua livre escolha ou um homem ou mulher a se submeter à esterilização contra sua livre vontade?')}
                {renderQuestion('q22_organTransplantation', 'Você já esteve diretamente envolvido no transplante coercitivo de órgãos ou tecidos corporais humanos?')}
              </div>
            </div>

            {/* Part 4 */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">Parte 4 - Violações de Imigração</h3>
              <div className="space-y-6">
                {renderQuestion('q23_visaFraud', 'Você já procurou obter ou auxiliou outros a obter um visto, entrada nos Estados Unidos ou qualquer outro benefício de imigração dos EUA por fraude ou deturpação intencional ou outros meios ilegais?')}
                {renderQuestion('q24_deported', 'Você já foi removido ou deportado de algum país?')}
              </div>
            </div>

            {/* Part 5 */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">Parte 5 - Outros</h3>
              <div className="space-y-6">
                {renderQuestion('q25_childCustody', 'Você já reteve a custódia de uma criança cidadã dos EUA fora dos Estados Unidos de uma pessoa a quem foi concedida a custódia legal por um tribunal dos EUA?')}
                {renderQuestion('q26_voted', 'Você já votou nos Estados Unidos em violação de qualquer lei ou regulamento?')}
                {renderQuestion('q27_renouncedCitizenship', 'Você já renunciou à cidadania dos Estados Unidos com o propósito de evitar impostos?')}
              </div>
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

export default Section11Security;
