import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Application } from '@/api/entities';
import { createPageUrl } from '@/utils';
import { loadApplication, saveSectionData } from '@/components/storage';
import ProgressBar from '../components/ProgressBar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Edit, Loader2, CheckCircle, XCircle, User, Globe, Plane, Users, Landmark, Home, BookUser, Heart, Briefcase, List, Shield } from 'lucide-react';
import { FORM_SECTIONS } from '@/components/form/navigation';
import { SendEmail } from '@/api/integrations';
import AutoSave from '../components/AutoSave';
import { runDeterministicAudit } from '@/lib/qaAudit';

const ReviewField = ({ label, value, fullWidth = false, type = 'string', onEdit, editLabel = "Editar" }) => {
  let displayValue = value;
  
  if (type === 'boolean') {
    displayValue = value === true ? (
      <><CheckCircle className="inline-block w-4 h-4 mr-1 text-green-600"/>Sim</>
    ) : value === false ? (
      <><XCircle className="inline-block w-4 h-4 mr-1 text-red-600"/>Não</>
    ) : <span className="text-gray-400 italic">Não informado</span>;
  } else if (value === null || value === undefined || value === '' || (Array.isArray(value) && value.length === 0)) {
    displayValue = <span className="text-gray-400 italic">Não informado</span>;
  } else if (Array.isArray(value)) {
    displayValue = value.map(item => {
      if (typeof item === 'object' && item !== null) {
          // Format objects in arrays
          if (item.givenNames && item.surnames) return `${item.givenNames} ${item.surnames}${item.relationship ? ` (${translateValue(item.relationship)})` : ''}`;
          if (item.surname && item.givenName) return `${item.givenName} ${item.surname}`;
          if (item.name) return item.name;
          if (item.location) return item.location;
          if (item.skill) return item.skill;
          if (item.language) return item.language;
          if (item.country) return item.country;
          if (item.platform && item.identifier) return `${item.platform}: ${item.identifier}`;
          if (item.dialCode && item.number) return `+${item.dialCode} ${item.number}`;
          if (item.email) return item.email;
          if (item.dateArrived && item.lengthOfStay) return `${item.dateArrived} - ${item.lengthOfStay} ${translateValue(item.stayUnit)}`;
          if (item.number && item.state) return `${item.number} (${item.state})`;
          if (item.branch && item.rank) return `${item.branch} - ${item.rank}`;
          return JSON.stringify(item);
      }
      return String(item);
    }).join(', ');
  } else if (typeof value === 'object' && value !== null) {
    // Handle specific object types
    if (value.street1 || value.city) {
      // Address object
      const parts = [value.street1, value.number, value.street2, value.city, value.state, value.zipCode || value.zip, value.country].filter(Boolean);
      displayValue = parts.join(', ');
    } else if (value.dialCode && value.number) {
      // Phone object
      displayValue = `+${value.dialCode} ${value.number}`;
    } else {
      displayValue = JSON.stringify(value, null, 2);
    }
  } else {
    displayValue = translateValue(value);
  }

  return (
    <div className={`${fullWidth ? 'col-span-1 md:col-span-2' : ''} group relative`}>
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <p className="text-sm text-gray-500 font-medium">{label}</p>
          <div className="font-semibold text-gray-800 break-words">{displayValue}</div>
        </div>
        {onEdit && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onEdit}
            className="opacity-0 group-hover:opacity-100 transition-opacity ml-2 h-8 px-2"
          >
            <Edit className="w-3 h-3 mr-1" />
            <span className="text-xs">{editLabel}</span>
          </Button>
        )}
      </div>
    </div>
  );
};

const ReviewSection = ({ title, sectionId, icon: Icon, onEdit, children, application }) => {
  const navigate = useNavigate();
  
  const handleEditSection = () => {
    const section = FORM_SECTIONS.find(s => s.id === sectionId);
    if (section && application?.id) {
      navigate(createPageUrl(`${section.page}?appId=${application.id}`));
    }
  };

  return (
    <Card className="mb-6 shadow-md border border-gray-100 bg-white">
      <CardHeader className="flex flex-row items-center justify-between bg-gray-50/50 p-4 rounded-t-lg">
        <div className="flex items-center gap-3">
          {Icon && <Icon className="w-5 h-5 text-gray-600" />}
          <CardTitle className="text-lg font-bold text-gray-700">{title}</CardTitle>
        </div>
        <Button variant="ghost" size="sm" onClick={handleEditSection}>
          <Edit className="w-4 h-4 mr-2" /> Editar Seção
        </Button>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 p-4">
        {children}
      </CardContent>
    </Card>
  );
};

// Translation mapping
const TRANSLATIONS = {
  // Estados civis
  'MARRIED': 'Casado(a)',
  'SINGLE': 'Solteiro(a)',
  'WIDOWED': 'Viúvo(a)',
  'DIVORCED': 'Divorciado(a)',
  'LEGALLY_SEPARATED': 'Separado(a) Legalmente',
  'CIVIL_UNION_DOMESTIC_PARTNERSHIP': 'União Estável/Parceria Doméstica',
  
  // Sexo
  'MALE': 'Masculino',
  'FEMALE': 'Feminino',
  
  // Relacionamentos
  'SPOUSE': 'Cônjuge',
  'CHILD': 'Filho(a)',
  'PARENT': 'Pai/Mãe',
  'SIBLING': 'Irmão/Irmã',
  'OTHER RELATIVE': 'Outro Parente',
  'FRIEND': 'Amigo(a)',
  'COLLEAGUE': 'Colega',
  'OTHER': 'Outro',
  'FIANCE_FIANCEE': 'Noivo(a)',
  'GRANDPARENT': 'Avô/Avó',
  'GRANDCHILD': 'Neto/Neta',
  'UNCLE_AUNT': 'Tio/Tia',
  'NEPHEW_NIECE': 'Sobrinho/Sobrinha',
  'COUSIN': 'Primo/Prima',
  'FATHER_IN_LAW_MOTHER_IN_LAW': 'Sogro/Sogra',
  'SON_IN_LAW_DAUGHTER_IN_LAW': 'Genro/Nora',
  'BROTHER_IN_LAW_SISTER_IN_LAW': 'Cunhado/Cunhada',
  'LEGAL_GUARDIAN': 'Tutor Legal',

  // Tipos de pagador
  'SELF': 'Eu mesmo',
  'OTHER PERSON': 'Outra Pessoa',
  'OTHER COMPANY/ORGANIZATION': 'Outra Empresa/Organização',
  
  // Unidades de tempo
  'DAYS': 'Dias',
  'WEEKS': 'Semanas',
  'MONTHS': 'Meses',
  'YEARS': 'Anos',

  // Tipos de contato
  'person': 'Pessoa',
  'hotel': 'Hotel', 
  'organization': 'Organização',

  // Relacionamentos específicos
  'FAMILY_MEMBER': 'Membro da Família',
  'BUSINESS_ASSOCIATE': 'Associado de Negócios',
  'EMPLOYER': 'Empregador',
  'SCHOOL_OFFICIAL': 'Funcionário da Escola',
  'TRAVEL_AGENT': 'Agente de Viagem',
  'TOUR_OPERATOR': 'Operador de Turismo',

  // Ocupações
  'STUDENT': 'Estudante',
  'RETIRED': 'Aposentado(a)',
  'HOMEMAKER': 'Do lar',
  'NOT_EMPLOYED': 'Desempregado(a)',
  'OTHER': 'Outro',

  // Status nos EUA
  'US_CITIZEN': 'Cidadão(ã) Americano(a)',
  'LAWFUL_PERMANENT_RESIDENT': 'Residente Permanente Legal',
  'REFUGEE_ASYLEE': 'Refugiado/Asilado',
  'OTHER_STATUS': 'Outro Status',
  'DECEASED': 'Falecido(a)',

  // Países (códigos)
  'br': 'Brasil',
  'us': 'Estados Unidos',
  'ar': 'Argentina',
  'cl': 'Chile',
  'co': 'Colômbia',
  'pe': 'Peru',
  'uy': 'Uruguai',
  'py': 'Paraguai',
  've': 'Venezuela',
  'ec': 'Equador',
  'bo': 'Bolívia',
  'sr': 'Suriname',
  'gy': 'Guiana',
  'gf': 'Guiana Francesa'
};

const translateValue = (value) => {
  if (typeof value === 'string') {
    return TRANSLATIONS[value] || value;
  }
  return value;
};

