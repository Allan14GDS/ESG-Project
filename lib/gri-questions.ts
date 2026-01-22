export interface GRIQuestion {
  disclosure: string
  pergunta: string
  tipoResposta: string
  evidenciaNecessaria: string | null
}

export const griQuestions: GRIQuestion[] = [
  // 2-1 Detalhes organizacionais (9 questões)
  {
    disclosure: "2-1 Detalhes organizacionais",
    pergunta: "Informe a razão social",
    tipoResposta: "Texto",
    evidenciaNecessaria: "Contrato social",
  },
  {
    disclosure: "2-1 Detalhes organizacionais",
    pergunta: "Informe a forma jurídica",
    tipoResposta: "Texto",
    evidenciaNecessaria: "Estatuto",
  },
  {
    disclosure: "2-1 Detalhes organizacionais",
    pergunta: "Informe o endereço da sede",
    tipoResposta: "Texto",
    evidenciaNecessaria: "Registro oficial",
  },
  {
    disclosure: "2-1 Detalhes organizacionais",
    pergunta: "Informe o CNPJ da sede",
    tipoResposta: "Número",
    evidenciaNecessaria: "Registro oficial",
  },
  {
    disclosure: "2-1 Detalhes organizacionais",
    pergunta: "Possui quantas filiais",
    tipoResposta: "Número",
    evidenciaNecessaria: "Registro oficial",
  },
  {
    disclosure: "2-1 Detalhes organizacionais",
    pergunta: "Informe o endereço da FILIAL 1",
    tipoResposta: "Texto",
    evidenciaNecessaria: "Registro oficial",
  },
  {
    disclosure: "2-1 Detalhes organizacionais",
    pergunta: "Informe o CNPJ da FILIAL 1",
    tipoResposta: "Número",
    evidenciaNecessaria: null,
  },
  {
    disclosure: "2-1 Detalhes organizacionais",
    pergunta: "Informe o endereço da FILIAL 2",
    tipoResposta: "Texto",
    evidenciaNecessaria: "Registro oficial",
  },
  {
    disclosure: "2-1 Detalhes organizacionais",
    pergunta: "Informe o CNPJ da FILIAL 2",
    tipoResposta: "Número",
    evidenciaNecessaria: null,
  },

  // 2-2 Entidades incluídas no relato (1 questão)
  {
    disclosure: "2-2 Entidades incluídas no relato",
    pergunta: "Liste entidades incluídas no relatório de sustentabilidade",
    tipoResposta: "Texto",
    evidenciaNecessaria: "DF consolidado",
  },

  // 2-3 Período de relato (2 questões)
  {
    disclosure: "2-3 Período de relato",
    pergunta: "Informe o período de início do relato",
    tipoResposta: "DATA",
    evidenciaNecessaria: "Relatório anterior",
  },
  {
    disclosure: "2-3 Período de relato",
    pergunta: "Informe o período de término do relato",
    tipoResposta: "DATA",
    evidenciaNecessaria: "Relatório anterior",
  },

  // 2-4 Reapresentações de informação (1 questão)
  {
    disclosure: "2-4 Reapresentações de informação",
    pergunta: "Descreva informações reapresentadas e motivos",
    tipoResposta: "Texto",
    evidenciaNecessaria: "Nota explicativa",
  },

  // 2-5 Asseguração externa (1 questão)
  {
    disclosure: "2-5 Asseguração externa",
    pergunta: "Indique se houve asseguração externa (sim/não)",
    tipoResposta: "Sim/Não",
    evidenciaNecessaria: "Relatório de asseguração",
  },

  // 2-7 Empregados (23 questões - matriz demográfica completa)
  {
    disclosure: "2-7 Empregados",
    pergunta: "Mulheres Brancas Até 30 anos",
    tipoResposta: "Número",
    evidenciaNecessaria: "Folha de pagamento / HRIS",
  },
  {
    disclosure: "2-7 Empregados",
    pergunta: "Mulheres Brancas 30 a 50 anos",
    tipoResposta: "Número",
    evidenciaNecessaria: "Folha de pagamento / HRIS",
  },
  {
    disclosure: "2-7 Empregados",
    pergunta: "Mulheres Brancas 50+ anos",
    tipoResposta: "Número",
    evidenciaNecessaria: "Folha de pagamento / HRIS",
  },
  {
    disclosure: "2-7 Empregados",
    pergunta: "Mulheres Negras Até 30 anos",
    tipoResposta: "Número",
    evidenciaNecessaria: "Folha de pagamento / HRIS",
  },
  {
    disclosure: "2-7 Empregados",
    pergunta: "Mulheres Negras 30 a 50 anos",
    tipoResposta: "Número",
    evidenciaNecessaria: "Folha de pagamento / HRIS",
  },
  {
    disclosure: "2-7 Empregados",
    pergunta: "Mulheres Negras 50+ anos",
    tipoResposta: "Número",
    evidenciaNecessaria: "Folha de pagamento / HRIS",
  },
  {
    disclosure: "2-7 Empregados",
    pergunta: "Mulheres Indígenas Até 30 anos",
    tipoResposta: "Número",
    evidenciaNecessaria: "Folha de pagamento / HRIS",
  },
  {
    disclosure: "2-7 Empregados",
    pergunta: "Mulheres Indígenas 30 a 50 anos",
    tipoResposta: "Número",
    evidenciaNecessaria: "Folha de pagamento / HRIS",
  },
  {
    disclosure: "2-7 Empregados",
    pergunta: "Mulheres Indígenas 50+ anos",
    tipoResposta: "Número",
    evidenciaNecessaria: "Folha de pagamento / HRIS",
  },
  {
    disclosure: "2-7 Empregados",
    pergunta: "Mulheres OUTROs",
    tipoResposta: "Número",
    evidenciaNecessaria: "Folha de pagamento / HRIS",
  },
  {
    disclosure: "2-7 Empregados",
    pergunta: "Homens Brancos Até 30 anos",
    tipoResposta: "Número",
    evidenciaNecessaria: "Folha de pagamento / HRIS",
  },
  {
    disclosure: "2-7 Empregados",
    pergunta: "Homens Brancos  30 a 50 anos",
    tipoResposta: "Número",
    evidenciaNecessaria: "Folha de pagamento / HRIS",
  },
  {
    disclosure: "2-7 Empregados",
    pergunta: "Homens Brancos  50+ anos",
    tipoResposta: "Número",
    evidenciaNecessaria: "Folha de pagamento / HRIS",
  },
  {
    disclosure: "2-7 Empregados",
    pergunta: "Homens Negros Até 30 anos",
    tipoResposta: "Número",
    evidenciaNecessaria: "Folha de pagamento / HRIS",
  },
  {
    disclosure: "2-7 Empregados",
    pergunta: "Homens Negros 30 a 50 anos",
    tipoResposta: "Número",
    evidenciaNecessaria: "Folha de pagamento / HRIS",
  },
  {
    disclosure: "2-7 Empregados",
    pergunta: "Homens Negros 50+ anos",
    tipoResposta: "Número",
    evidenciaNecessaria: "Folha de pagamento / HRIS",
  },
  {
    disclosure: "2-7 Empregados",
    pergunta: "Homens Indígenas Até 30 anos",
    tipoResposta: "Número",
    evidenciaNecessaria: "Folha de pagamento / HRIS",
  },
  {
    disclosure: "2-7 Empregados",
    pergunta: "Homens Indígenas 30 a 50 anos",
    tipoResposta: "Número",
    evidenciaNecessaria: "Folha de pagamento / HRIS",
  },
  {
    disclosure: "2-7 Empregados",
    pergunta: "Homens Indígenas 50+ anos",
    tipoResposta: "Número",
    evidenciaNecessaria: "Folha de pagamento / HRIS",
  },
  {
    disclosure: "2-7 Empregados",
    pergunta: "NÃO BINÁRIO",
    tipoResposta: "Número",
    evidenciaNecessaria: "Folha de pagamento / HRIS",
  },

  // 2-8 Trabalhadores não empregados (3 questões)
  {
    disclosure: "2-8 Trabalhadores não empregados",
    pergunta: "Número de terceirizados",
    tipoResposta: "Número",
    evidenciaNecessaria: "Contratos de prestação de serviço",
  },
  {
    disclosure: "2-8 Trabalhadores não empregados",
    pergunta: "Número de autônomos vinculados",
    tipoResposta: "Número",
    evidenciaNecessaria: "Contratos de prestação de serviço",
  },
  {
    disclosure: "2-8 Trabalhadores não empregados",
    pergunta: "Número de temporários",
    tipoResposta: "Número",
    evidenciaNecessaria: "RH / Compras",
  },

  // 2-9 Estrutura e composição da governança (21 questões)
  {
    disclosure: "2-9 Estrutura e composição da governança",
    pergunta: "Informe nº total de membros do mais alto órgão de governança",
    tipoResposta: "Número",
    evidenciaNecessaria: "Estatuto / Atas",
  },
  {
    disclosure: "2-9 Estrutura e composição da governança",
    pergunta:
      "Informe nº de membros independentes (alguém que não é executivo da empresa, não é funcionário, não é acionista controlador, não presta serviços pagos, não tem parentesco com gestores etc. É uma figura criada para garantir imparcialidade e supervisão objetiva.)",
    tipoResposta: "Número",
    evidenciaNecessaria: "Estatuto / Atas",
  },
  {
    disclosure: "2-9 Estrutura e composição da governança",
    pergunta: "Liste os comitês existentes e suas funções (Auditoria, Remuneração, Sustentabilidade etc.)",
    tipoResposta: "Texto",
    evidenciaNecessaria: "Regimento interno / Atas",
  },
  {
    disclosure: "2-9 Estrutura e composição da governança",
    pergunta: "Competências representadas no colegiado (Finanças, ESG, Jurídico, Operações etc.)",
    tipoResposta: "Texto",
    evidenciaNecessaria: "Currículos / Matriz de competências",
  },
  {
    disclosure: "2-9 Estrutura e composição da governança",
    pergunta: "Mulheres Brancas Até 30 anos",
    tipoResposta: "Número",
    evidenciaNecessaria: "Atas / RH",
  },
  {
    disclosure: "2-9 Estrutura e composição da governança",
    pergunta: "Mulheres Brancas 30 a 50 anos",
    tipoResposta: "Número",
    evidenciaNecessaria: "Atas / RH",
  },
  {
    disclosure: "2-9 Estrutura e composição da governança",
    pergunta: "Mulheres Brancas 50+ anos",
    tipoResposta: "Número",
    evidenciaNecessaria: "Atas / RH",
  },
  {
    disclosure: "2-9 Estrutura e composição da governança",
    pergunta: "Mulheres Negras Até 30 anos",
    tipoResposta: "Número",
    evidenciaNecessaria: "Atas / RH",
  },
  {
    disclosure: "2-9 Estrutura e composição da governança",
    pergunta: "Mulheres Negras 30 a 50 anos",
    tipoResposta: "Número",
    evidenciaNecessaria: "Atas / RH",
  },
  {
    disclosure: "2-9 Estrutura e composição da governança",
    pergunta: "Mulheres Negras 50+ anos",
    tipoResposta: "Número",
    evidenciaNecessaria: "Atas / RH",
  },
  {
    disclosure: "2-9 Estrutura e composição da governança",
    pergunta: "Mulheres Indígenas Até 30 anos",
    tipoResposta: "Número",
    evidenciaNecessaria: "Atas / RH",
  },
  {
    disclosure: "2-9 Estrutura e composição da governança",
    pergunta: "Mulheres Indígenas 30 a 50 anos",
    tipoResposta: "Número",
    evidenciaNecessaria: "Atas / RH",
  },
  {
    disclosure: "2-9 Estrutura e composição da governança",
    pergunta: "Mulheres Indígenas 50+ anos",
    tipoResposta: "Número",
    evidenciaNecessaria: "Atas / RH",
  },
  {
    disclosure: "2-9 Estrutura e composição da governança",
    pergunta: "Homens Brancos Até 30 anos",
    tipoResposta: "Número",
    evidenciaNecessaria: "Atas / RH",
  },
  {
    disclosure: "2-9 Estrutura e composição da governança",
    pergunta: "Homens Brancos 30 a 50 anos",
    tipoResposta: "Número",
    evidenciaNecessaria: "Atas / RH",
  },
  {
    disclosure: "2-9 Estrutura e composição da governança",
    pergunta: "Homens Brancos 50+ anos",
    tipoResposta: "Número",
    evidenciaNecessaria: "Atas / RH",
  },
  {
    disclosure: "2-9 Estrutura e composição da governança",
    pergunta: "Homens Negros Até 30 anos",
    tipoResposta: "Número",
    evidenciaNecessaria: "Atas / RH",
  },
  {
    disclosure: "2-9 Estrutura e composição da governança",
    pergunta: "Homens Negros 30 a 50 anos",
    tipoResposta: "Número",
    evidenciaNecessaria: "Atas / RH",
  },
  {
    disclosure: "2-9 Estrutura e composição da governança",
    pergunta: "Homens Negros 50+ anos",
    tipoResposta: "Número",
    evidenciaNecessaria: "Atas / RH",
  },
  {
    disclosure: "2-9 Estrutura e composição da governança",
    pergunta: "Homens Indígenas Até 30 anos",
    tipoResposta: "Número",
    evidenciaNecessaria: "Atas / RH",
  },
  {
    disclosure: "2-9 Estrutura e composição da governança",
    pergunta: "Homens Indígenas 30 a 50 anos",
    tipoResposta: "Número",
    evidenciaNecessaria: "Atas / RH",
  },
  {
    disclosure: "2-9 Estrutura e composição da governança",
    pergunta: "Homens Indígenas 50+ anos",
    tipoResposta: "Número",
    evidenciaNecessaria: "Atas / RH",
  },
  {
    disclosure: "2-9 Estrutura e composição da governança",
    pergunta: "Não Binário – detalhar cor/idade (obrigatório)",
    tipoResposta: "Número",
    evidenciaNecessaria: "Atas / RH",
  },

  // 2-10 Indicação e seleção (5 questões)
  {
    disclosure: "2-10 Indicação e seleção",
    pergunta:
      "Descreva o processo de nomeação/eleição do mais alto órgão de governança (informe quem conduz o processo (assembleia de acionistas, diretoria, comitê de nomeação), quais critérios são considerados (experiência, competências, independência, diversidade), e como ocorre a eleição (prazo de mandato, possibilidade de reeleição, registro em ata).)",
    tipoResposta: "Texto",
    evidenciaNecessaria: "Política de nomeação / Estatuto / Atas",
  },
  {
    disclosure: "2-10 Indicação e seleção",
    pergunta:
      "Informe critérios de elegibilidade/seleção aplicados aos membros (ex.: experiência, formação, independência)",
    tipoResposta: "Texto",
    evidenciaNecessaria: "Política de nomeação / Regimento",
  },
  {
    disclosure: "2-10 Indicação e seleção",
    pergunta: "Existe política de diversidade aplicada ao processo de seleção? (Sim/Não)",
    tipoResposta: "Sim/Não",
    evidenciaNecessaria: "Política de diversidade / Atas",
  },
  {
    disclosure: "2-10 Indicação e seleção",
    pergunta:
      "Se SIM, descreva quais aspectos de diversidade são considerados (gênero, raça, idade, experiência, outros)",
    tipoResposta: "Texto",
    evidenciaNecessaria: "Política de diversidade / Regimento",
  },
  {
    disclosure: "2-10 Indicação e seleção",
    pergunta: "Se Não, Justifique obrigatóriamente e aponte metas e compromissos, incluindo datas.",
    tipoResposta: "Texto",
    evidenciaNecessaria: "Política de diversidade / Regimento",
  },

  // 2-11 Presidência do mais alto órgão de governança (2 questões)
  {
    disclosure: "2-11 Presidência do mais alto órgão de governança",
    pergunta: "O presidente do mais alto órgão de governança também exerce função executiva?",
    tipoResposta: "Sim/Não",
    evidenciaNecessaria: "Estatuto / Organograma / Atas",
  },
  {
    disclosure: "2-11 Presidência do mais alto órgão de governança",
    pergunta:
      "Se sim, descreva quais mecanismos asseguram independência (ex.: lead independent director, comitês independentes)",
    tipoResposta: "Texto",
    evidenciaNecessaria: "Estatuto / Política de governança",
  },

  // 2-12 Supervisão da gestão de impactos (5 questões)
  {
    disclosure: "2-12 Supervisão da gestão de impactos",
    pergunta: "Existe comitê ou instância dedicada a supervisionar impactos ESG?",
    tipoResposta: "Sim/Não",
    evidenciaNecessaria: "Estatuto / Regimento de comitês",
  },
  {
    disclosure: "2-12 Supervisão da gestão de impactos",
    pergunta: "Se Não, Justifique obrigatóriamente e aponte metas e compromissos, incluindo datas.",
    tipoResposta: "Texto",
    evidenciaNecessaria: "Estatuto / Regimento de comitês",
  },
  {
    disclosure: "2-12 Supervisão da gestão de impactos",
    pergunta: "O mais alto órgão de governança recebe relatórios sobre impactos ESG?",
    tipoResposta: "Sim/Não",
    evidenciaNecessaria: "Atas de reuniões / Relatórios de sustentabilidade",
  },
  {
    disclosure: "2-12 Supervisão da gestão de impactos",
    pergunta: "Se sim, qual a frequência de reporte (mensal, trimestral, anual)?",
    tipoResposta: "Texto",
    evidenciaNecessaria: "Calendário anual de reporte",
  },
  {
    disclosure: "2-12 Supervisão da gestão de impactos",
    pergunta:
      "Descreva os principais temas ESG acompanhados pelo órgão de governança (ex.: mudanças climáticas, direitos humanos, compliance, diversidade).",
    tipoResposta: "Texto",
    evidenciaNecessaria: "Relatórios periódicos / Atas",
  },

  // 2-13 Delegação de responsabilidades (4 questões)
  {
    disclosure: "2-13 Delegação de responsabilidades",
    pergunta: "Há delegação formal de responsabilidades sobre impactos ESG para a administração?",
    tipoResposta: "Sim/Não",
    evidenciaNecessaria: "Política de governança / Organograma",
  },
  {
    disclosure: "2-13 Delegação de responsabilidades",
    pergunta: "Se sim, indique o nível hierárquico responsável (ex.: diretoria, gerência, coordenação)",
    tipoResposta: "Texto",
    evidenciaNecessaria: "Organograma / Estatuto",
  },
  {
    disclosure: "2-13 Delegação de responsabilidades",
    pergunta:
      "Descreva como é feita a supervisão das responsabilidades delegadas (ex.: relatórios, comitês, reuniões periódicas)",
    tipoResposta: "Texto",
    evidenciaNecessaria: "Atas / Relatórios de acompanhamento",
  },
  {
    disclosure: "2-13 Delegação de responsabilidades",
    pergunta: "Existe integração dessas responsabilidades em metas e indicadores de desempenho?",
    tipoResposta: "Sim/Não",
    evidenciaNecessaria: "Plano estratégico / Avaliação de desempenho",
  },

  // 2-14 Papel no relato de sustentabilidade (4 questões)
  {
    disclosure: "2-14 Papel no relato de sustentabilidade",
    pergunta: "O mais alto órgão de governança revisa o relatório de sustentabilidade antes da publicação?",
    tipoResposta: "Sim/Não",
    evidenciaNecessaria: "Atas / Cronograma",
  },
  {
    disclosure: "2-14 Papel no relato de sustentabilidade",
    pergunta:
      "Caso a resposta seja Não, explique como o processo de revisão é conduzido (ex.: responsabilidade da diretoria de sustentabilidade, comitê executivo, consultoria externa)",
    tipoResposta: "Texto",
    evidenciaNecessaria: "Política de reporte / Relatórios internos",
  },
  {
    disclosure: "2-14 Papel no relato de sustentabilidade",
    pergunta: "O mais alto órgão de governança aprova formalmente o relatório de sustentabilidade?",
    tipoResposta: "Sim/Não",
    evidenciaNecessaria: "Atas de aprovação",
  },
  {
    disclosure: "2-14 Papel no relato de sustentabilidade",
    pergunta: "Descreva quais etapas do processo de relato contam com participação do órgão de governança (se houver)",
    tipoResposta: "Texto",
    evidenciaNecessaria: "Cronograma de relato / Relatórios internos",
  },

  // 2-15 Conflitos de interesse (4 questões)
  {
    disclosure: "2-15 Conflitos de interesse",
    pergunta: "Existe política formal de conflitos de interesse?",
    tipoResposta: "Sim/Não",
    evidenciaNecessaria: "Política de conflitos / Código de conduta",
  },
  {
    disclosure: "2-15 Conflitos de interesse",
    pergunta:
      "Caso a resposta seja Não, explique como o tema é tratado na prática (ex.: declaração anual, cláusulas em contratos, decisão caso a caso)",
    tipoResposta: "Texto",
    evidenciaNecessaria: "Declarações anuais / Atas de reunião",
  },
  {
    disclosure: "2-15 Conflitos de interesse",
    pergunta:
      "Quais mecanismos a organização utiliza para identificar e prevenir conflitos (ex.: autodeclaração anual, auditoria interna, sistema de compliance)",
    tipoResposta: "Texto",
    evidenciaNecessaria: "Relatórios de compliance / Código de ética",
  },
  {
    disclosure: "2-15 Conflitos de interesse",
    pergunta: "Informe o nº de casos de conflito de interesse reportados no período",
    tipoResposta: "Número",
    evidenciaNecessaria: "Registros de compliance / Ouvidoria",
  },

  // 2-16 Comunicação de preocupações críticas (5 questões)
  {
    disclosure: "2-16 Comunicação de preocupações críticas",
    pergunta: "Existem canais formais para comunicação de preocupações críticas (ex.: ouvidoria, hotline, compliance)?",
    tipoResposta: "Sim/Não",
    evidenciaNecessaria: "Política de ouvidoria / Código de ética",
  },
  {
    disclosure: "2-16 Comunicação de preocupações críticas",
    pergunta: "Caso a resposta seja Não, explique como preocupações críticas chegam até o órgão de governança",
    tipoResposta: "Texto",
    evidenciaNecessaria: "Registros internos",
  },
  {
    disclosure: "2-16 Comunicação de preocupações críticas",
    pergunta:
      "Informe a frequência com que as preocupações críticas são reportadas ao órgão de governança (mensal, trimestral, anual, ad hoc)",
    tipoResposta: "Texto",
    evidenciaNecessaria: "Atas de reunião / Calendário de reporte",
  },
  {
    disclosure: "2-16 Comunicação de preocupações críticas",
    pergunta: "Informe o nº de casos críticos reportados ao órgão de governança no período",
    tipoResposta: "Número",
    evidenciaNecessaria: "Relatórios de ouvidoria / Compliance",
  },
  {
    disclosure: "2-16 Comunicação de preocupações críticas",
    pergunta:
      "Descreva como as preocupações críticas são tratadas após a comunicação (ex.: investigação interna, auditoria, plano de ação)",
    tipoResposta: "Texto",
    evidenciaNecessaria: "Relatórios de apuração / Atas",
  },

  // 2-17 Conhecimento coletivo (6 questões)
  {
    disclosure: "2-17 Conhecimento coletivo",
    pergunta: "O órgão de governança possui competências formais registradas (ex.: matriz de competências)?",
    tipoResposta: "Sim/Não",
    evidenciaNecessaria: "Matriz de competências / Relatório anual",
  },
  {
    disclosure: "2-17 Conhecimento coletivo",
    pergunta:
      "Descreva as principais competências coletivas do colegiado (ex.: finanças, jurídico, ESG, operações, tecnologia)",
    tipoResposta: "Texto",
    evidenciaNecessaria: "Matriz de competências / Currículos",
  },
  {
    disclosure: "2-17 Conhecimento coletivo",
    pergunta: "Foram realizados treinamentos de capacitação para membros do órgão de governança no período?",
    tipoResposta: "Sim/Não",
    evidenciaNecessaria: "Relatórios de RH / Atas de treinamento",
  },
  {
    disclosure: "2-17 Conhecimento coletivo",
    pergunta: "Informe o nº de treinamentos realizados sobre ESG, riscos e finanças",
    tipoResposta: "Número",
    evidenciaNecessaria: "Relatórios de RH / Certificados",
  },
  {
    disclosure: "2-17 Conhecimento coletivo",
    pergunta: "Informe o total de horas de capacitação dos membros no período",
    tipoResposta: "Número",
    evidenciaNecessaria: "Registros de treinamento / RH",
  },
  {
    disclosure: "2-17 Conhecimento coletivo",
    pergunta: "Caso não tenham ocorrido treinamentos, explique como a empresa garante atualização dos membros",
    tipoResposta: "Texto",
    evidenciaNecessaria: "Atas / Planos de governança",
  },

  // 2-18 Avaliação de desempenho (6 questões)
  {
    disclosure: "2-18 Avaliação de desempenho",
    pergunta: "Existe processo formal de avaliação de desempenho do órgão de governança?",
    tipoResposta: "Sim/Não",
    evidenciaNecessaria: "Política de governança / Relatório de avaliação",
  },
  {
    disclosure: "2-18 Avaliação de desempenho",
    pergunta: "Caso a resposta seja Não, explique como o desempenho do órgão de governança é acompanhado na prática",
    tipoResposta: "Texto",
    evidenciaNecessaria: "Atas / Registros internos",
  },
  {
    disclosure: "2-18 Avaliação de desempenho",
    pergunta: "Informe a periodicidade da avaliação (ex.: anual, bienal)",
    tipoResposta: "Texto",
    evidenciaNecessaria: "Política de governança / Relatórios de avaliação",
  },
  {
    disclosure: "2-18 Avaliação de desempenho",
    pergunta: "Quais critérios são considerados na avaliação (ex.: financeiros, ESG, governança, gestão de riscos)",
    tipoResposta: "Texto",
    evidenciaNecessaria: "Instrumento de avaliação / Relatórios",
  },
  {
    disclosure: "2-18 Avaliação de desempenho",
    pergunta: "Os resultados da avaliação são utilizados em planos de ação ou em decisões de remuneração?",
    tipoResposta: "Sim/Não",
    evidenciaNecessaria: "Relatórios de avaliação / Planos de ação",
  },
  {
    disclosure: "2-18 Avaliação de desempenho",
    pergunta:
      "Descreva de que forma os resultados da avaliação são utilizados (ex.: ajustes em governança, desenvolvimento de membros, definição de metas)",
    tipoResposta: "Texto",
    evidenciaNecessaria: "Relatórios de avaliação / Atas do conselho",
  },

  // 2-19 Políticas de remuneração (4 questões)
  {
    disclosure: "2-19 Políticas de remuneração",
    pergunta: "Existe política formal de remuneração da organização?",
    tipoResposta: "Sim/Não",
    evidenciaNecessaria: "Política de remuneração / Estatuto",
  },
  {
    disclosure: "2-19 Políticas de remuneração",
    pergunta: "Caso a resposta seja Não, explique como a remuneração é definida na prática",
    tipoResposta: "Texto",
    evidenciaNecessaria: "Atas / Registros internos",
  },
  {
    disclosure: "2-19 Políticas de remuneração",
    pergunta:
      "Descreva os principais componentes da remuneração (fixa, variável, bônus, incentivos de longo prazo, ESG-linked)",
    tipoResposta: "Texto",
    evidenciaNecessaria: "Política de remuneração / Relatórios anuais",
  },
  {
    disclosure: "2-19 Políticas de remuneração",
    pergunta: "Informe a abrangência da política (ex.: empregados, alta administração, conselheiros)",
    tipoResposta: "Texto",
    evidenciaNecessaria: "Política de remuneração / Estatuto",
  },

  // 2-20 Processo para determinar remuneração (4 questões)
  {
    disclosure: "2-20 Processo para determinar remuneração",
    pergunta: "Existe processo formal para determinar remuneração do mais alto órgão de governança e da diretoria?",
    tipoResposta: "Sim/Não",
    evidenciaNecessaria: "Política de remuneração / Regimento",
  },
  {
    disclosure: "2-20 Processo para determinar remuneração",
    pergunta: "Caso a resposta seja Não, explique como a remuneração é definida na prática",
    tipoResposta: "Texto",
    evidenciaNecessaria: "Atas / Registros internos",
  },
  {
    disclosure: "2-20 Processo para determinar remuneração",
    pergunta:
      "Indique quais órgãos/instâncias participam da definição da remuneração (ex.: comitê de remuneração, assembleia, conselho)",
    tipoResposta: "Texto",
    evidenciaNecessaria: "Atas de comitês / Estatuto",
  },
  {
    disclosure: "2-20 Processo para determinar remuneração",
    pergunta: "Informe se são utilizados benchmarks ou consultorias externas para definir remuneração",
    tipoResposta: "Sim/Não",
    evidenciaNecessaria: "Relatórios de consultoria / Estudos de mercado",
  },

  // 2-21 Razão de compensação total anual (3 questões)
  {
    disclosure: "2-21 Razão de compensação total anual",
    pergunta:
      "Informe a razão entre a remuneração total anual do CEO (ou posição equivalente) e a mediana da remuneração dos empregados",
    tipoResposta: "Número",
    evidenciaNecessaria: "Relatórios de remuneração / Folha de pagamento",
  },
  {
    disclosure: "2-21 Razão de compensação total anual",
    pergunta: "Informe a variação dessa razão em relação ao ano anterior",
    tipoResposta: "%",
    evidenciaNecessaria: "Relatórios anuais / Folha de pagamento",
  },
  {
    disclosure: "2-21 Razão de compensação total anual",
    pergunta: "Descreva a metodologia utilizada para o cálculo da razão de remuneração",
    tipoResposta: "Texto",
    evidenciaNecessaria: "Relatórios anuais / Documento metodológico",
  },

  // 2-22 Declaração sobre estratégia (2 questões)
  {
    disclosure: "2-22 Declaração sobre estratégia",
    pergunta: "Existe declaração formal da administração sobre desenvolvimento sustentável?",
    tipoResposta: "Sim/Não",
    evidenciaNecessaria: "Relatório anual / Mensagem do CEO",
  },
  {
    disclosure: "2-22 Declaração sobre estratégia",
    pergunta: "Transcreva ou anexe a declaração do mais alto executivo sobre sustentabilidade",
    tipoResposta: "Texto",
    evidenciaNecessaria: "Relatório de sustentabilidade / Apresentação institucional",
  },

  // 2-23 Compromissos de política (2 questões)
  {
    disclosure: "2-23 Compromissos de política",
    pergunta:
      "Liste os principais compromissos e políticas da organização (ex.: direitos humanos, clima, anticorrupção)",
    tipoResposta: "Texto",
    evidenciaNecessaria: "Políticas internas / Adesões públicas",
  },
  {
    disclosure: "2-23 Compromissos de política",
    pergunta:
      "Informe se os compromissos se alinham a normas ou iniciativas internacionais (ex.: Pacto Global, OIT, OCDE)",
    tipoResposta: "Texto",
    evidenciaNecessaria: "Políticas / Adesões",
  },

  // 2-24 Incorporação dos compromissos (2 questões)
  {
    disclosure: "2-24 Incorporação dos compromissos",
    pergunta:
      "Explique como os compromissos são incorporados nas operações (ex.: treinamentos, metas, controles internos)",
    tipoResposta: "Texto",
    evidenciaNecessaria: "Registros de treinamento / Auditorias",
  },
  {
    disclosure: "2-24 Incorporação dos compromissos",
    pergunta: "Existem indicadores para monitorar aderência às políticas?",
    tipoResposta: "Sim/Não",
    evidenciaNecessaria: "Relatórios de auditoria / KPIs ESG",
  },

  // 2-25 Processos de remediação (3 questões)
  {
    disclosure: "2-25 Processos de remediação",
    pergunta: "Existem processos formais para remediar impactos negativos?",
    tipoResposta: "Sim/Não",
    evidenciaNecessaria: "Procedimentos internos / Política de remediação",
  },
  {
    disclosure: "2-25 Processos de remediação",
    pergunta: "Caso a resposta seja Sim, descreva os processos de remediação aplicados",
    tipoResposta: "Texto",
    evidenciaNecessaria: "Relatórios de compliance / Casos resolvidos",
  },
  {
    disclosure: "2-25 Processos de remediação",
    pergunta: "Informe exemplos de casos relevantes de remediação no período",
    tipoResposta: "Texto",
    evidenciaNecessaria: "Relatórios de sustentabilidade",
  },

  // 2-26 Mecanismos de aconselhamento e denúncia (5 questões)
  {
    disclosure: "2-26 Mecanismos de aconselhamento e denúncia",
    pergunta: "Existem canais formais de aconselhamento e denúncia (ex.: ética, direitos humanos, trabalhista)?",
    tipoResposta: "Sim/Não",
    evidenciaNecessaria: "Política de denúncia / Canais de ouvidoria",
  },
  {
    disclosure: "2-26 Mecanismos de aconselhamento e denúncia",
    pergunta:
      "Se a resposta for NÃO. Justifique e descreva se há metas e compromissos para implementação, incluindo datas.",
    tipoResposta: "Texto",
    evidenciaNecessaria: null,
  },
  {
    disclosure: "2-26 Mecanismos de aconselhamento e denúncia",
    pergunta: "Se a resposta for SIM. Descreva os canais formais de aconselhamento e denúncia.",
    tipoResposta: "Texto",
    evidenciaNecessaria: "Política de denúncia / Canais de ouvidoria",
  },
  {
    disclosure: "2-26 Mecanismos de aconselhamento e denúncia",
    pergunta: "Informe se os canais permitem anonimato e proteção contra retaliação",
    tipoResposta: "Sim/Não",
    evidenciaNecessaria: "Política de ouvidoria",
  },
  {
    disclosure: "2-26 Mecanismos de aconselhamento e denúncia",
    pergunta: "Informe nº de casos recebidos por esses canais no período",
    tipoResposta: "Número",
    evidenciaNecessaria: "Relatório de ouvidoria / Compliance",
  },

  // 2-27 Conformidade com leis e regulamentos (2 questões)
  {
    disclosure: "2-27 Conformidade com leis e regulamentos",
    pergunta: "Houve casos de não conformidade significativos com leis e regulamentos no período?",
    tipoResposta: "Sim/Não",
    evidenciaNecessaria: "Registros jurídicos / Relatórios de auditoria",
  },
  {
    disclosure: "2-27 Conformidade com leis e regulamentos",
    pergunta: "Caso a resposta seja Sim, descreva os casos, áreas afetadas e medidas corretivas adotadas",
    tipoResposta: "Texto",
    evidenciaNecessaria: "Relatórios de compliance / Documentos legais",
  },

  // 2-28 Filiação a associações (2 questões)
  {
    disclosure: "2-28 Filiação a associações",
    pergunta: "Liste associações e organizações das quais a empresa é membro",
    tipoResposta: "Texto",
    evidenciaNecessaria: "Cadastro institucional / Comprovantes de filiação",
  },
  {
    disclosure: "2-28 Filiação a associações",
    pergunta: "Informe se a participação é ativa (ex.: assento em comitê, contribuição financeira)",
    tipoResposta: "Texto",
    evidenciaNecessaria: "Atas / Relatórios institucionais",
  },

  // 2-29 Engajamento de stakeholders (7 questões)
  {
    disclosure: "2-29 Engajamento de stakeholders",
    pergunta: "Existe processo formal de identificação de stakeholders relevantes?",
    tipoResposta: "Sim/Não",
    evidenciaNecessaria: "Política de engajamento / Relatório de sustentabilidade",
  },
  {
    disclosure: "2-29 Engajamento de stakeholders",
    pergunta:
      "Se NÃO existe processo formal de identificação de stakeholders relevantes. Justifique e aponte metas e compromissos com data para implementação.",
    tipoResposta: "Texto",
    evidenciaNecessaria: null,
  },
  {
    disclosure: "2-29 Engajamento de stakeholders",
    pergunta:
      "Descreva a metodologia usada para identificar stakeholders (ex.: mapeamento, matriz de influência/interesse)",
    tipoResposta: "Texto",
    evidenciaNecessaria: "Mapeamento de Stakeholder",
  },
  {
    disclosure: "2-29 Engajamento de stakeholders",
    pergunta:
      "Liste os principais grupos de stakeholders identificados (ex.: colaboradores, comunidades, clientes, fornecedores, governo, investidores) ou anexe o mapeamento de stakeholders",
    tipoResposta: "Texto/Upload",
    evidenciaNecessaria: "Relatório de sustentabilidade",
  },
  {
    disclosure: "2-29 Engajamento de stakeholders",
    pergunta:
      "Informe os métodos de engajamento utilizados (ex.: consultas públicas, pesquisas de satisfação, fóruns de diálogo, reuniões periódicas)",
    tipoResposta: "Texto",
    evidenciaNecessaria: "Atas / Pesquisas / Relatórios",
  },
  {
    disclosure: "2-29 Engajamento de stakeholders",
    pergunta: "Quais foram os principais temas levantados pelos stakeholders no período?",
    tipoResposta: "Texto",
    evidenciaNecessaria: "Relatórios de engajamento / Atas",
  },
  {
    disclosure: "2-29 Engajamento de stakeholders",
    pergunta: "Como a organização respondeu a esses temas?",
    tipoResposta: "Texto",
    evidenciaNecessaria: "Planos de ação / Relatório de sustentabilidade",
  },

  // 2-30 Acordos coletivos (4 questões)
  {
    disclosure: "2-30 Acordos coletivos",
    pergunta: "Qual % da força de trabalho está coberta por acordos de negociação coletiva?",
    tipoResposta: "%",
    evidenciaNecessaria: "Convenções coletivas / Acordos sindicais",
  },
  {
    disclosure: "2-30 Acordos coletivos",
    pergunta:
      "Se não for 100 % da força de trabalho coberta por acordos de negociação coletiva, justificativa obrigatória",
    tipoResposta: "Texto",
    evidenciaNecessaria: "Convenções coletivas / Acordos sindicais",
  },
  {
    disclosure: "2-30 Acordos coletivos",
    pergunta: "Liste os sindicatos ou entidades representativas com acordos vigentes",
    tipoResposta: "Texto",
    evidenciaNecessaria: "Acordos coletivos / Registros sindicais",
  },
  {
    disclosure: "2-30 Acordos coletivos",
    pergunta:
      "Descreva os principais tópicos tratados nos acordos coletivos (ex.: benefícios, jornada, condições de trabalho)",
    tipoResposta: "Texto",
    evidenciaNecessaria: "Acordos coletivos / Relatórios de RH",
  },
]

export function getDisclosureQuestions(disclosureCode: string): GRIQuestion[] {
  return griQuestions.filter((q) => q.disclosure.startsWith(disclosureCode))
}

export function getAllDisclosures(): string[] {
  const disclosures = new Set<string>()
  griQuestions.forEach((q) => disclosures.add(q.disclosure))
  return Array.from(disclosures).sort()
}

export function getDisclosureCode(disclosure: string): string {
  return disclosure.split(" ")[0] // Ex: "2-1" de "2-1 Detalhes organizacionais"
}

export function getDisclosureResponses(disclosureCode: string): Record<string, string> {
  const savedAnswers = localStorage.getItem(`gri-answers-${disclosureCode}`)
  return savedAnswers ? JSON.parse(savedAnswers) : {}
}

export function saveDisclosureResponses(disclosureCode: string, responses: Record<string, string>): void {
  localStorage.setItem(`gri-answers-${disclosureCode}`, JSON.stringify(responses))
}
