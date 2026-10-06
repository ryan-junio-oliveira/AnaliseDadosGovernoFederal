/**
 * Plano Brasil 2040 — conteúdo editorial.
 *
 * REGRA DE OURO (anti-desinformação): nenhum número aqui é inventado.
 * Todo DADO traz valor + ano + fonte + link. Metas e propostas são
 * marcadas como tal e nunca apresentadas como fatos.
 */

export const TIPOS = {
  DADO: { rotulo: "Dado", cor: "#10B981", desc: "Informação observada em fonte oficial." },
  PROPOSTA: { rotulo: "Proposta", cor: "#0E7CB5", desc: "Medida sugerida pelo plano. Não é política vigente." },
  META: { rotulo: "Meta", cor: "#D9A821", desc: "Objetivo proposto. Não é previsão." },
  SIMULACAO: { rotulo: "Simulação", cor: "#7C5CBF", desc: "Resultado hipotético de um modelo declarado." },
};

export const INDICADORES = [
  { nome: "População", valor: "203,1 milhões", ano: "2022", fonte: "IBGE · Censo Demográfico", link: "https://www.ibge.gov.br/" },
  { nome: "PIB", valor: "R$ 11,7 tri (+3,4%)", ano: "2024", fonte: "IBGE · Contas Nacionais", link: "https://agenciadenoticias.ibge.gov.br/agencia-sala-de-imprensa/2013-agencia-de-noticias/releases/42774-pib-cresce-3-4-em-2024-e-fecha-o-ano-em-r-11-7-trilhoes" },
  { nome: "PIB per capita", valor: "R$ 55.247", ano: "2024", fonte: "IBGE · Contas Nacionais", link: "https://agenciadenoticias.ibge.gov.br/agencia-sala-de-imprensa/2013-agencia-de-noticias/releases/42774-pib-cresce-3-4-em-2024-e-fecha-o-ano-em-r-11-7-trilhoes" },
  { nome: "Investimento (FBCF/PIB)", valor: "17,0%", ano: "2024", fonte: "IBGE · Contas Nacionais", link: "https://agenciadenoticias.ibge.gov.br/agencia-sala-de-imprensa/2013-agencia-de-noticias/releases/42774-pib-cresce-3-4-em-2024-e-fecha-o-ano-em-r-11-7-trilhoes" },
  { nome: "IPCA em 12 meses", valor: "4,22%", ano: "ago/2026", fonte: "BCB · SGS 433 (via painel)", link: "https://dadosabertos.bcb.gov.br/" },
  { nome: "Selic meta", valor: "13,75% a.a.", ano: "nov/2026", fonte: "BCB · SGS 432 (via painel)", link: "https://dadosabertos.bcb.gov.br/" },
  { nome: "Dólar comercial", valor: "R$ 4,99", ano: "out/2026", fonte: "BCB · SGS 1 (via painel)", link: "https://dadosabertos.bcb.gov.br/" },
  { nome: "Desocupação (PNADc)", valor: "5,4%", ano: "2026-T2", fonte: "IBGE · SIDRA 4099 (via painel)", link: "https://sidra.ibge.gov.br/tabela/4099" },
  { nome: "Dívida bruta (DBGG)", valor: "82,9% do PIB", ano: "ago/2026", fonte: "BCB · SGS 13762 (via painel)", link: "https://dadosabertos.bcb.gov.br/" },
  { nome: "PISA matemática", valor: "379 pts (OCDE: 472)", ano: "2022", fonte: "OCDE · PISA", link: "https://www.oecd.org/pisa/" },
  { nome: "Homicídios", valor: "42.590", ano: "2024", fonte: "Ipea/FBSP · Atlas da Violência 2026", link: "https://forumseguranca.org.br/publicacoes/atlas-da-violencia/" },
  { nome: "Expectativa de vida", valor: "76,4 anos", ano: "2023", fonte: "IBGE · Tábua de Mortalidade", link: "https://agenciadenoticias.ibge.gov.br/agencia-noticias/2012-agencia-de-noticias/noticias/41984-em-2023-expectativa-de-vida-chega-aos-76-4-anos-e-supera-patamar-pre-pandemia" },
];