// Helper function to format data for email
const formatForEmail = (label, value, type = 'string') => {
  let formattedValue = '';
  
  if (value === null || value === undefined || value === '') {
    formattedValue = 'Não informado';
  } else if (type === 'boolean') {
    formattedValue = value === true ? 'Sim' : 'Não';
  } else if (Array.isArray(value)) {
    if (value.length === 0) {
      formattedValue = 'Nenhum';
    } else {
      formattedValue = value.map(item => {
        if (typeof item === 'object' && item !== null) {
          if (item.givenNames && item.surnames) return `${item.givenNames} ${item.surnames}${item.relationship ? ` (${translateValue(item.relationship)})` : ''}`;
          if (item.surname && item.givenName) return `${item.givenName} ${item.surname}`;
          if (item.name) return item.name;
          if (item.location) return item.location;
          if (item.skill) return item.skill;
          if (item.language) return item.language;
          if (item.country) return item.country;
          if (item.platform && item.identifier) return `${item.platform}: ${item.identifier}`;
          if (item.dialCode && item.number) return `+${item.dialCode} ${item.number}`;
          if (item.email) return item.email;
          if (item.dateArrived && item.lengthOfStay) return `Chegada: ${item.dateArrived}, Duração: ${item.lengthOfStay} ${translateValue(item.stayUnit)}`;
          if (item.number && item.state) return `Número: ${item.number}, Estado: ${item.state}`;
          if (item.branch && item.rank) return `Ramo: ${item.branch}, Posto: ${item.rank}`;
          return JSON.stringify(item);
        }
        return translateValue(item);
      }).join('; ');
    }
  } else if (typeof value === 'object' && value !== null) {
    if (value.street1 || value.city) {
      // Address object
      const parts = [value.street1, value.number, value.street2, value.city, value.state, value.zipCode || value.zip, value.country].filter(Boolean);
      formattedValue = parts.map(p => translateValue(p)).join(', ');
    } else if (value.dialCode && value.number) {
      // Phone object
      formattedValue = `+${value.dialCode} ${value.number}`;
    } else if (value.contactType) {
      // US Contact object
      formattedValue = `Tipo: ${translateValue(value.contactType)}`;
      if (value.contactType === 'person') {
        formattedValue += `, Nome: ${value.givenName || ''} ${value.surname || ''}`.trim();
        if (value.relationship) formattedValue += `, Relação: ${translateValue(value.relationship)}`;
      }
      if (value.contactType === 'organization' && value.organizationName) {
        formattedValue += `, Organização: ${value.organizationName}`;
      }
      if (value.email) formattedValue += `, Email: ${value.email}`;
      if (value.phone?.number) formattedValue += `, Telefone: +${value.phone.dialCode} ${value.phone.number}`;
    } else if (value.entity) {
      // Payer object
      formattedValue = `Responsável: ${translateValue(value.entity)}`;
      if (value.entity === 'OTHER PERSON') {
        formattedValue += `, Nome: ${value.givenNames || ''} ${value.surnames || ''}`.trim();
        if (value.relationship) formattedValue += `, Relação: ${translateValue(value.relationship)}`;
      }
      if (value.entity === 'OTHER COMPANY/ORGANIZATION' && value.companyName) {
        formattedValue += `, Empresa: ${value.companyName}`;
      }
    } else {
      formattedValue = JSON.stringify(value, null, 2);
    }
  } else {
    formattedValue = translateValue(value);
  }
  
  return `<p><strong>${label}:</strong> ${formattedValue}</p>`;
};

const formatApplicationDataForEmail = (appData) => {
  let emailBody = '<h1 style="color:#2a4365;">Nova Aplicação DS-160 Submetida</h1><hr>';
  
  // Personal Information
  if (appData.personal) {
    emailBody += '<h2 style="color:#3182ce; margin-top:20px;">Informações Pessoais 1</h2>';
    emailBody += formatForEmail('Sobrenomes', appData.personal.surnames);
    emailBody += formatForEmail('Nomes', appData.personal.givenNames);
    emailBody += formatForEmail('Usou outros nomes?', appData.personal.hasOtherNames, 'boolean');
    if (appData.personal.hasOtherNames && appData.personal.otherNames) {
      emailBody += formatForEmail('Outros Nomes', appData.personal.otherNames);
    }
    emailBody += formatForEmail('Sexo', appData.personal.sex);
    emailBody += formatForEmail('Estado Civil', appData.personal.maritalStatus);
    emailBody += formatForEmail('Data de Nascimento', appData.personal.birthDate);
    emailBody += formatForEmail('Local de Nascimento', `${appData.personal.birthCity || ''}, ${appData.personal.birthState || ''}, ${appData.personal.birthCountry || ''}`.replace(/, ,/g,',').replace(/^,|,$/g,''));
  }

  // Nationality Information
  if (appData.nationality) {
    emailBody += '<h2 style="color:#3182ce; margin-top:20px;">Informações Pessoais 2</h2>';
    emailBody += formatForEmail('Nacionalidade de Origem', appData.nationality.countryOfOrigin);
    emailBody += formatForEmail('CPF ou Identificação Nacional', appData.nationality.nationalId);
    emailBody += formatForEmail('Possui outra nacionalidade?', appData.nationality.hasOtherNationality, 'boolean');
    if (appData.nationality.hasOtherNationality && appData.nationality.otherNationalities) {
      emailBody += formatForEmail('Outras Nacionalidades', appData.nationality.otherNationalities);
    }
    emailBody += formatForEmail('É residente permanente de outro país?', appData.nationality.isPermanentResident, 'boolean');
    if (appData.nationality.isPermanentResident) {
      emailBody += formatForEmail('País de Residência Permanente', appData.nationality.permanentResidentCountry);
    }
    emailBody += formatForEmail('Possui identificação fiscal dos EUA?', appData.nationality.hasUSIdentification, 'boolean');
    if (appData.nationality.hasUSIdentification) {
      emailBody += formatForEmail('Possui SSN dos EUA?', appData.nationality.hasSocialSecurity, 'boolean');
      if (appData.nationality.hasSocialSecurity) {
        emailBody += formatForEmail('Número do SSN', appData.nationality.usSocialSecurityNumber);
      }
      emailBody += formatForEmail('Possui Taxpayer ID dos EUA?', appData.nationality.hasTaxpayerId, 'boolean');
      if (appData.nationality.hasTaxpayerId) {
        emailBody += formatForEmail('Número do Taxpayer ID', appData.nationality.usTaxpayerId);
      }
    }
  }

  // Travel Information
  if (appData.travel) {
    emailBody += '<h2 style="color:#3182ce; margin-top:20px;">Informações de Viagem</h2>';
    emailBody += formatForEmail('Possui planos específicos de viagem?', appData.travel.specificPlans, 'boolean');
    if (appData.travel.specificPlans) {
      emailBody += formatForEmail('Data de Chegada', appData.travel.arrivalDate);
      emailBody += formatForEmail('Cidade de Chegada', appData.travel.arrivalCity);
      emailBody += formatForEmail('Voo de Chegada', appData.travel.arrivalFlight);
      emailBody += formatForEmail('Data de Partida', appData.travel.departureDate);
      emailBody += formatForEmail('Cidade de Partida', appData.travel.departureCity);
      emailBody += formatForEmail('Voo de Partida', appData.travel.departureFlight);
      if (appData.travel.locationsToVisit && appData.travel.locationsToVisit.length > 0) {
        emailBody += formatForEmail('Locais a Visitar', appData.travel.locationsToVisit);
      }
    } else {
      emailBody += formatForEmail('Data Estimada de Chegada', appData.travel.intendedArrivalDate);
      emailBody += formatForEmail('Duração Estimada da Estadia', `${appData.travel.intendedStayDuration || ''} ${translateValue(appData.travel.intendedStayUnit) || ''}`.trim());
    }
    if (appData.travel.stayAddress) {
      emailBody += formatForEmail('Endereço de Hospedagem nos EUA', appData.travel.stayAddress, 'object');
    }
    emailBody += formatForEmail('Possui contato nos EUA?', appData.travel.hasUSContact, 'boolean');
    if (appData.travel.hasUSContact && appData.travel.usContact) {
      emailBody += formatForEmail('Contato nos EUA', appData.travel.usContact, 'object');
    }
    if (appData.travel.payer) {
      emailBody += formatForEmail('Responsável Financeiro pela Viagem', appData.travel.payer, 'object');
    }
  }

  // Travel Companions
  if (appData.travelCompanions) {
    emailBody += '<h2 style="color:#3182ce; margin-top:20px;">Acompanhantes de Viagem</h2>';
    emailBody += formatForEmail('Viajando com outras pessoas?', appData.travelCompanions.hasCompanions, 'boolean');
    if (appData.travelCompanions.hasCompanions && appData.travelCompanions.companions) {
      emailBody += formatForEmail('Acompanhantes', appData.travelCompanions.companions);
    }
  }

  // US History
  if (appData.usHistory) {
    emailBody += '<h2 style="color:#3182ce; margin-top:20px;">Histórico nos EUA</h2>';
    emailBody += formatForEmail('Já esteve nos EUA?', appData.usHistory.hasBeenInUS, 'boolean');
    if (appData.usHistory.hasBeenInUS && appData.usHistory.previousVisits) {
      emailBody += formatForEmail('Visitas Anteriores aos EUA', appData.usHistory.previousVisits);
    }
    emailBody += formatForEmail('Possui carteira de motorista dos EUA?', appData.usHistory.hasDriverLicense, 'boolean');
    if (appData.usHistory.hasDriverLicense && appData.usHistory.driverLicenses) {
      emailBody += formatForEmail('Carteiras de Motorista dos EUA', appData.usHistory.driverLicenses);
    }
    emailBody += formatForEmail('Já teve visto americano?', appData.usHistory.hasUSVisa, 'boolean');
    if (appData.usHistory.hasUSVisa) {
      emailBody += formatForEmail('Data do Último Visto Americano', appData.usHistory.dateLastVisaIssued);
      emailBody += formatForEmail('Número do Último Visto', appData.usHistory.visaNumberUnknown ? 'Não sabe o número' : appData.usHistory.visaNumber);
    }
    emailBody += formatForEmail('Já teve visto negado ou revogado?', appData.usHistory.hadUSVisaRefused, 'boolean');
    if (appData.usHistory.hadUSVisaRefused) {
      emailBody += formatForEmail('Explicação sobre Visto Negado/Revogado', appData.usHistory.visaRefusalExplanation);
    }
    emailBody += formatForEmail('Alguém já apresentou petição de imigração em seu nome?', appData.usHistory.hasImmigrationPetition, 'boolean');
    if (appData.usHistory.hasImmigrationPetition) {
      emailBody += formatForEmail('Explicação sobre Petição de Imigração', appData.usHistory.immigrationPetitionExplanation);
    }
  }

  // Address and Phone
  if (appData.addressPhone) {
    emailBody += '<h2 style="color:#3182ce; margin-top:20px;">Endereço e Contato</h2>';
    if (appData.addressPhone.homeAddress) {
      emailBody += formatForEmail('Endereço Residencial', appData.addressPhone.homeAddress, 'object');
    }
    emailBody += formatForEmail('Endereço de correspondência é o mesmo que residencial?', appData.addressPhone.mailingSameAsHome, 'boolean');
    if (appData.addressPhone.mailingSameAsHome === false && appData.addressPhone.mailingAddress) {
      emailBody += formatForEmail('Endereço de Correspondência', appData.addressPhone.mailingAddress, 'object');
    }
    if (appData.addressPhone.primaryPhone) {
      emailBody += formatForEmail('Telefone Principal', appData.addressPhone.primaryPhone, 'object');
    }
    if (appData.addressPhone.secondaryPhone?.number) {
      emailBody += formatForEmail('Telefone Secundário', appData.addressPhone.secondaryPhone, 'object');
    }
    if (appData.addressPhone.workPhone?.number) {
      emailBody += formatForEmail('Telefone do Trabalho', appData.addressPhone.workPhone, 'object');
    }
    emailBody += formatForEmail('Usou outro número de telefone nos últimos 5 anos?', appData.addressPhone.hasUsedOtherPhone, 'boolean');
    if (appData.addressPhone.hasUsedOtherPhone && appData.addressPhone.otherPhones) {
      emailBody += formatForEmail('Outros Telefones Utilizados', appData.addressPhone.otherPhones);
    }
    emailBody += formatForEmail('Endereço de E-mail', appData.addressPhone.email);
    emailBody += formatForEmail('Usou outro e-mail nos últimos 5 anos?', appData.addressPhone.hasUsedOtherEmail, 'boolean');
    if (appData.addressPhone.hasUsedOtherEmail && appData.addressPhone.otherEmails) {
      emailBody += formatForEmail('Outros E-mails Utilizados', appData.addressPhone.otherEmails);
    }
    if (appData.addressPhone.socialMedia && appData.addressPhone.socialMedia.length > 0) {
      emailBody += formatForEmail('Redes Sociais', appData.addressPhone.socialMedia);
    }
  }

  // Passport Information
  if (appData.passport) {
    emailBody += '<h2 style="color:#3182ce; margin-top:20px;">Informações do Passaporte</h2>';
    emailBody += formatForEmail('Número do Passaporte', appData.passport.passportNumber);
    emailBody += formatForEmail('País que Emitiu o Passaporte', translateValue(appData.passport.passportIssuingCountry));
    emailBody += formatForEmail('Local de Emissão do Passaporte', `${appData.passport.passportIssuingCity || ''}, ${appData.passport.passportIssuingState || ''}`.replace(/, ,/g,',').replace(/^,|,$/g,''));
    emailBody += formatForEmail('Data de Emissão do Passaporte', appData.passport.issuanceDate);
    emailBody += formatForEmail('Data de Expiração do Passaporte', appData.passport.expirationDate);
    emailBody += formatForEmail('Já perdeu ou teve passaporte roubado?', appData.passport.hasLostPassport, 'boolean');
    if (appData.passport.hasLostPassport && appData.passport.lostPassports) {
      emailBody += formatForEmail('Detalhes de Passaportes Perdidos/Roubados', appData.passport.lostPassports);
    }
  }

  // Family Information
  if (appData.family) {
    emailBody += '<h2 style="color:#3182ce; margin-top:20px;">Informações da Família</h2>';
    if (appData.family.father) {
      emailBody += formatForEmail('Informações do Pai', `Nome: ${appData.family.father.givenName || ''} ${appData.family.father.surname || ''}, Nascimento: ${appData.family.father.birthDate || 'N/A'}, Nos EUA: ${appData.family.father.isInUS ? (translateValue(appData.family.father.usStatus) || 'Sim') : 'Não'}`);
    }
    if (appData.family.mother) {
      emailBody += formatForEmail('Informações da Mãe', `Nome: ${appData.family.mother.givenName || ''} ${appData.family.mother.surname || ''}, Nascimento: ${appData.family.mother.birthDate || 'N/A'}, Nos EUA: ${appData.family.mother.isInUS ? (translateValue(appData.family.mother.usStatus) || 'Sim') : 'Não'}`);
    }
    emailBody += formatForEmail('Possui outros parentes imediatos nos EUA?', appData.family.hasRelativesInUS, 'boolean');
    if (appData.family.hasRelativesInUS && appData.family.relatives) {
      emailBody += formatForEmail('Parentes nos EUA', appData.family.relatives);
    }
  }

  // Spouse Information (if applicable)
  if (appData.spouse) {
    emailBody += '<h2 style="color:#3182ce; margin-top:20px;">Informações do Cônjuge</h2>';
    emailBody += formatForEmail('Nome do Cônjuge', `${appData.spouse.givenName || ''} ${appData.spouse.surname || ''}`.trim());
    emailBody += formatForEmail('Data de Nascimento do Cônjuge', appData.spouse.birthDate);
    emailBody += formatForEmail('Nacionalidade do Cônjuge', translateValue(appData.spouse.nationality));
    emailBody += formatForEmail('Local de Nascimento do Cônjuge', `${appData.spouse.cityOfBirth || ''}, ${appData.spouse.countryOfBirth || ''}`.replace(/, ,/g,',').replace(/^,|,$/g,''));
    emailBody += formatForEmail('Endereço do cônjuge é o mesmo que o seu?', appData.spouse.isAddressSameAsApplicant, 'boolean');
    if (appData.spouse.isAddressSameAsApplicant === false && appData.spouse.address) {
      emailBody += formatForEmail('Endereço do Cônjuge', appData.spouse.address, 'object');
    }
  }

  // Work and Education
  if (appData.workEducation) {
    emailBody += '<h2 style="color:#3182ce; margin-top:20px;">Trabalho e Educação</h2>';
    emailBody += formatForEmail('Ocupação Principal', translateValue(appData.workEducation.primaryOccupation));
    if (appData.workEducation.primaryOccupation === 'OTHER') {
      emailBody += formatForEmail('Especificação da Ocupação', appData.workEducation.otherOccupationDetails);
    }
    if (!['NOT_EMPLOYED', 'RETIRED', 'HOMEMAKER'].includes(appData.workEducation.primaryOccupation) && appData.workEducation.currentEmployer) {
      emailBody += formatForEmail('Nome do Empregador Atual', appData.workEducation.currentEmployer.name);
      if (appData.workEducation.currentEmployer.address) {
        emailBody += formatForEmail('Endereço do Empregador', appData.workEducation.currentEmployer.address, 'object');
      }
      if (appData.workEducation.currentEmployer.phone) {
        emailBody += formatForEmail('Telefone do Empregador', appData.workEducation.currentEmployer.phone, 'object');
      }
      emailBody += formatForEmail('Data de Início no Emprego Atual', appData.workEducation.currentEmployer.startDate);
      emailBody += formatForEmail('Renda Mensal Bruta', appData.workEducation.currentEmployer.monthlySalary);
      emailBody += formatForEmail('Descrição das Atividades de Trabalho', appData.workEducation.currentEmployer.duties);
    }
    emailBody += formatForEmail('Já foi empregado anteriormente?', appData.workEducation.wasPreviouslyEmployed, 'boolean');
    if (appData.workEducation.wasPreviouslyEmployed && appData.workEducation.previousEmployers) {
      emailBody += formatForEmail('Empregos Anteriores', appData.workEducation.previousEmployers);
    }
    emailBody += formatForEmail('Já frequentou instituição de ensino?', appData.workEducation.attendedEducation, 'boolean');
    if (appData.workEducation.attendedEducation && appData.workEducation.educations) {
      emailBody += formatForEmail('Instituições de Ensino', appData.workEducation.educations);
    }
  }

  // Additional Information
  if (appData.additionalInfo) {
    emailBody += '<h2 style="color:#3182ce; margin-top:20px;">Informações Adicionais</h2>';
    emailBody += formatForEmail('Pertence a um clã ou tribo?', appData.additionalInfo.belongsToClan, 'boolean');
    if (appData.additionalInfo.belongsToClan) {
      emailBody += formatForEmail('Nome do Clã ou Tribo', appData.additionalInfo.clanName);  
    }
    if (appData.additionalInfo.languages && appData.additionalInfo.languages.length > 0) {
      emailBody += formatForEmail('Idiomas que Fala', appData.additionalInfo.languages);
    }
    emailBody += formatForEmail('Viajou para outros países nos últimos 5 anos?', appData.additionalInfo.hasRecentTravel, 'boolean');
    if (appData.additionalInfo.hasRecentTravel && appData.additionalInfo.countriesVisited) {
      emailBody += formatForEmail('Países/Regiões Visitados nos Últimos 5 Anos', appData.additionalInfo.countriesVisited);
    }
    emailBody += formatForEmail('Pertence ou contribuiu para organizações?', appData.additionalInfo.belongsToOrganizations, 'boolean');
    if (appData.additionalInfo.belongsToOrganizations && appData.additionalInfo.organizations) {
      emailBody += formatForEmail('Organizações das quais Participa', appData.additionalInfo.organizations);
    }
    emailBody += formatForEmail('Possui habilidades especializadas?', appData.additionalInfo.hasSpecialSkills, 'boolean');
    if (appData.additionalInfo.hasSpecialSkills && appData.additionalInfo.specialSkills) {
      emailBody += formatForEmail('Habilidades Especializadas', appData.additionalInfo.specialSkills);
    }
    emailBody += formatForEmail('Já serviu nas forças armadas?', appData.additionalInfo.hasServedInMilitary, 'boolean');
    if (appData.additionalInfo.hasServedInMilitary && appData.additionalInfo.militaryService) {
      emailBody += formatForEmail('Serviço Militar', appData.additionalInfo.militaryService);
    }
  }

  // Security Questions
  if (appData.security) {
    emailBody += '<h2 style="color:#3182ce; margin-top:20px;">Questões de Segurança</h2>';
    
    const securityQuestions = [
      { id: 'q1_communicableDisease', question: 'Possui doença transmissível de importância para a saúde pública?' },
      { id: 'q2_mentalDisorder', question: 'Possui transtorno mental ou físico que represente uma ameaça?' },
      { id: 'q3_drugAbuser', question: 'É ou já foi usuário de drogas ou dependente químico?' },
      { id: 'q4_arrested', question: 'Já foi preso ou condenado por qualquer ofensa ou crime?' },
      { id: 'q5_controlledSubstances', question: 'Já violou lei relacionada a substâncias controladas?' },
      { id: 'q6_prostitution', question: 'Vem aos EUA para se envolver em prostituição?' },
      { id: 'q7_moneyLaundering', question: 'Busca se envolver em lavagem de dinheiro?' },
      { id: 'q8_humanTrafficking', question: 'Já cometeu crime de tráfico de pessoas?' },
      { id: 'q9_aidedHumanTrafficking', question: 'Já ajudou em crime de tráfico de pessoas?' },
      { id: 'q10_benefitedHumanTrafficking', question: 'Beneficiou-se de atividades de tráfico de pessoas?' },
      { id: 'q11_espionage', question: 'Busca se envolver em espionagem?' },
      { id: 'q12_terroristActivities', question: 'Busca se envolver em atividades terroristas?' },
      { id: 'q13_terroristSupport', question: 'Já forneceu apoio material a terroristas?' },
      { id: 'q14_terroristMember', question: 'É membro de organização terrorista?' },
      { id: 'q15_terroristFamily', question: 'É familiar de membro de organização terrorista?' },
      { id: 'q16_genocide', question: 'Já participou de genocídio?' },
      { id: 'q17_torture', question: 'Já cometeu tortura?' },
      { id: 'q18_extrajudicialKilling', question: 'Já cometeu assassinatos extrajudiciais?' },
      { id: 'q19_childSoldiers', question: 'Já recrutou crianças-soldado?' },
      { id: 'q20_religiousFreedomViolation', question: 'Realizou violações da liberdade religiosa?' },
      { id: 'q21_populationControls', question: 'Esteve envolvido em controles populacionais coercitivos?' },
      { id: 'q22_organTransplantation', question: 'Esteve envolvido em transplante coercitivo de órgãos?' },
      { id: 'q23_visaFraud', question: 'Busca obter visto por meio de fraude?' },
      { id: 'q24_deported', question: 'Já foi removido ou deportado dos EUA?' },
      { id: 'q25_childCustody', question: 'Já reteve custódia de criança cidadã americana?' },
      { id: 'q26_voted', question: 'Já votou ilegalmente nos EUA?' },
      { id: 'q27_renouncedCitizenship', question: 'Já renunciou à cidadania para evitar impostos?' }
    ];

    securityQuestions.forEach(q => {
      emailBody += formatForEmail(q.question, appData.security[q.id], 'boolean');
      if (appData.security[q.id] && appData.security[`${q.id}_exp`]) {
        emailBody += formatForEmail(`Explicação para "${q.question}"`, appData.security[`${q.id}_exp`]);
      }
    });
  }

  emailBody += '<hr><p style="margin-top:20px;"><em>Aplicação enviada em: ' + new Date().toLocaleString('pt-BR') + '</em></p>';
  return emailBody;
};