export const DESAFIOS = [
  { area: "Economia", icon: "fa-chart-line", pontos: ["Produtividade estagnada há décadas", "Juros reais entre os maiores do mundo", "Dívida bruta acima de 80% do PIB", "Investimento em 17% do PIB, abaixo do necessário", "Sistema tributário complexo e litigioso", "Alta informalidade no mercado de trabalho"] },
  { area: "Educação", icon: "fa-graduation-cap", pontos: ["PISA matemática 379 vs 472 da OCDE (2022)", "Alfabetização incompleta na idade certa", "Baixa cobertura de ensino técnico", "Déficit de professores em exatas", "Universidades fora das primeiras posições globais"] },
  { area: "Saúde", icon: "fa-heart-pulse", pontos: ["Filas para consultas, exames e cirurgias", "Baixa cobertura de prevenção e atenção primária", "Gestão fragmentada entre União, estados e municípios", "Prontuários em papel em grande parte da rede", "Envelhecimento acelerado da população"] },
  { area: "Segurança", icon: "fa-shield-halved", pontos: ["42,6 mil homicídios em 2024", "Crime organizado com atuação transnacional", "Sistema prisional superlotado e faccionado", "Fronteiras extensas e porosas", "Explosão de crimes digitais e estelionatos"] },
  { area: "Infraestrutura", icon: "fa-road", pontos: ["Matriz de transportes dependente de rodovias", "Malha ferroviária pequena e desconectada", "Portos com custo e tempo elevados", "Saneamento longe da universalização", "Gargalos logísticos encarecem exportações"] },
  { area: "Tecnologia", icon: "fa-microchip", pontos: ["Baixo investimento privado em P&D", "Ausência na cadeia de semicondutores", "Adoção lenta de IA na indústria e no Estado", "Fuga de cérebros em áreas STEM", "Pesquisa desconectada do setor produtivo"] },
  { area: "Indústria", icon: "fa-industry", pontos: ["Perda de participação no PIB em 40 anos", "Baixo valor agregado nas exportações", "Custo Brasil: energia, logística e tributos", "Integração frágil às cadeias globais"] },
  { area: "Meio ambiente", icon: "fa-leaf", pontos: ["Desmatamento ilegal persistente", "Pressão climática sobre agricultura e energia", "Rios urbanos degradados", "Transição energética incompleta no transporte"] },
];

export const MISSOES = [
  { n: "01", nome: "Educação", titulo: "Escola de nível mundial", icon: "fa-graduation-cap", cor: "#0E7CB5", objetivo: "Levar a aprendizagem brasileira ao pelotão de cima do PISA até 2040.", projetos: ["Alfabetização plena até os 7 anos", "Matemática como prioridade nacional", "Escola em tempo integral", "Ensino técnico em larga escala", "Carreira e salário de professores", "Universidades de excelência", "Robótica, programação e inglês", "Educação financeira no currículo"] },
  { n: "02", nome: "Saúde", titulo: "SUS 2.0", icon: "fa-heart-pulse", cor: "#10B981", objetivo: "Zerar filas evitáveis com dados, prevenção e telemedicina.", projetos: ["Prontuário eletrônico nacional", "Atenção primária resolutiva", "Telemedicina regulada", "Diagnóstico precoce (câncer, crônicos)", "Produção nacional de medicamentos", "Biotecnologia e vacinas", "Gestão por resultados e custos"] },
  { n: "03", nome: "Segurança", titulo: "Brasil Seguro", icon: "fa-shield-halved", cor: "#64748B", objetivo: "Reduzir homicídios de forma sustentada, dentro da Constituição.", projetos: ["Inteligência e integração de bases", "Asfixia financeira do crime organizado", "Controle de fronteiras e armas", "Investigação e perícia", "Sistema prisional com trabalho e ressocialização", "Combate a crimes digitais"], nota: "Todas as medidas respeitam Constituição, direitos fundamentais e devido processo legal." },
  { n: "04", nome: "Economia", titulo: "Brasil Produtivo", icon: "fa-chart-line", cor: "#D9A821", objetivo: "Produtividade como motor de renda, consumo, investimento e arrecadação.", projetos: ["Burocracia zero para abrir empresas", "Digitalização total de serviços", "Crédito barato via concorrência", "Abertura comercial gradual", "Segurança jurídica e agências fortes"] },
  { n: "05", nome: "Indústria", titulo: "Indústria Brasil 2040", icon: "fa-industry", cor: "#7C5CBF", objetivo: "Subir na cadeia de valor: do minério ao produto tecnológico.", projetos: ["IA aplicada à indústria", "Semicondutores (empacotamento e design)", "Robótica e automação", "Fármacos e biotecnologia", "Aeroespacial e defesa", "Mineração com processamento local", "Agritech e máquinas agrícolas"] },
  { n: "06", nome: "Infraestrutura", titulo: "Brasil Conectado", icon: "fa-road", cor: "#D96C1E", objetivo: "Logística que barateia exportar e viajar pelo país.", projetos: ["Ferrovias troncais (Norte–Sul, Leste–Oeste)", "Portos eficientes e dragagem", "Hidrovias do Arco Norte", "Aeroportos regionais", "Data centers e fibra no interior", "Corredores logísticos integrados"] },
  { n: "07", nome: "Energia", titulo: "Potência limpa", icon: "fa-bolt", cor: "#0E9F6E", objetivo: "Energia abundante, barata e majoritariamente limpa.", projetos: ["Solar e eólica em escala", "Hidrelétricas com reservatórios", "Nuclear de nova geração", "Biomassa e biocombustíveis", "Armazenamento e redes inteligentes", "Hidrogênio verde", "Petróleo e gás como ponte fiscal"] },
  { n: "08", nome: "Agro", titulo: "Do campo à tecnologia", icon: "fa-wheat-awn", cor: "#65A30D", objetivo: "Exportar menos commodity e mais produto de alto valor.", projetos: ["Agricultura de precisão", "Genética e sementes nacionais", "Fertilizantes domésticos", "Irrigação no Nordeste", "Alimentos processados", "Bioenergia e bioinsumos"] },
  { n: "09", nome: "Clima", titulo: "Desenvolvimento + conservação", icon: "fa-leaf", cor: "#10B981", objetivo: "Zerar o desmatamento ilegal e ganhar com a bioeconomia.", projetos: ["Satélites e fiscalização em tempo real", "Reflorestamento em escala", "Mercado regulado de carbono", "Pagamento por serviços ambientais", "Saneamento e rios limpos"] },
  { n: "10", nome: "Defesa", titulo: "Soberania tecnológica", icon: "fa-satellite", cor: "#334155", objetivo: "Proteger território e dados, gerando tecnologia nacional.", projetos: ["Monitoramento de fronteiras", "Satélites e drones nacionais", "Defesa cibernética", "Indústria de defesa", "Proteção de recursos estratégicos"], nota: "Defesa como proteção territorial + soberania + desenvolvimento tecnológico, sem militarismo." },
];