export default function Review() {
  const navigate = useNavigate();
  const location = useLocation();
  const appId = new URLSearchParams(location.search).get('appId');
  const [application, setApplication] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [qaResult, setQaResult] = useState(null);
  const [humanApproved, setHumanApproved] = useState(false);
  const [qaBlocking, setQaBlocking] = useState('');


  useEffect(() => {
    if (!appId || appId === 'null' || appId === 'undefined') {
      navigate(createPageUrl("Dashboard"));
      return;
    }
    const fetchApplication = async () => {
      try {
        const app = await loadApplication(appId);
        setApplication(app);
      } catch (error) {
        console.error("Failed to load application:", error);
        navigate(createPageUrl("Dashboard"));
      }
      setIsLoading(false);
    };
    fetchApplication();
  }, [appId, navigate]);

  
  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const currentData = application?.data || {};
      const audit = runDeterministicAudit(currentData);

      if (audit.qa_status !== 'ok') {
        setQaResult(audit);
        setQaBlocking('Para finalizar, corrija as pendências indicadas abaixo.');
        setIsSubmitting(false);
        return;
      }
      if (!humanApproved) {
        setQaBlocking('Para finalizar, confirme a revisão humana (checkbox).');
        setIsSubmitting(false);
        return;
      }

      // Persist QA snapshot + human approval
      const qaPayload = {
        qa_status: audit.qa_status,
        qa_flags: audit.flags,
        qa_reviewed_at: new Date().toISOString(),
        qa_human_approved: true
      };
      const finalApp = await saveSectionData(application, 'review', qaPayload);

      const emailBody = `
Nova aplicação DS-160 finalizada (com revisão humana)

ID: ${finalApp.id}

QA Status: ${qaPayload.qa_status}
Flags: ${qaPayload.qa_flags.length}

Dados (JSON):
${JSON.stringify(finalApp.data, null, 2)}
      `.trim();

      await SendEmail({
        to: 'suporte@visastore.tur.br',
        subject: 'DS-160 - Aplicação finalizada (revisada)',
        body: emailBody
      });

      navigate(createPageUrl("Export"), { state: { appId: finalApp.id } });
    } catch (error) {
      console.error("Erro ao finalizar:", error);
      alert("Ocorreu um erro ao finalizar. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };


  const prevSection = () => {
    if (appId && appId !== 'null' && appId !== 'undefined') {
      navigate(createPageUrl(`Section11Security?appId=${appId}`));
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

  const data = application?.data || {};

  useEffect(() => {
    if (!application?.data) return;
    const res = runDeterministicAudit(application.data);
    setQaResult(res);
    setQaBlocking(res.qa_status !== 'ok' ? 'Há pendências que precisam ser corrigidas antes de finalizar.' : '');
  }, [application]);


  return (
    <div className="min-h-screen bg-gray-50">
      <ProgressBar application={application} currentSectionId="review" />
      
      {/* AutoSave Component */}
      <AutoSave 
        application={application}
        sectionId="review"
        formData={{ reviewed_at: new Date().toISOString() }}
        onApplicationUpdate={setApplication}
      />
      
      <div className="max-w-4xl mx-auto p-4 md:p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Revisão Final da Aplicação</h1>
          <p className="text-gray-600 mt-2">Revise todas as informações fornecidas. Você pode editar qualquer seção clicando no botão "Editar Seção".</p>
        </div>

        {/* Seção 1: Informações Pessoais 1 */}
        {data.personal && (
          <ReviewSection title="Informações Pessoais 1" sectionId="personal" icon={User} application={application}>
            <ReviewField label="Sobrenomes" value={data.personal.surnames} />
            <ReviewField label="Nomes" value={data.personal.givenNames} />
            <ReviewField label="Sexo" value={translateValue(data.personal.sex)} />
            <ReviewField label="Estado Civil" value={translateValue(data.personal.maritalStatus)} />
            <ReviewField label="Data de Nascimento" value={data.personal.birthDate} />
            <ReviewField label="Local de Nascimento" value={`${data.personal.birthCity || ''}, ${data.personal.birthState || ''}, ${data.personal.birthCountry || ''}`.replace(/, ,/g,',').replace(/^,|,$/g,'')} />
            <ReviewField label="Usou outros nomes?" value={data.personal.hasOtherNames} type="boolean"/>
            {data.personal.hasOtherNames && data.personal.otherNames && data.personal.otherNames.length > 0 && (
              <ReviewField label="Outros Nomes" value={data.personal.otherNames?.map(n => `${n.givenName || ''} ${n.surname || ''}`.trim()).join('; ')} fullWidth />
            )}
          </ReviewSection>
        )}

        {/* Seção 2: Informações Pessoais 2 */}
        {data.nationality && (
          <ReviewSection title="Informações Pessoais 2" sectionId="nationality" icon={Globe} application={application}>
            <ReviewField label="Nacionalidade de Origem" value={data.nationality.countryOfOrigin} />
            <ReviewField label="CPF ou Identificação Nacional" value={data.nationality.nationalId} />
            <ReviewField label="Possui outra nacionalidade?" value={data.nationality.hasOtherNationality} type="boolean"/>
            {data.nationality.hasOtherNationality && data.nationality.otherNationalities && (
              <ReviewField label="Outras Nacionalidades" value={Array.isArray(data.nationality.otherNationalities) ? data.nationality.otherNationalities.join(', ') : data.nationality.otherNationalities} fullWidth />
            )}
            <ReviewField label="É residente permanente de outro país?" value={data.nationality.isPermanentResident} type="boolean"/>
            {data.nationality.isPermanentResident && (
              <ReviewField label="País de Residência Permanente" value={data.nationality.permanentResidentCountry} />
            )}
            <ReviewField label="Possui identificação fiscal dos EUA?" value={data.nationality.hasUSIdentification} type="boolean"/>
            {data.nationality.hasUSIdentification && (
              <>
                <ReviewField label="Possui SSN dos EUA?" value={data.nationality.hasSocialSecurity} type="boolean"/>
                {data.nationality.hasSocialSecurity && (
                  <ReviewField label="Número do SSN" value={data.nationality.usSocialSecurityNumber} />
                )}
                <ReviewField label="Possui Taxpayer ID dos EUA?" value={data.nationality.hasTaxpayerId} type="boolean"/>
                {data.nationality.hasTaxpayerId && (
                  <ReviewField label="Número do Taxpayer ID" value={data.nationality.usTaxpayerId} />
                )}
              </>
            )}
          </ReviewSection>
        )}

        {/* Seção 3: Informações de Viagem */}
        {data.travel && (
          <ReviewSection title="Informações de Viagem" sectionId="travel" icon={Plane} application={application}>
            <ReviewField label="Possui planos específicos?" value={data.travel.specificPlans} type="boolean"/>
            {data.travel.specificPlans ? (
              <>
                <ReviewField label="Data de Chegada" value={data.travel.arrivalDate} />
                <ReviewField label="Cidade de Chegada" value={data.travel.arrivalCity} />
                <ReviewField label="Voo de Chegada" value={data.travel.arrivalFlight} />
                <ReviewField label="Data de Partida" value={data.travel.departureDate} />
                <ReviewField label="Cidade de Partida" value={data.travel.departureCity} />
                <ReviewField label="Voo de Partida" value={data.travel.departureFlight} />
                {data.travel.locationsToVisit && data.travel.locationsToVisit.length > 0 && (
                  <ReviewField label="Locais a Visitar" value={data.travel.locationsToVisit.map(l => l.location).filter(Boolean).join(', ')} fullWidth />
                )}
              </>
            ) : (
              <>
                <ReviewField label="Data Estimada de Chegada" value={data.travel.intendedArrivalDate} />
                <ReviewField label="Duração Estimada" value={`${data.travel.intendedStayDuration || ''} ${translateValue(data.travel.intendedStayUnit) || ''}`.trim()} />
              </>
            )}
            {data.travel.stayAddress && (
              <ReviewField label="Endereço nos EUA" value={`${data.travel.stayAddress.street1 || ''}, ${data.travel.stayAddress.city || ''}, ${data.travel.stayAddress.state || ''} ${data.travel.stayAddress.zip || ''}`.replace(/, ,/g, ', ').replace(/^,|,$/g, '')} fullWidth/>
            )}
            
            <ReviewField label="Tem contato nos EUA?" value={data.travel.hasUSContact} type="boolean"/>
            {data.travel.hasUSContact && data.travel.usContact && (
              <>
                <ReviewField label="Tipo de Contato" value={translateValue(data.travel.usContact.contactType)} />
                {data.travel.usContact.contactType === 'person' && (
                  <ReviewField label="Nome do Contato" value={`${data.travel.usContact.givenName || ''} ${data.travel.usContact.surname || ''}`.trim()} />
                )}
                {data.travel.usContact.contactType === 'organization' && (
                  <ReviewField label="Nome da Organização" value={data.travel.usContact.organizationName} />
                )}
                <ReviewField label="Relação" value={translateValue(data.travel.usContact.relationship)} />
                {data.travel.usContact.address && (
                  <ReviewField label="Endereço do Contato" value={`${data.travel.usContact.address.street1 || ''}, ${data.travel.usContact.address.city || ''}, ${data.travel.usContact.address.state || ''}`.replace(/, ,/g, ', ').replace(/^,|,$/g, '')} fullWidth />
                )}
                {data.travel.usContact.phone && (
                  <ReviewField label="Telefone do Contato" value={`+${data.travel.usContact.phone.dialCode || ''} ${data.travel.usContact.phone.number || ''}`.trim()} />
                )}
                <ReviewField label="Email do Contato" value={data.travel.usContact.email} />
              </>
            )}
            
            <ReviewField label="Responsável pela viagem" value={translateValue(data.travel.payer?.entity)} />
            {data.travel.payer?.entity === 'OTHER PERSON' && (
              <>
                <ReviewField label="Nome do Pagador" value={`${data.travel.payer.givenNames || ''} ${data.travel.payer.surnames || ''}`.trim()} />
                <ReviewField label="Relação" value={translateValue(data.travel.payer.relationship)} />
              </>
            )}
            {data.travel.payer?.entity === 'OTHER COMPANY/ORGANIZATION' && (
              <>
                <ReviewField label="Nome da Empresa" value={data.travel.payer.companyName} />
                <ReviewField label="Relação" value={data.travel.payer.companyRelationship} />
              </>
            )}
          </ReviewSection>
        )}
        
        {/* Seção 4: Acompanhantes de Viagem */}
        {data.travelCompanions && (
            <ReviewSection title="Acompanhantes de Viagem" sectionId="travelCompanions" icon={Users} application={application}>
                <ReviewField label="Viajando com outras pessoas?" value={data.travelCompanions.hasCompanions} type="boolean"/>
                {data.travelCompanions.hasCompanions && data.travelCompanions.companions && data.travelCompanions.companions.length > 0 && (
                  <ReviewField label="Acompanhantes" value={data.travelCompanions.companions.map(c => `${c.givenNames || ''} ${c.surnames || ''} (${translateValue(c.relationship) || ''})`).join('; ')} fullWidth />
                )}
            </ReviewSection>
        )}

        {/* Seção 5: Histórico nos EUA */}
        {data.usHistory && (
            <ReviewSection title="Histórico nos EUA" sectionId="usHistory" icon={Landmark} application={application}>
                <ReviewField label="Já esteve nos EUA?" value={data.usHistory.hasBeenInUS} type="boolean"/>
                {data.usHistory.hasBeenInUS && data.usHistory.previousVisits && data.usHistory.previousVisits.length > 0 && (
                  <ReviewField label="Visitas Anteriores" value={data.usHistory.previousVisits.map(v => `${v.dateArrived || 'Data não informada'} - ${v.lengthOfStay || ''} ${translateValue(v.stayUnit) || ''}`).join('; ')} fullWidth />
                )}
                <ReviewField label="Possui carteira de motorista dos EUA?" value={data.usHistory.hasDriverLicense} type="boolean"/>
                {data.usHistory.hasDriverLicense && data.usHistory.driverLicenses && data.usHistory.driverLicenses.length > 0 && (
                  <ReviewField label="Carteiras de Motorista" value={data.usHistory.driverLicenses.map(l => `${l.number || 'Número não informado'} - ${l.state || ''}`).join('; ')} fullWidth />
                )}
                <ReviewField label="Já teve visto americano?" value={data.usHistory.hasUSVisa} type="boolean"/>
                {data.usHistory.hasUSVisa && (
                  <>
                    <ReviewField label="Data do Último Visto" value={data.usHistory.dateLastVisaIssued} />
                    <ReviewField label="Número do Visto" value={data.usHistory.visaNumberUnknown ? 'Não sabe' : data.usHistory.visaNumber} />
                  </>
                )}
                <ReviewField label="Já teve visto recusado?" value={data.usHistory.hadUSVisaRefused} type="boolean"/>
                {data.usHistory.hadUSVisaRefused && (
                  <ReviewField label="Explicação da Recusa" value={data.usHistory.visaRefusalExplanation} fullWidth />
                )}
                <ReviewField label="Alguém já apresentou petição em seu nome?" value={data.usHistory.hasImmigrationPetition} type="boolean"/>
                {data.usHistory.hasImmigrationPetition && (
                  <ReviewField label="Explicação da Petição" value={data.usHistory.immigrationPetitionExplanation} fullWidth />
                )}
            </ReviewSection>
        )}
        
        {/* Seção 6: Endereço e Contato */}
        {data.addressPhone && (
            <ReviewSection title="Endereço e Contato" sectionId="addressPhone" icon={Home} application={application}>
                {data.addressPhone.homeAddress && (
                  <ReviewField label="Endereço Residencial" value={`${data.addressPhone.homeAddress.street1 || ''}, ${data.addressPhone.homeAddress.number || ''} ${data.addressPhone.homeAddress.street2 || ''}, ${data.addressPhone.homeAddress.city || ''}, ${data.addressPhone.homeAddress.state || ''} ${data.addressPhone.homeAddress.zipCode || ''}, ${data.addressPhone.homeAddress.country || ''}`.replace(/, ,/g, ', ').replace(/^,|,$/g, '')} fullWidth />
                )}
                <ReviewField label="Endereço de correspondência é o mesmo?" value={data.addressPhone.mailingSameAsHome} type="boolean"/>
                {data.addressPhone.mailingSameAsHome === false && data.addressPhone.mailingAddress && (
                  <ReviewField label="Endereço de Correspondência" value={`${data.addressPhone.mailingAddress.street1 || ''}, ${data.addressPhone.mailingAddress.number || ''} ${data.addressPhone.mailingAddress.street2 || ''}, ${data.addressPhone.mailingAddress.city || ''}, ${data.addressPhone.mailingAddress.state || ''} ${data.addressPhone.mailingAddress.zipCode || ''}, ${data.addressPhone.mailingAddress.country || ''}`.replace(/, ,/g, ', ').replace(/^,|,$/g, '')} fullWidth />
                )}
                {data.addressPhone.primaryPhone && (
                  <ReviewField label="Telefone Principal" value={`+${data.addressPhone.primaryPhone.dialCode || ''} ${data.addressPhone.primaryPhone.number || ''}`.trim()} />
                )}
                {data.addressPhone.secondaryPhone && data.addressPhone.secondaryPhone.number && (
                  <ReviewField label="Telefone Secundário" value={`+${data.addressPhone.secondaryPhone.dialCode || ''} ${data.addressPhone.secondaryPhone.number || ''}`.trim()} />
                )}
                {data.addressPhone.workPhone && data.addressPhone.workPhone.number && (
                  <ReviewField label="Telefone do Trabalho" value={`+${data.addressPhone.workPhone.dialCode || ''} ${data.addressPhone.workPhone.number || ''}`.trim()} />
                )}
                <ReviewField label="Usou outro número de telefone nos últimos 5 anos?" value={data.addressPhone.hasUsedOtherPhone} type="boolean"/>
                {data.addressPhone.hasUsedOtherPhone && data.addressPhone.otherPhones && data.addressPhone.otherPhones.length > 0 && (
                  <ReviewField label="Outros Telefones" value={data.addressPhone.otherPhones.map(p => `+${p.dialCode || ''} ${p.number || ''}`).join('; ')} fullWidth />
                )}
                <ReviewField label="Email" value={data.addressPhone.email} />
                <ReviewField label="Usou outro endereço de e-mail nos últimos 5 anos?" value={data.addressPhone.hasUsedOtherEmail} type="boolean"/>
                {data.addressPhone.hasUsedOtherEmail && data.addressPhone.otherEmails && data.addressPhone.otherEmails.length > 0 && (
                  <ReviewField label="Outros E-mails" value={data.addressPhone.otherEmails.map(e => e.email).join('; ')} fullWidth />
                )}
                {data.addressPhone.socialMedia && data.addressPhone.socialMedia.length > 0 && (
                  <ReviewField label="Redes Sociais" value={data.addressPhone.socialMedia.map(s => `${s.platform}: ${s.identifier}`).join('; ')} fullWidth />
                )}
            </ReviewSection>
        )}

        {/* Seção 7: Informações do Passaporte */}
        {data.passport && (
            <ReviewSection title="Informações do Passaporte" sectionId="passport" icon={BookUser} application={application}>
                <ReviewField label="Número do Passaporte" value={data.passport.passportNumber} />
                <ReviewField label="País que Emitiu o Passaporte" value={translateValue(data.passport.passportIssuingCountry)} />
                <ReviewField label="Local de Emissão" value={`${data.passport.passportIssuingCity || ''}, ${data.passport.passportIssuingState || ''}`.replace(/, ,/g,',').replace(/^,|,$/g,'')} />
                <ReviewField label="Data de Emissão" value={data.passport.issuanceDate} />
                <ReviewField label="Data de Expiração" value={data.passport.expirationDate} />
                <ReviewField label="Já perdeu ou teve passaporte roubado?" value={data.passport.hasLostPassport} type="boolean"/>
                {data.passport.hasLostPassport && data.passport.lostPassports && data.passport.lostPassports.length > 0 && (
                  <ReviewField label="Passaportes Perdidos/Roubados" value={data.passport.lostPassports.map(p => `Número: ${p.number || ''}, País: ${translateValue(p.country) || ''}, Explicação: ${p.explanation || ''}`).join('; ')} fullWidth />
                )}
            </ReviewSection>
        )}
        
        {/* Seção 9: Informações da Família */}
        {data.family && (
            <ReviewSection title="Informações da Família" sectionId="family" icon={Users} application={application}>
                {data.family.father && (
                  <ReviewField label="Pai" value={`${data.family.father.givenName || ''} ${data.family.father.surname || ''} (Nasc: ${data.family.father.birthDate || 'N/A'}) - EUA: ${data.family.father.isInUS ? (translateValue(data.family.father.usStatus) || 'Sim') : 'Não'}`.trim()} />
                )}
                {data.family.mother && (
                  <ReviewField label="Mãe" value={`${data.family.mother.givenName || ''} ${data.family.mother.surname || ''} (Nasc: ${data.family.mother.birthDate || 'N/A'}) - EUA: ${data.family.mother.isInUS ? (translateValue(data.family.mother.usStatus) || 'Sim') : 'Não'}`.trim()} />
                )}
                <ReviewField label="Possui outros parentes imediatos nos EUA?" value={data.family.hasRelativesInUS} type="boolean"/>
                {data.family.hasRelativesInUS && data.family.relatives && data.family.relatives.length > 0 && (
                  <ReviewField label="Parentes nos EUA" value={data.family.relatives.map(r => `${r.givenName || ''} ${r.surname || ''} (${translateValue(r.relationship) || ''}) - Status: ${translateValue(r.usStatus) || 'N/A'}`).join('; ')} fullWidth />
                )}
            </ReviewSection>
        )}

        {/* Seção 9a: Cônjuge (se aplicável) */}
        {data.spouse && (
          <ReviewSection title="Informações do Cônjuge" sectionId="spouse" icon={Heart} application={application}>
            <ReviewField label="Nome do Cônjuge" value={`${data.spouse.givenName || ''} ${data.spouse.surname || ''}`.trim()} />
            <ReviewField label="Data de Nascimento" value={data.spouse.birthDate} />
            <ReviewField label="Nacionalidade" value={translateValue(data.spouse.nationality)} />
            <ReviewField label="Local de Nascimento" value={`${data.spouse.cityOfBirth || ''}, ${data.spouse.countryOfBirth || ''}`.replace(/, ,/g,',').replace(/^,|,$/g,'')} />
            <ReviewField label="Endereço é o mesmo?" value={data.spouse.isAddressSameAsApplicant} type="boolean"/>
            {data.spouse.isAddressSameAsApplicant === false && data.spouse.address && (
              <ReviewField label="Endereço do Cônjuge" value={`${data.spouse.address.street1 || ''}, ${data.spouse.address.number || ''} ${data.spouse.address.street2 || ''}, ${data.spouse.address.city || ''}, ${data.spouse.address.state || ''} ${data.spouse.address.zipCode || ''}, ${data.spouse.address.country || ''}`.replace(/, ,/g, ', ').replace(/^,|,$/g, '')} fullWidth />
            )}
          </ReviewSection>
        )}
        
        {/* Seção 10: Trabalho e Educação */}
        {data.workEducation && (
            <ReviewSection title="Trabalho e Educação" sectionId="workEducation" icon={Briefcase} application={application}>
                <ReviewField label="Ocupação Principal" value={translateValue(data.workEducation.primaryOccupation)} />
                {data.workEducation.primaryOccupation === 'OTHER' && (
                    <ReviewField label="Especificação da Ocupação" value={data.workEducation.otherOccupationDetails} />
                )}
                {!['NOT_EMPLOYED', 'RETIRED', 'HOMEMAKER'].includes(data.workEducation.primaryOccupation) && data.workEducation.currentEmployer && (
                    <>
                        <ReviewField label="Empregador Atual" value={data.workEducation.currentEmployer.name} />
                        <ReviewField label="Endereço do Empregador" value={`${data.workEducation.currentEmployer.address?.street1 || ''}, ${data.workEducation.currentEmployer.address?.number || ''}, ${data.workEducation.currentEmployer.address?.city || ''}, ${data.workEducation.currentEmployer.address?.state || ''}, ${data.workEducation.currentEmployer.address?.country || ''}`.replace(/, ,/g,',').replace(/^,|,$/g,'')} />
                        <ReviewField label="Telefone do Empregador" value={`+${data.workEducation.currentEmployer.phone?.dialCode || ''} ${data.workEducation.currentEmployer.phone?.number || ''}`.trim()} />
                        <ReviewField label="Data de Início" value={data.workEducation.currentEmployer.startDate} />
                        <ReviewField label="Renda Mensal Bruta" value={data.workEducation.currentEmployer.monthlySalary} />
                        <ReviewField label="Descrição das Atividades" value={data.workEducation.currentEmployer.duties} fullWidth />
                    </>
                )}
                <ReviewField label="Já foi empregado anteriormente?" value={data.workEducation.wasPreviouslyEmployed} type="boolean"/>
                {data.workEducation.wasPreviouslyEmployed && data.workEducation.previousEmployers && data.workEducation.previousEmployers.length > 0 && (
                  <ReviewField label="Empregos Anteriores" value={data.workEducation.previousEmployers.map(e => `${e.name || ''} - ${e.jobTitle || ''}`).join('; ')} fullWidth />
                )}
                <ReviewField label="Já frequentou instituição de ensino?" value={data.workEducation.attendedEducation} type="boolean"/>
                {data.workEducation.attendedEducation && data.workEducation.educations && data.workEducation.educations.length > 0 && (
                  <ReviewField label="Instituições de Ensino" value={data.workEducation.educations.map(e => `${e.name || ''} - ${e.course || ''}`).join('; ')} fullWidth />
                )}
            </ReviewSection>
        )}

        {/* Seção 11a: Informações Adicionais */}
        {data.additionalInfo && (
          <ReviewSection title="Informações Adicionais" sectionId="additionalInfo" icon={List} application={application}>
            <ReviewField label="Pertence a um clã ou tribo?" value={data.additionalInfo.belongsToClan} type="boolean"/>
            {data.additionalInfo.belongsToClan && <ReviewField label="Nome do Clã ou Tribo" value={data.additionalInfo.clanName} />}
            {data.additionalInfo.languages && data.additionalInfo.languages.length > 0 && (
              <ReviewField label="Idiomas que Fala" value={data.additionalInfo.languages.map(l => l.language).filter(Boolean).join(', ')} fullWidth />
            )}
            <ReviewField label="Viajou para outros países nos últimos 5 anos?" value={data.additionalInfo.hasRecentTravel} type="boolean"/>
            {data.additionalInfo.hasRecentTravel && data.additionalInfo.countriesVisited && data.additionalInfo.countriesVisited.length > 0 && (
              <ReviewField label="Países/Regiões Visitados" value={data.additionalInfo.countriesVisited.map(c => c.country).filter(Boolean).join(', ')} fullWidth />
            )}
            <ReviewField label="Pertence a organizações?" value={data.additionalInfo.belongsToOrganizations} type="boolean"/>
            {data.additionalInfo.belongsToOrganizations && data.additionalInfo.organizations && data.additionalInfo.organizations.length > 0 && (
              <ReviewField label="Organizações" value={data.additionalInfo.organizations.map(o => o.name).filter(Boolean).join(', ')} fullWidth />
            )}
            <ReviewField label="Possui habilidades especializadas?" value={data.additionalInfo.hasSpecialSkills} type="boolean"/>
            {data.additionalInfo.hasSpecialSkills && data.additionalInfo.specialSkills && data.additionalInfo.specialSkills.length > 0 && (
              <ReviewField label="Habilidades Específicas" value={data.additionalInfo.specialSkills.map(s => s.skill).filter(Boolean).join(', ')} fullWidth />
            )}
            <ReviewField label="Serviu nas forças armadas?" value={data.additionalInfo.hasServedInMilitary} type="boolean"/>
            {data.additionalInfo.hasServedInMilitary && data.additionalInfo.militaryService && data.additionalInfo.militaryService.length > 0 && (
              <ReviewField label="Serviço Militar" value={data.additionalInfo.militaryService.map(m => `${m.branch} - ${m.rank} (${m.startDate} a ${m.endDate})`).join('; ')} fullWidth />
            )}
          </ReviewSection>
        )}

        {/* Seção 11: Questões de Segurança */}
        {data.security && (
          <ReviewSection title="Questões de Segurança" sectionId="security" icon={Shield} application={application}>
            <ReviewField label="Possui doença transmissível?" value={data.security.q1_communicableDisease} type="boolean"/>
            {data.security.q1_communicableDisease && <ReviewField label="Explicação" value={data.security.q1_communicableDisease_exp} fullWidth />}
            <ReviewField label="Possui transtorno mental/físico?" value={data.security.q2_mentalDisorder} type="boolean"/>
            {data.security.q2_mentalDisorder && <ReviewField label="Explicação" value={data.security.q2_mentalDisorder_exp} fullWidth />}
            <ReviewField label="Já foi usuário de drogas?" value={data.security.q3_drugAbuser} type="boolean"/>
            {data.security.q3_drugAbuser && <ReviewField label="Explicação" value={data.security.q3_drugAbuser_exp} fullWidth />}
            <ReviewField label="Já foi preso?" value={data.security.q4_arrested} type="boolean"/>
            {data.security.q4_arrested && <ReviewField label="Explicação" value={data.security.q4_arrested_exp} fullWidth />}
            <ReviewField label="Já violou leis de substâncias controladas?" value={data.security.q5_controlledSubstances} type="boolean"/>
            {data.security.q5_controlledSubstances && <ReviewField label="Explicação" value={data.security.q5_controlledSubstances_exp} fullWidth />}
            <ReviewField label="Busca se envolver em prostituição?" value={data.security.q6_prostitution} type="boolean"/>
            {data.security.q6_prostitution && <ReviewField label="Explicação" value={data.security.q6_prostitution_exp} fullWidth />}
            <ReviewField label="Busca se envolver em lavagem de dinheiro?" value={data.security.q7_moneyLaundering} type="boolean"/>
            {data.security.q7_moneyLaundering && <ReviewField label="Explicação" value={data.security.q7_moneyLaundering_exp} fullWidth />}
            <ReviewField label="Já cometeu crime de tráfico de pessoas?" value={data.security.q8_humanTrafficking} type="boolean"/>
            {data.security.q8_humanTrafficking && <ReviewField label="Explicação" value={data.security.q8_humanTrafficking_exp} fullWidth />}
            <ReviewField label="Já ajudou crime de tráfico de pessoas?" value={data.security.q9_aidedHumanTrafficking} type="boolean"/>
            {data.security.q9_aidedHumanTrafficking && <ReviewField label="Explicação" value={data.security.q9_aidedHumanTrafficking_exp} fullWidth />}
            <ReviewField label="Beneficiou-se de atividades de tráfico?" value={data.security.q10_benefitedHumanTrafficking} type="boolean"/>
            {data.security.q10_benefitedHumanTrafficking && <ReviewField label="Explicação" value={data.security.q10_benefitedHumanTrafficking_exp} fullWidth />}
            <ReviewField label="Busca se envolver em espionagem?" value={data.security.q11_espionage} type="boolean"/>
            {data.security.q11_espionage && <ReviewField label="Explicação" value={data.security.q11_espionage_exp} fullWidth />}
            <ReviewField label="Busca se envolver em atividades terroristas?" value={data.security.q12_terroristActivities} type="boolean"/>
            {data.security.q12_terroristActivities && <ReviewField label="Explicação" value={data.security.q12_terroristActivities_exp} fullWidth />}
            <ReviewField label="Já forneceu apoio a terroristas?" value={data.security.q13_terroristSupport} type="boolean"/>
            {data.security.q13_terroristSupport && <ReviewField label="Explicação" value={data.security.q13_terroristSupport_exp} fullWidth />}
            <ReviewField label="É membro de organização terrorista?" value={data.security.q14_terroristMember} type="boolean"/>
            {data.security.q14_terroristMember && <ReviewField label="Explicação" value={data.security.q14_terroristMember_exp} fullWidth />}
            <ReviewField label="É familiar de indivíduo terrorista?" value={data.security.q15_terroristFamily} type="boolean"/>
            {data.security.q15_terroristFamily && <ReviewField label="Explicação" value={data.security.q15_terroristFamily_exp} fullWidth />}
            <ReviewField label="Já participou de genocídio?" value={data.security.q16_genocide} type="boolean"/>
            {data.security.q16_genocide && <ReviewField label="Explicação" value={data.security.q16_genocide_exp} fullWidth />}
            <ReviewField label="Já cometeu tortura?" value={data.security.q17_torture} type="boolean"/>
            {data.security.q17_torture && <ReviewField label="Explicação" value={data.security.q17_torture_exp} fullWidth />}
            <ReviewField label="Já cometeu assassinatos extrajudiciais?" value={data.security.q18_extrajudicialKilling} type="boolean"/>
            {data.security.q18_extrajudicialKilling && <ReviewField label="Explicação" value={data.security.q18_extrajudicialKilling_exp} fullWidth />}
            <ReviewField label="Já recrutou crianças-soldado?" value={data.security.q19_childSoldiers} type="boolean"/>
            {data.security.q19_childSoldiers && <ReviewField label="Explicação" value={data.security.q19_childSoldiers_exp} fullWidth />}
            <ReviewField label="Realizou violações da liberdade religiosa?" value={data.security.q20_religiousFreedomViolation} type="boolean"/>
            {data.security.q20_religiousFreedomViolation && <ReviewField label="Explicação" value={data.security.q20_religiousFreedomViolation_exp} fullWidth />}
            <ReviewField label="Envolvido em controles populacionais?" value={data.security.q21_populationControls} type="boolean"/>
            {data.security.q21_populationControls && <ReviewField label="Explicação" value={data.security.q21_populationControls_exp} fullWidth />}
            <ReviewField label="Envolvido em transplante coercitivo de órgãos?" value={data.security.q22_organTransplantation} type="boolean"/>
            {data.security.q22_organTransplantation && <ReviewField label="Explicação" value={data.security.q22_organTransplantation_exp} fullWidth />}
            <ReviewField label="Busca obter visto por fraude?" value={data.security.q23_visaFraud} type="boolean"/>
            {data.security.q23_visaFraud && <ReviewField label="Explicação" value={data.security.q23_visaFraud_exp} fullWidth />}
            <ReviewField label="Já foi removido ou deportado?" value={data.security.q24_deported} type="boolean"/>
            {data.security.q24_deported && <ReviewField label="Explicação" value={data.security.q24_deported_exp} fullWidth />}
            <ReviewField label="Já reteve custódia de criança cidadã dos EUA?" value={data.security.q25_childCustody} type="boolean"/>
            {data.security.q25_childCustody && <ReviewField label="Explicação" value={data.security.q25_childCustody_exp} fullWidth />}
            <ReviewField label="Já votou ilegalmente nos EUA?" value={data.security.q26_voted} type="boolean"/>
            {data.security.q26_voted && <ReviewField label="Explicação" value={data.security.q26_voted_exp} fullWidth />}
            <ReviewField label="Já renunciou à cidadania para evitar impostos?" value={data.security.q27_renouncedCitizenship} type="boolean"/>
            {data.security.q27_renouncedCitizenship && <ReviewField label="Explicação" value={data.security.q27_renouncedCitizenship_exp} fullWidth />}
          </ReviewSection>
        )}

        <div className="flex justify-between items-center mt-8">
          <button
            onClick={prevSection}
            className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium transition-colors disabled:opacity-50"
          >
            ← Voltar
          </button>
          <div className="text-center flex-1 px-4">
            <p className="text-sm text-gray-700 mb-4">Ao clicar em "Confirmar e Enviar", você confirma que todas as informações fornecidas são verdadeiras e corretas.</p>
            {qaBlocking ? (
              <div className="mb-4 p-3 rounded-lg bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm">
                {qaBlocking}
              </div>
            ) : null}

            {qaResult?.flags?.length ? (
              <div className="mb-4 p-3 rounded-lg bg-white border border-gray-200 text-left">
                <div className="font-semibold text-sm mb-2">Pendências encontradas</div>
                <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
                  {qaResult.flags.slice(0, 12).map((f, i) => (
                    <li key={i}>
                      <span className="font-medium">{f.section}</span>
                      {f.field ? ` • ${f.field}` : ""}: {f.message}
                    </li>
                  ))}
                </ul>
                {qaResult.flags.length > 12 ? (
                  <div className="text-xs text-gray-500 mt-2">
                    Mostrando 12 de {qaResult.flags.length}. Corrija as principais e re-envie.
                  </div>
                ) : null}
              </div>
            ) : null}

            <label className="flex items-start gap-2 mb-4 text-sm text-gray-800">
              <input
                type="checkbox"
                className="mt-1"
                checked={humanApproved}
                onChange={(e) => setHumanApproved(e.target.checked)}
              />
              <span>
                Confirmo que a revisão humana foi realizada e que os dados serão enviados com fidelidade ao que o cliente declarou.
              </span>
            </label>

            <Button onClick={handleSubmit} disabled={isSubmitting} variant="default" className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl">
              {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : null}
              Confirmar e Enviar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}