export const CADEIA_PRODUTIVIDADE = ["PRODUTIVIDADE", "RENDA", "CONSUMO", "INVESTIMENTO", "ARRECADAÇÃO", "SERVIÇOS PÚBLICOS"];
export const CADEIA_VALOR = ["MINÉRIO", "PROCESSAMENTO", "INDÚSTRIA", "TECNOLOGIA", "PRODUTO", "EXPORTAÇÃO"];
export const CADEIA_AGRO = ["AGRICULTURA", "PROCESSAMENTO", "BIOTECNOLOGIA", "INDÚSTRIA", "PRODUTO DE ALTO VALOR", "EXPORTAÇÃO"];
export const CADEIA_FUNDO = ["RECURSOS NATURAIS", "RECEITA EXTRAORDINÁRIA", "FUNDO SOBERANO", "INVESTIMENTOS", "PATRIMÔNIO NACIONAL", "RENDA FUTURA"];
export const ESTADO_FLUXO = ["ESTADO ATUAL", "DIAGNÓSTICO", "REFORMA", "DIGITALIZAÇÃO", "AVALIAÇÃO", "RESULTADO"];

export const FONTES_PAGAMENTO = [
  { nome: "Investimento público", desc: "Orçamento dentro do arcabouço fiscal. Cada projeto precisa de dotação, cronograma e indicador — sem promessa sem fonte.", icon: "fa-landmark" },
  { nome: "Investimento privado", desc: "Marco regulatório estável e segurança jurídica para o capital produtivo liderar onde o retorno existe.", icon: "fa-briefcase" },
  { nome: "PPPs e concessões", desc: "Ferrovias, portos, rodovias, saneamento e energia: risco alocado a quem sabe gerir, com contratos fiscalizados.", icon: "fa-handshake" },
  { nome: "BNDES", desc: "Crédito de longo prazo para indústria, inovação e infraestrutura, com avaliação pública de impacto.", icon: "fa-building-columns" },
  { nome: "Mercado de capitais", desc: "Debêntures incentivadas, fundos de infraestrutura e bolsas para PMEs acessarem investimento.", icon: "fa-arrow-trend-up" },
  { nome: "Eficiência do Estado", desc: "Digitalização e combate ao desperdício liberam recursos — mas nenhum valor é prometido sem estudo que o sustente.", icon: "fa-gauge-high" },
  { nome: "Crescimento com arrecadação", desc: "PIB maior amplia a base tributária sem subir alíquotas. Projeções sempre com premissas declaradas.", icon: "fa-coins" },
];

export const TIMELINE = [
  { fase: "Primeiros 100 dias", itens: ["Diagnóstico completo por ministério", "Auditoria de programas e obras paradas", "Digitalização dos 100 serviços mais usados", "Definição oficial dos indicadores do plano"] },
  { fase: "Anos 1–2", itens: ["Reformas estruturais (tributária, administrativa)", "Alfabetização e tempo integral", "Integração das forças de segurança", "Leilões de infraestrutura e ambiente de negócios"] },
  { fase: "Anos 3–4", itens: ["Grandes projetos nacionais em obra", "Expansão do ensino técnico", "Polos de indústria e tecnologia", "Universalização do prontuário eletrônico"] },
  { fase: "Anos 5–10", itens: ["Consolidação da produtividade", "Inovação e exportações de valor", "Ferrovias e portos operando", "Queda sustentada da violência"] },
  { fase: "2035–2040", itens: ["Brasil entre as economias avançadas em renda, educação e inovação", "Revisão decenal com nova linha de base"] },
];

export const METAS_Q = [
  { area: "Saneamento", objetivo: "Rumo à universalização (Marco Legal 14.026/2020: 99% água, 90% esgoto até 2033)", base: "DADO: cobertura parcial (ver SNIS)" },
  { area: "Educação", objetivo: "Aproximar o PISA da média OCDE, partindo de 379 em matemática (2022)", base: "DADO: OCDE/PISA 2022" },
  { area: "Investimento", objetivo: "Elevar FBCF/PIB dos 17,0% (2024) ao patamar de economias que crescem 4%+", base: "DADO: IBGE 2024" },
  { area: "Segurança", objetivo: "Queda sustentada de homicídios desde 42.590 (2024), com metas anuais públicas", base: "DADO: Atlas 2026" },
  { area: "Dívida", objetivo: "Trajetória cadente da DBGG desde 82,9% do PIB, sem calote inflacionário", base: "DADO: BCB ago/2026" },
  { area: "Vida", objetivo: "Expectativa de vida rumo a 80 anos, desde 76,4 (2023)", base: "DADO: IBGE" },
];

export const METAS_QUALI = [
  "Instituições auditáveis, com avaliação pública de cada programa",
  "Serviços 100% digitais com identidade única",
  "Ciência conectada à indústria, com metas de patentes e doutores",
  "Inserção competitiva em cadeias globais de valor",
];

export const RISCOS = [
  { proposta: "Ajuste fiscal rápido", beneficios: "Juros menores, dívida cadente", custos: "Contração de curto prazo", riscos: "Recessão se calibrado errado", condicao: "Proteger investimento e saúde/educação no desenho" },
  { proposta: "Privatizações e concessões", beneficios: "Eficiência e investimento privado", custos: "Tarifas e desemprego setorial", riscos: "Contratos mal desenhados viram subsídio privado", condicao: "Agências independentes + competição real" },
  { proposta: "Industrialização dirigida", beneficios: "Empregos de qualidade, tecnologia", custos: "Subsídios e reserva de mercado", riscos: "Captura por lobbies, campeões ineficientes", condicao: "Metas de produtividade com cláusula de saída" },
  { proposta: "Expansão do crédito público", beneficios: "Investimento de longo prazo", custos: "Subsídio implícito (equalização)", riscos: "Inadimplência e politização do crédito", condicao: "Transparência total e avaliação de impacto" },
  { proposta: "Tolerância zero ao crime", beneficios: "Queda rápida da violência", custos: "Encarceramento em massa", riscos: "Violações de direitos e facções mais fortes", condicao: "Inteligência + devido processo + ressocialização" },
];

export const FONTES_TRANSP = [
  { fonte: "IBGE", uso: "PIB, população, desemprego, expectativa de vida", link: "https://www.ibge.gov.br/" },
  { fonte: "Banco Central", uso: "IPCA, Selic, dólar, dívida, NFSP", link: "https://dadosabertos.bcb.gov.br/" },
  { fonte: "Ipea + FBSP", uso: "Atlas da Violência (homicídios)", link: "https://forumseguranca.org.br/publicacoes/atlas-da-violencia/" },
  { fonte: "OCDE", uso: "PISA educação", link: "https://www.oecd.org/pisa/" },
  { fonte: "Tesouro Nacional", uso: "Resultado fiscal, SICONFI", link: "https://www.tesourotransparente.gov.br/" },
];

export const MONITOR = [
  { area: "Educação", medir: "Alfabetização aos 7 anos; PISA a cada edição", status: "base" },
  { area: "Saneamento", medir: "% com água e esgoto (SNIS)", status: "base" },
  { area: "Segurança", medir: "Homicídios/100 mil (Atlas anual)", status: "base" },
  { area: "Investimento", medir: "FBCF/PIB (IBGE trimestral)", status: "base" },
  { area: "Dívida", medir: "DBGG % do PIB (BCB mensal)", status: "base" },
  { area: "Tecnologia", medir: "P&D/PIB; patentes; IA na indústria", status: "base" },
];
