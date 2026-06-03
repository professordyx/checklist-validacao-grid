import { useState, useMemo, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { FileDown, CheckCircle2, AlertTriangle, XCircle, MinusCircle, ClipboardList, Shield, TestTube, Monitor, Layers, ChevronRight, HelpCircle, X, FileText, Upload, Download, Gauge, History, RotateCcw, Trash2, Eye } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";

type Status = "conforme" | "parcial" | "nconforme" | "na" | null;

interface CheckItem {
  id: string;
  label: string;
  help: string;
  howToCheck: string;
  guidingQuestion: string;
  weight: number; // 1=baixo, 2=médio, 3=crítico
  status: Status;
  evidence: string;
}

interface Block {
  id: string;
  title: string;
  icon: React.ReactNode;
  items: CheckItem[];
}

const initialBlocks: Block[] = [
  {
    id: "bloco1",
    title: "Alinhamento e Requisitos (DSR)",
    icon: <Layers className="w-5 h-5" />,
    items: [
      {
        id: "A1",
        label: "Problema organizacional e proposta de valor estão explicitados no protótipo.",
        help: "O protótipo deve deixar claro qual problema organizacional ele resolve e qual valor entrega ao usuário final. Isso deve estar visível na interface ou na documentação do projeto.",
        howToCheck: "Abra a tela inicial ou a documentação do projeto. Verifique se há uma declaração explícita do problema e da proposta de valor. Pergunte: um usuário novo entenderia o propósito do sistema em 30 segundos?",
        guidingQuestion: "Onde no protótipo o problema e a proposta de valor estão declarados? Qual evidência comprova isso?",
        weight: 3, status: null, evidence: ""
      },
      {
        id: "A2",
        label: "Tipo de artefato declarado (instanciação, modelo, método ou constructo).",
        help: "Na Design Science Research, o artefato deve ser classificado. Uma instanciação é um sistema funcional; um modelo é uma representação abstrata; um método é um conjunto de passos; um constructo é um vocabulário ou conceito.",
        howToCheck: "Verifique na documentação do projeto se o tipo de artefato está declarado. Confirme se a classificação é coerente com o que foi desenvolvido (ex: se é um app funcional, deve ser 'instanciação').",
        guidingQuestion: "Qual tipo de artefato DSR este protótipo representa? Onde essa classificação está documentada?",
        weight: 2, status: null, evidence: ""
      },
      {
        id: "A3",
        label: "Arquitetura-alvo definida e separação de camadas (Front/Back) implementada.",
        help: "O protótipo deve ter uma arquitetura clara com separação entre a interface do usuário (front-end) e a lógica de negócio/dados (back-end). Isso garante manutenibilidade e testabilidade.",
        howToCheck: "Examine a estrutura de pastas do projeto. Verifique se há diretórios separados para front-end e back-end. Confirme que a interface não acessa o banco de dados diretamente.",
        guidingQuestion: "Como está organizada a arquitetura? Há separação clara entre camadas? Descreva a estrutura.",
        weight: 3, status: null, evidence: ""
      },
      {
        id: "A4",
        label: "Requisitos funcionais principais decompostos em tarefas verificáveis.",
        help: "Os requisitos funcionais devem estar quebrados em tarefas menores que possam ser testadas individualmente. Exemplo: 'O usuário pode criar uma conta' é verificável; 'O sistema é bom' não é.",
        howToCheck: "Consulte o backlog ou lista de requisitos. Cada requisito deve ter critérios de aceitação claros. Tente executar cada um e verificar se passa ou falha de forma objetiva.",
        guidingQuestion: "Quantos requisitos funcionais foram identificados? Todos possuem critérios de aceitação objetivos?",
        weight: 2, status: null, evidence: ""
      },
      {
        id: "A5",
        label: "Requisitos não funcionais listados (desempenho, usabilidade, acessibilidade).",
        help: "Além das funcionalidades, o sistema deve atender a critérios de qualidade: tempo de resposta aceitável, interface intuitiva e acessível a pessoas com deficiência.",
        howToCheck: "Verifique se há documentação listando requisitos não funcionais. Teste: a página carrega em menos de 3 segundos? O contraste de cores atende WCAG? A navegação por teclado funciona?",
        guidingQuestion: "Quais requisitos não funcionais foram definidos? Há métricas mensuráveis para cada um?",
        weight: 2, status: null, evidence: ""
      },
    ],
  },
  {
    id: "bloco2",
    title: "Testes Unitários e Domínio",
    icon: <TestTube className="w-5 h-5" />,
    items: [
      {
        id: "B1", weight: 3,
        label: "Campos obrigatórios rejeitam valores vazios ou malformados.",
        help: "Formulários devem validar entradas. Campos obrigatórios não podem aceitar strings vazias, e campos de e-mail devem rejeitar formatos inválidos.",
        howToCheck: "Tente submeter formulários com campos vazios. Insira dados inválidos (ex: 'abc' em campo de e-mail, caracteres especiais em campos numéricos). O sistema deve exibir mensagem de erro clara.",
        guidingQuestion: "Quais campos foram testados? O sistema exibe mensagens de erro adequadas para cada tipo de entrada inválida?",
        status: null, evidence: ""
      },
      {
        id: "B2", weight: 3,
        label: "Regras de negócio (cálculos, scores, lógicas condicionais) funcionam isoladamente.",
        help: "As regras de negócio são a lógica central do sistema. Elas devem funcionar corretamente independente da interface. Exemplo: se o sistema calcula um score, o cálculo deve estar correto para diferentes entradas.",
        howToCheck: "Identifique as regras de negócio principais. Teste com valores conhecidos e compare com o resultado esperado. Use testes unitários automatizados (Jest, Vitest, pytest) se disponíveis.",
        guidingQuestion: "Quais regras de negócio foram testadas? Os resultados conferem com os valores esperados? Há testes automatizados?",
        status: null, evidence: ""
      },
      {
        id: "B3", weight: 2,
        label: "Tratamento adequado para ausência de dados (sem quebrar a aplicação).",
        help: "O sistema não pode 'crashar' quando dados estão ausentes. Se um campo opcional está vazio ou uma API não retorna dados, o sistema deve exibir um estado vazio gracioso ou mensagem informativa.",
        howToCheck: "Acesse o sistema com um usuário novo (sem dados). Desconecte a internet e tente usar funcionalidades. Verifique se há telas de 'estado vazio' em vez de erros técnicos.",
        guidingQuestion: "O que acontece quando não há dados? O sistema exibe mensagens amigáveis ou quebra com erro técnico?",
        status: null, evidence: ""
      },
      {
        id: "B4", weight: 2,
        label: "Derivação de scores e métricas produz resultados corretos.",
        help: "Se o sistema gera pontuações, rankings ou métricas derivadas, esses cálculos devem ser precisos e reproduzíveis.",
        howToCheck: "Insira dados de teste com resultado conhecido. Compare o output do sistema com o cálculo manual. Teste com valores extremos (zero, máximo, negativos se aplicável).",
        guidingQuestion: "Quais métricas o sistema calcula? Os resultados foram validados manualmente com dados de teste conhecidos?",
        status: null, evidence: ""
      },
      {
        id: "B5", weight: 1,
        label: "Fallback de tradução (i18n) funciona quando chave não existe.",
        help: "Se o sistema suporta múltiplos idiomas, deve haver um fallback quando uma tradução não existe (ex: exibir em português se a tradução em inglês não foi cadastrada).",
        howToCheck: "Mude o idioma do sistema. Verifique se todos os textos são traduzidos. Se alguma chave não existe, o sistema deve exibir o texto no idioma padrão, não a chave técnica.",
        guidingQuestion: "O sistema suporta i18n? Se sim, o fallback funciona? Se não se aplica, marque N/A.",
        status: null, evidence: ""
      },
      {
        id: "B6", weight: 1,
        label: "Cobertura de código dos módulos de domínio registrada.",
        help: "A cobertura de código indica qual percentual do código é exercitado pelos testes automatizados. Módulos de domínio (regras de negócio) devem ter cobertura alta (idealmente > 80%).",
        howToCheck: "Execute o comando de cobertura (ex: 'npx vitest --coverage' ou 'pytest --cov'). Verifique o relatório gerado. Foque nos módulos de lógica de negócio, não em componentes de UI.",
        guidingQuestion: "Qual é a cobertura de código atual? Quais módulos de domínio estão cobertos? Há relatório disponível?",
        status: null, evidence: ""
      },
    ],
  },
  {
    id: "bloco3",
    title: "Testes Funcionais e E2E (Interface)",
    icon: <Monitor className="w-5 h-5" />,
    items: [
      {
        id: "C1", weight: 3,
        label: "Acesso protegido redireciona corretamente quando não há sessão ativa.",
        help: "Páginas que exigem autenticação devem redirecionar para a tela de login quando o usuário não está logado. Não deve ser possível acessar dados privados sem autenticação.",
        howToCheck: "Abra o navegador em modo anônimo. Tente acessar diretamente uma URL protegida (ex: /dashboard). O sistema deve redirecionar para /login, não exibir erro ou dados parciais.",
        guidingQuestion: "Quais rotas são protegidas? O redirecionamento funciona corretamente em todas elas?",
        status: null, evidence: ""
      },
      {
        id: "C2", weight: 3,
        label: "Fluxo de autenticação (Login/Cadastro/OAuth) operando corretamente.",
        help: "O ciclo completo de autenticação deve funcionar: criar conta, fazer login, manter sessão, fazer logout. Se usa OAuth (Google, GitHub), o fluxo de redirecionamento deve completar sem erros.",
        howToCheck: "Crie uma conta nova. Faça logout. Faça login novamente. Teste o 'esqueci minha senha' se existir. Se há OAuth, teste o fluxo completo de autorização.",
        guidingQuestion: "Todos os métodos de autenticação foram testados? O fluxo completo (cadastro → login → logout) funciona?",
        status: null, evidence: ""
      },
      {
        id: "C3", weight: 3,
        label: "Jornada principal do usuário pode ser concluída do início ao fim.",
        help: "A jornada principal (happy path) é o fluxo mais importante do sistema. Se é um app de vendas, a jornada é: buscar produto → adicionar ao carrinho → finalizar compra. Este fluxo deve funcionar sem interrupções.",
        howToCheck: "Identifique a jornada principal. Execute-a do início ao fim como um usuário real faria. Documente cada passo. Verifique se todos os dados são salvos corretamente ao final.",
        guidingQuestion: "Qual é a jornada principal? Ela pode ser completada sem erros do início ao fim? Quais passos foram executados?",
        status: null, evidence: ""
      },
      {
        id: "C4", weight: 2,
        label: "Funcionalidade de autossave opera sem perda de dados.",
        help: "Se o sistema salva automaticamente (sem botão 'Salvar'), os dados não podem ser perdidos. O autossave deve funcionar mesmo com conexão instável e não deve conflitar com outras operações.",
        howToCheck: "Preencha um formulário longo. Feche a aba sem salvar manualmente. Reabra — os dados devem estar lá. Teste também editando rapidamente e verificando se todas as alterações persistem.",
        guidingQuestion: "O autossave está implementado? Os dados persistem após fechar e reabrir? Se não se aplica, marque N/A.",
        status: null, evidence: ""
      },
      {
        id: "C5", weight: 2,
        label: "Funcionalidades de IA (avaliação, melhoria, geração) retornam resultados válidos.",
        help: "Se o sistema integra IA (GPT, Gemini, etc.), as respostas devem ser relevantes, formatadas corretamente e exibidas sem erro. O sistema deve tratar timeouts e falhas da API de IA graciosamente.",
        howToCheck: "Acione cada funcionalidade de IA. Verifique se o resultado é relevante e bem formatado. Teste com entradas variadas. Verifique o comportamento quando a IA demora ou falha.",
        guidingQuestion: "Quais funcionalidades de IA existem? Os resultados são relevantes? O sistema trata falhas da API?",
        status: null, evidence: ""
      },
      {
        id: "C6", weight: 1,
        label: "Exportação e impressão funcionam corretamente.",
        help: "Se o sistema permite exportar dados (PDF, CSV, Excel) ou imprimir, o resultado deve conter todos os dados visíveis na tela, formatados adequadamente para o formato de saída.",
        howToCheck: "Exporte em cada formato disponível. Abra o arquivo gerado e compare com os dados na tela. Teste a impressão (Ctrl+P) e verifique se o layout está adequado para papel.",
        guidingQuestion: "Quais formatos de exportação existem? Os arquivos gerados contêm todos os dados corretos?",
        status: null, evidence: ""
      },
      {
        id: "C7", weight: 2,
        label: "Responsividade validada (Desktop e Mobile).",
        help: "O sistema deve funcionar em diferentes tamanhos de tela. Em mobile, os elementos devem se reorganizar sem sobreposição, e todos os botões devem ser clicáveis com o dedo.",
        howToCheck: "Abra o DevTools do navegador (F12) e ative o modo responsivo. Teste em 375px (mobile), 768px (tablet) e 1440px (desktop). Verifique se não há overflow horizontal ou elementos cortados.",
        guidingQuestion: "O layout se adapta corretamente a mobile e tablet? Há elementos cortados ou sobrepostos em telas menores?",
        status: null, evidence: ""
      },
      {
        id: "C8", weight: 2,
        label: "Acessibilidade: sem violações sérias ou críticas (axe/Lighthouse).",
        help: "O sistema deve ser acessível a pessoas com deficiência. Isso inclui: contraste de cores adequado, textos alternativos em imagens, formulários com labels, e navegação por teclado.",
        howToCheck: "Execute o Lighthouse (aba Audits no DevTools) ou a extensão axe DevTools. Verifique o score de acessibilidade. Corrija violações 'critical' e 'serious'. Meta: score ≥ 80.",
        guidingQuestion: "Qual o score de acessibilidade do Lighthouse? Há violações críticas ou sérias? Quais foram corrigidas?",
        status: null, evidence: ""
      },
      {
        id: "C9", weight: 1,
        label: "Navegação por teclado funcional em todos os campos.",
        help: "Usuários devem conseguir usar o sistema apenas com teclado (Tab para navegar, Enter para confirmar, Escape para fechar). Isso é essencial para acessibilidade e produtividade.",
        howToCheck: "Desconecte o mouse. Use apenas Tab, Shift+Tab, Enter e Escape para navegar pelo sistema. Todos os elementos interativos devem receber foco visível e ser acionáveis.",
        guidingQuestion: "É possível completar a jornada principal usando apenas o teclado? Todos os elementos recebem foco visível?",
        status: null, evidence: ""
      },
    ],
  },
  {
    id: "bloco4",
    title: "Segurança e Integração",
    icon: <Shield className="w-5 h-5" />,
    items: [
      {
        id: "D1", weight: 3,
        label: "Nenhuma chave de API exposta no código front-end, HTML ou repositório público.",
        help: "Chaves de API (OpenAI, Supabase service_role, etc.) nunca devem aparecer no código do front-end. Elas devem estar em variáveis de ambiente no servidor. Se expostas, qualquer pessoa pode usar sua conta.",
        howToCheck: "Abra o código-fonte no navegador (Ctrl+U). Busque por 'key', 'secret', 'token', 'sk-'. Verifique o repositório Git: 'git log --all -p | grep -i api_key'. Use o DevTools > Network para ver headers.",
        guidingQuestion: "Foi feita busca por chaves expostas no código-fonte e no histórico Git? Alguma chave foi encontrada?",
        status: null, evidence: ""
      },
      {
        id: "D2", weight: 3,
        label: "Row Level Security (RLS) testada no servidor (não apenas na interface).",
        help: "RLS garante que cada usuário só acessa seus próprios dados no banco. Não basta esconder dados na interface — a proteção deve estar no banco de dados. Sem RLS, um usuário malicioso pode acessar dados de outros.",
        howToCheck: "Faça login como Usuário A. Tente acessar dados do Usuário B via URL direta ou chamada de API (ex: /api/users/B/data). O servidor deve retornar 403 ou dados vazios, nunca os dados de B.",
        guidingQuestion: "O RLS está ativo no banco? Foi testado tentando acessar dados de outro usuário via API direta?",
        status: null, evidence: ""
      },
      {
        id: "D3", weight: 3,
        label: "Controle de permissões (viewer vs. editor) validado contra o banco.",
        help: "Se o sistema tem papéis diferentes (admin, editor, viewer), as permissões devem ser verificadas no servidor. Um viewer não deve conseguir editar dados mesmo manipulando requisições.",
        howToCheck: "Faça login como viewer. Tente enviar uma requisição POST/PUT/DELETE via DevTools > Console (fetch). O servidor deve rejeitar a operação, não apenas a interface esconder o botão.",
        guidingQuestion: "Quais papéis existem? As permissões são verificadas no servidor ou apenas na interface?",
        status: null, evidence: ""
      },
      {
        id: "D4", weight: 2,
        label: "Tratamento de erros para falhas de rede, timeout e rate limit (429).",
        help: "O sistema deve lidar graciosamente com falhas: internet instável, APIs lentas ou bloqueio por excesso de requisições (erro 429). O usuário deve ver mensagens claras, não telas em branco.",
        howToCheck: "Desative a internet no DevTools (Network > Offline). Tente usar o sistema. Ative throttling (Slow 3G). Faça muitas requisições rápidas para testar rate limit. Observe as mensagens exibidas.",
        guidingQuestion: "O que o usuário vê quando a rede falha? Há mensagens de retry? O sistema se recupera quando a conexão volta?",
        status: null, evidence: ""
      },
      {
        id: "D5", weight: 2,
        label: "CORS configurado adequadamente nas funções de borda.",
        help: "CORS (Cross-Origin Resource Sharing) controla quais domínios podem acessar sua API. Se mal configurado, pode bloquear seu próprio front-end ou permitir acesso de qualquer site malicioso.",
        howToCheck: "Verifique os headers de resposta da API (DevTools > Network > Headers). O 'Access-Control-Allow-Origin' deve listar apenas os domínios permitidos, não '*' em produção.",
        guidingQuestion: "O CORS está configurado? Quais origens são permitidas? Está usando '*' (inseguro) ou domínios específicos?",
        status: null, evidence: ""
      },
      {
        id: "D6", weight: 3,
        label: "Autenticação robusta com gestão de sessões implementada.",
        help: "Sessões devem expirar após inatividade. Tokens devem ser armazenados de forma segura (httpOnly cookies, não localStorage). O logout deve invalidar a sessão no servidor.",
        howToCheck: "Faça login e aguarde o tempo de expiração. A sessão deve expirar. Faça logout e tente reusar o token antigo via DevTools — deve ser rejeitado. Verifique onde o token é armazenado.",
        guidingQuestion: "Onde os tokens são armazenados? As sessões expiram? O logout invalida o token no servidor?",
        status: null, evidence: ""
      },
      {
        id: "D7", weight: 2,
        label: "Concorrência de operações (ex: autossave × streaming) sem perda de dados.",
        help: "Se múltiplas operações acontecem simultaneamente (ex: autossave dispara enquanto IA está gerando texto), não pode haver conflito ou perda de dados. As operações devem ser coordenadas.",
        howToCheck: "Inicie uma operação longa (ex: geração de IA). Enquanto ela executa, edite outro campo que dispara autossave. Verifique se ambas as operações completam sem perda de dados.",
        guidingQuestion: "Há operações concorrentes no sistema? Elas foram testadas simultaneamente? Houve perda de dados?",
        status: null, evidence: ""
      },
    ],
  },
  {
    id: "bloco5",
    title: "Avaliação de Contexto (Naturalística)",
    icon: <ClipboardList className="w-5 h-5" />,
    items: [
      {
        id: "E1", weight: 3,
        label: "Construtos e proxies de medida definidos (SUS, TAM, rubrica).",
        help: "Para avaliar se o protótipo resolve o problema, é necessário definir o que será medido e como. SUS mede usabilidade percebida. TAM mede aceitação tecnológica. Rubricas medem qualidade de output.",
        howToCheck: "Verifique se o grupo definiu quais construtos serão medidos e quais instrumentos serão usados. Deve haver pelo menos um instrumento validado (SUS, TAM, UTAUT) ou uma rubrica personalizada.",
        guidingQuestion: "Quais construtos serão medidos? Quais instrumentos foram escolhidos? Há justificativa para a escolha?",
        status: null, evidence: ""
      },
      {
        id: "E2", weight: 2,
        label: "Avaliação heurística concluída (3-5 avaliadores, heurísticas de Nielsen).",
        help: "A avaliação heurística é feita por especialistas (não usuários finais) que inspecionam a interface usando as 10 heurísticas de Nielsen. É rápida, barata e identifica problemas óbvios antes do teste com usuários.",
        howToCheck: "Verifique se 3-5 pessoas avaliaram o protótipo usando as heurísticas de Nielsen. Cada avaliador deve ter produzido uma lista de problemas encontrados, classificados por severidade.",
        guidingQuestion: "Quantos avaliadores participaram? Quais heurísticas foram violadas? Qual a severidade dos problemas encontrados?",
        status: null, evidence: ""
      },
      {
        id: "E3", weight: 3,
        label: "Teste de usabilidade moderado realizado (5-8 participantes, think-aloud).",
        help: "O teste de usabilidade com think-aloud pede que usuários reais verbalizem seus pensamentos enquanto usam o sistema. Isso revela dificuldades que os desenvolvedores não percebem. 5 participantes encontram ~85% dos problemas.",
        howToCheck: "Verifique se houve sessões de teste com 5-8 participantes representativos do público-alvo. Deve haver gravação ou notas das sessões. Os problemas encontrados devem estar documentados.",
        guidingQuestion: "Quantos participantes foram testados? Qual o perfil deles? Quais problemas principais foram identificados?",
        status: null, evidence: ""
      },
      {
        id: "E4", weight: 2,
        label: "SUS médio ≥ 68 (ou justificativa documentada se inferior).",
        help: "O System Usability Scale (SUS) é um questionário de 10 itens que gera um score de 0-100. A média global é 68. Scores abaixo indicam problemas de usabilidade que devem ser corrigidos ou justificados.",
        howToCheck: "Aplique o questionário SUS após o teste de usabilidade. Calcule a média. Se < 68, documente os motivos (ex: funcionalidade complexa por natureza, público técnico) e o plano de melhoria.",
        guidingQuestion: "Qual foi o SUS médio obtido? Se < 68, qual a justificativa? Quais itens tiveram pior avaliação?",
        status: null, evidence: ""
      },
      {
        id: "E5", weight: 2,
        label: "Estudo de campo curto planejado ou executado (2-4 semanas).",
        help: "O estudo de campo coloca o protótipo em uso real por um período. Diferente do teste de usabilidade (sessão única), ele revela problemas que só aparecem com uso continuado (fadiga, abandono, workarounds).",
        howToCheck: "Verifique se há um plano de estudo de campo: quem usará, por quanto tempo, quais métricas serão coletadas (frequência de uso, taxa de abandono, satisfação ao longo do tempo).",
        guidingQuestion: "O estudo de campo foi planejado ou executado? Qual a duração? Quais métricas serão/foram coletadas?",
        status: null, evidence: ""
      },
      {
        id: "E6", weight: 2,
        label: "Riscos à validade identificados e mitigados.",
        help: "Todo estudo tem limitações. Riscos comuns: amostra pequena, viés de seleção, efeito Hawthorne (participantes se comportam diferente por serem observados), falta de grupo controle.",
        howToCheck: "Verifique se o grupo listou os riscos à validade do estudo e as estratégias de mitigação. Exemplo: 'amostra pequena → triangulação com dados de telemetria'.",
        guidingQuestion: "Quais riscos à validade foram identificados? Quais estratégias de mitigação foram planejadas?",
        status: null, evidence: ""
      },
    ],
  },
  {
    id: "bloco6",
    title: "Qualidade e Documentação",
    icon: <FileText className="w-5 h-5" />,
    items: [
      {
        id: "F1", weight: 3,
        label: "README completo com instruções de instalação, execução e deploy.",
        help: "O README é a porta de entrada do projeto. Deve permitir que qualquer desenvolvedor clone o repositório e execute o sistema localmente sem ajuda externa. Inclui: pré-requisitos, passos de instalação, variáveis de ambiente e comandos de execução.",
        howToCheck: "Clone o repositório em uma máquina limpa. Siga apenas as instruções do README. Se conseguir rodar o projeto sem perguntar nada ao autor, está conforme. Se precisou de informação extra, está parcial ou não conforme.",
        guidingQuestion: "É possível instalar e rodar o projeto seguindo apenas o README? Quais informações estão faltando?",
        status: null, evidence: ""
      },
      {
        id: "F2", weight: 1,
        label: "Changelog ou histórico de versões documentado.",
        help: "O changelog registra as mudanças significativas entre versões. Facilita a rastreabilidade e permite entender a evolução do projeto. Pode ser um arquivo CHANGELOG.md ou o histórico de commits organizado.",
        howToCheck: "Verifique se existe um arquivo CHANGELOG.md ou se os commits seguem um padrão (Conventional Commits). Deve ser possível entender o que mudou entre iterações sem ler o código.",
        guidingQuestion: "Existe changelog ou histórico organizado? É possível rastrear as mudanças entre versões do protótipo?",
        status: null, evidence: ""
      },
      {
        id: "F3", weight: 2,
        label: "Padrões de código definidos e aplicados (linter, formatter).",
        help: "Padrões de código garantem consistência. Um linter (ESLint, Pylint) detecta erros e más práticas. Um formatter (Prettier, Black) padroniza a formatação. Ambos devem estar configurados e integrados ao workflow.",
        howToCheck: "Verifique se há arquivos de configuração (.eslintrc, .prettierrc, pyproject.toml). Execute o linter: deve passar sem erros críticos. Verifique se há script no package.json para lint/format.",
        guidingQuestion: "Quais ferramentas de lint/format estão configuradas? O código passa sem erros? Há integração com o CI?",
        status: null, evidence: ""
      },
      {
        id: "F4", weight: 2,
        label: "Estrutura de pastas organizada e coerente com a arquitetura declarada.",
        help: "A organização de pastas deve refletir a arquitetura. Se é MVC, deve haver pastas para models, views e controllers. Se é por features, cada feature deve ter sua pasta com componentes, hooks e testes.",
        howToCheck: "Examine a árvore de diretórios. Compare com a arquitetura declarada na documentação. Verifique se não há arquivos 'soltos' na raiz ou pastas com nomes genéricos como 'utils' com centenas de arquivos.",
        guidingQuestion: "A estrutura de pastas reflete a arquitetura? Há arquivos desorganizados ou pastas genéricas sobrecarregadas?",
        status: null, evidence: ""
      },
      {
        id: "F5", weight: 2,
        label: "Variáveis de ambiente documentadas com exemplo (.env.example).",
        help: "Variáveis de ambiente contêm configurações sensíveis (chaves de API, URLs de banco). Um arquivo .env.example lista todas as variáveis necessárias com valores fictícios, permitindo que novos desenvolvedores configurem o ambiente.",
        howToCheck: "Verifique se existe .env.example na raiz do projeto. Compare com o .env real: todas as variáveis devem estar listadas no example. Nenhum .env real deve estar commitado no Git.",
        guidingQuestion: "Existe .env.example? Todas as variáveis necessárias estão documentadas? O .env real está no .gitignore?",
        status: null, evidence: ""
      },
      {
        id: "F6", weight: 1,
        label: "Comentários em código apenas onde necessário (código autoexplicativo).",
        help: "Código bem escrito é autoexplicativo. Comentários devem explicar o 'porquê', não o 'o quê'. Funções com nomes claros e variáveis descritivas dispensam comentários. Excesso de comentários indica código confuso.",
        howToCheck: "Revise 3-5 arquivos principais. O código é legível sem comentários? Os comentários existentes explicam decisões não óbvias (ex: workarounds, regras de negócio complexas)? Há comentários obsoletos?",
        guidingQuestion: "O código é legível sem comentários excessivos? Os comentários existentes são úteis e atualizados?",
        status: null, evidence: ""
      },
      {
        id: "F7", weight: 2,
        label: "Dependências atualizadas e sem vulnerabilidades conhecidas.",
        help: "Dependências desatualizadas podem conter vulnerabilidades de segurança. O comando 'npm audit' ou 'pip audit' identifica pacotes com CVEs conhecidas. Dependências não utilizadas devem ser removidas.",
        howToCheck: "Execute 'npm audit' (Node) ou 'pip audit' (Python). Verifique se há vulnerabilidades high/critical. Execute 'npx depcheck' para encontrar dependências não utilizadas. Atualize o que for seguro.",
        guidingQuestion: "Quantas vulnerabilidades foram encontradas? Há dependências não utilizadas? O que foi atualizado?",
        status: null, evidence: ""
      },
    ],
  },
];

function getStatusColor(status: Status) {
  switch (status) {
    case "conforme": return "bg-emerald-500/20 text-emerald-400 border-emerald-500/40";
    case "parcial": return "bg-amber-500/20 text-amber-400 border-amber-500/40";
    case "nconforme": return "bg-red-500/20 text-red-400 border-red-500/40";
    case "na": return "bg-zinc-500/20 text-zinc-400 border-zinc-500/40";
    default: return "bg-zinc-800 text-zinc-500 border-zinc-700";
  }
}

function getStatusLabel(status: Status) {
  switch (status) {
    case "conforme": return "Conforme";
    case "parcial": return "Parcial";
    case "nconforme": return "Não Conf.";
    case "na": return "N/A";
    default: return "Pendente";
  }
}

function getStatusIcon(status: Status) {
  switch (status) {
    case "conforme": return <CheckCircle2 className="w-4 h-4" />;
    case "parcial": return <AlertTriangle className="w-4 h-4" />;
    case "nconforme": return <XCircle className="w-4 h-4" />;
    case "na": return <MinusCircle className="w-4 h-4" />;
    default: return null;
  }
}

function HelpPanel({ item, onClose }: { item: CheckItem; onClose: () => void }) {
  return (
    <div className="mt-3 p-4 rounded-lg bg-[oklch(0.2_0.005_285)] border border-[#C41E3A]/20 space-y-3 animate-in fade-in duration-200">
      <div className="flex items-start justify-between gap-2">
        <h4 className="text-sm font-semibold text-[#C41E3A] flex items-center gap-2">
          <HelpCircle className="w-4 h-4" />
          Orientação para o item {item.id}
        </h4>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>
      
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">O que significa</p>
        <p className="text-sm text-foreground/90">{item.help}</p>
      </div>
      
      <div>
        <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1">Como verificar</p>
        <p className="text-sm text-foreground/90">{item.howToCheck}</p>
      </div>
    </div>
  );
}

const STORAGE_KEY = "grid-checklist-state";
const HISTORY_KEY = "grid-checklist-history";

interface Snapshot {
  id: string;
  name: string;
  createdAt: string;
  grupo: string;
  validador: string;
  globalScore: number;
  globalLabel: string;
  blockScores: { id: string; title: string; percentage: number; label: string }[];
  state: SavedState;
}

interface SavedState {
  blocks: { id: string; items: { id: string; status: Status; evidence: string }[] }[];
  validador: string;
  grupo: string;
  data: string;
  arquitetura: string;
  melhorias: string;
  melhoriasBaixa: string;
  conclusao: string;
  lastSaved: string;
}

function loadState(): Partial<SavedState> | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SavedState;
  } catch {
    return null;
  }
}

function hydrateBlocks(saved: SavedState["blocks"] | undefined): Block[] {
  if (!saved) return initialBlocks;
  return initialBlocks.map((block) => {
    const savedBlock = saved.find((sb) => sb.id === block.id);
    if (!savedBlock) return block;
    return {
      ...block,
      items: block.items.map((item) => {
        const savedItem = savedBlock.items.find((si) => si.id === item.id);
        if (!savedItem) return item;
        return { ...item, status: savedItem.status, evidence: savedItem.evidence };
      }),
    };
  });
}

export default function Home() {
  const saved = useMemo(() => loadState(), []);
  const [blocks, setBlocks] = useState<Block[]>(() => hydrateBlocks(saved?.blocks));
  const [activeBlock, setActiveBlock] = useState("bloco1");
  const [validador, setValidador] = useState(saved?.validador || "");
  const [grupo, setGrupo] = useState(saved?.grupo || "");
  const [data, setData] = useState(saved?.data || new Date().toISOString().split("T")[0]);
  const [arquitetura, setArquitetura] = useState(saved?.arquitetura || "");
  const [melhorias, setMelhorias] = useState(saved?.melhorias || "");
  const [melhoriasBaixa, setMelhoriasBaixa] = useState(saved?.melhoriasBaixa || "");
  const [conclusao, setConclusao] = useState(saved?.conclusao || "");
  const [openHelp, setOpenHelp] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [snapshots, setSnapshots] = useState<Snapshot[]>(() => {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  });
  const [snapshotName, setSnapshotName] = useState("");
  const [viewingSnapshot, setViewingSnapshot] = useState<Snapshot | null>(null);

  // Persistência automática no localStorage
  useEffect(() => {
    const state: SavedState = {
      blocks: blocks.map((b) => ({
        id: b.id,
        items: b.items.map((i) => ({ id: i.id, status: i.status, evidence: i.evidence })),
      })),
      validador,
      grupo,
      data,
      arquitetura,
      melhorias,
      melhoriasBaixa,
      conclusao,
      lastSaved: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [blocks, validador, grupo, data, arquitetura, melhorias, melhoriasBaixa, conclusao]);

  const clearSavedData = () => {
    if (window.confirm("Tem certeza que deseja limpar todos os dados preenchidos? Esta a\u00e7\u00e3o n\u00e3o pode ser desfeita.")) {
      localStorage.removeItem(STORAGE_KEY);
      setBlocks(initialBlocks);
      setValidador("");
      setGrupo("");
      setData(new Date().toISOString().split("T")[0]);
      setArquitetura("");
      setMelhorias("");
      setMelhoriasBaixa("");
      setConclusao("");
      toast.success("Dados limpos com sucesso.");
    }
  };

  // --- Histórico de Versões ---
  const saveSnapshot = () => {
    const name = snapshotName.trim() || `Vers\u00e3o ${snapshots.length + 1}`;
    const currentState: SavedState = {
      blocks: blocks.map((b) => ({
        id: b.id,
        items: b.items.map((i) => ({ id: i.id, status: i.status, evidence: i.evidence })),
      })),
      validador, grupo, data, arquitetura, melhorias, melhoriasBaixa, conclusao,
      lastSaved: new Date().toISOString(),
    };
    // Calcular scores por bloco
    const blockScores = blocks.map((block) => {
      const evaluated = block.items.filter((i) => i.status !== null && i.status !== "na");
      if (evaluated.length === 0) return { id: block.id, title: block.title, percentage: 0, label: "Pendente" };
      const maxS = evaluated.reduce((s, i) => s + i.weight * 3, 0);
      const actS = evaluated.reduce((s, i) => s + i.weight * (i.status === "conforme" ? 3 : i.status === "parcial" ? 1.5 : 0), 0);
      const pct = maxS > 0 ? Math.round((actS / maxS) * 100) : 0;
      let label = "Cr\u00edtico";
      if (pct >= 80) label = "Pronto";
      else if (pct >= 60) label = "Quase Pronto";
      else if (pct >= 40) label = "Em Dev.";
      return { id: block.id, title: block.title, percentage: pct, label };
    });
    // Score global
    const allItems = blocks.flatMap((b) => b.items);
    const evaluated = allItems.filter((i) => i.status !== null && i.status !== "na");
    let globalScore = 0;
    let globalLabel = "Pendente";
    if (evaluated.length > 0) {
      const maxS = evaluated.reduce((s, i) => s + i.weight * 3, 0);
      const actS = evaluated.reduce((s, i) => s + i.weight * (i.status === "conforme" ? 3 : i.status === "parcial" ? 1.5 : 0), 0);
      globalScore = maxS > 0 ? Math.round((actS / maxS) * 100) : 0;
      if (globalScore >= 80) globalLabel = "Pronto";
      else if (globalScore >= 60) globalLabel = "Quase Pronto";
      else if (globalScore >= 40) globalLabel = "Em Dev.";
      else globalLabel = "Cr\u00edtico";
    }
    const snapshot: Snapshot = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      name,
      createdAt: new Date().toISOString(),
      grupo: grupo || "\u2014",
      validador: validador || "\u2014",
      globalScore,
      globalLabel,
      blockScores,
      state: currentState,
    };
    const updated = [snapshot, ...snapshots];
    setSnapshots(updated);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    setSnapshotName("");
    toast.success(`Vers\u00e3o "${name}" salva com sucesso!`);
  };

  const restoreSnapshot = (snapshot: Snapshot) => {
    if (!window.confirm(`Restaurar a vers\u00e3o "${snapshot.name}"? Os dados atuais ser\u00e3o substitu\u00eddos.`)) return;
    const hydrated = hydrateBlocks(snapshot.state.blocks);
    setBlocks(hydrated);
    setValidador(snapshot.state.validador || "");
    setGrupo(snapshot.state.grupo || "");
    setData(snapshot.state.data || new Date().toISOString().split("T")[0]);
    setArquitetura(snapshot.state.arquitetura || "");
    setMelhorias(snapshot.state.melhorias || "");
    setMelhoriasBaixa(snapshot.state.melhoriasBaixa || "");
    setConclusao(snapshot.state.conclusao || "");
    setHistoryOpen(false);
    setViewingSnapshot(null);
    toast.success(`Vers\u00e3o "${snapshot.name}" restaurada.`);
  };

  const deleteSnapshot = (id: string) => {
    if (!window.confirm("Excluir esta vers\u00e3o do hist\u00f3rico?")) return;
    const updated = snapshots.filter((s) => s.id !== id);
    setSnapshots(updated);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    toast.success("Vers\u00e3o exclu\u00edda.");
  };

  const stats = useMemo(() => {
    const all = blocks.flatMap((b) => b.items);
    const total = all.length;
    const conforme = all.filter((i) => i.status === "conforme").length;
    const parcial = all.filter((i) => i.status === "parcial").length;
    const nconforme = all.filter((i) => i.status === "nconforme").length;
    const na = all.filter((i) => i.status === "na").length;
    const pendente = all.filter((i) => i.status === null).length;
    const evaluated = total - pendente;
    const progress = total > 0 ? (evaluated / total) * 100 : 0;
    return { total, conforme, parcial, nconforme, na, pendente, progress };
  }, [blocks]);

  const blockStats = useCallback((blockId: string) => {
    const block = blocks.find((b) => b.id === blockId);
    if (!block) return { total: 0, done: 0, progress: 0 };
    const total = block.items.length;
    const done = block.items.filter((i) => i.status !== null).length;
    return { total, done, progress: total > 0 ? (done / total) * 100 : 0 };
  }, [blocks]);

  const blockReadinessScore = useCallback((blockId: string) => {
    const block = blocks.find((b) => b.id === blockId);
    if (!block) return { percentage: 0, label: "Pendente", color: "text-zinc-400", bgColor: "bg-zinc-500/20" };
    const evaluated = block.items.filter((i) => i.status !== null && i.status !== "na");
    if (evaluated.length === 0) return { percentage: 0, label: "Pendente", color: "text-zinc-400", bgColor: "bg-zinc-500/20" };
    const maxScore = evaluated.reduce((sum, i) => sum + i.weight * 3, 0);
    const actualScore = evaluated.reduce((sum, i) => {
      const multiplier = i.status === "conforme" ? 3 : i.status === "parcial" ? 1.5 : 0;
      return sum + i.weight * multiplier;
    }, 0);
    const percentage = maxScore > 0 ? Math.round((actualScore / maxScore) * 100) : 0;
    if (percentage >= 80) return { percentage, label: "Pronto", color: "text-emerald-400", bgColor: "bg-emerald-500/20" };
    if (percentage >= 60) return { percentage, label: "Quase", color: "text-amber-400", bgColor: "bg-amber-500/20" };
    if (percentage >= 40) return { percentage, label: "Em Dev.", color: "text-orange-400", bgColor: "bg-orange-500/20" };
    return { percentage, label: "Cr\u00edtico", color: "text-red-400", bgColor: "bg-red-500/20" };
  }, [blocks]);

  const setItemStatus = (blockId: string, itemId: string, status: Status) => {
    setBlocks((prev) =>
      prev.map((b) =>
        b.id === blockId
          ? { ...b, items: b.items.map((i) => (i.id === itemId ? { ...i, status } : i)) }
          : b
      )
    );
  };

  const setItemEvidence = (blockId: string, itemId: string, evidence: string) => {
    setBlocks((prev) =>
      prev.map((b) =>
        b.id === blockId
          ? { ...b, items: b.items.map((i) => (i.id === itemId ? { ...i, evidence } : i)) }
          : b
      )
    );
  };

  // Score de Prontidão (ponderado por severidade)
  const readinessScore = useMemo(() => {
    const all = blocks.flatMap((b) => b.items);
    const evaluated = all.filter((i) => i.status !== null && i.status !== "na");
    if (evaluated.length === 0) return { score: 0, maxScore: 0, percentage: 0, label: "Pendente", color: "text-zinc-400" };
    const maxScore = evaluated.reduce((sum, i) => sum + i.weight * 3, 0); // max = weight * 3 (conforme)
    const actualScore = evaluated.reduce((sum, i) => {
      const multiplier = i.status === "conforme" ? 3 : i.status === "parcial" ? 1.5 : 0;
      return sum + i.weight * multiplier;
    }, 0);
    const percentage = maxScore > 0 ? Math.round((actualScore / maxScore) * 100) : 0;
    let label = "Crítico";
    let color = "text-red-400";
    if (percentage >= 80) { label = "Pronto"; color = "text-emerald-400"; }
    else if (percentage >= 60) { label = "Quase Pronto"; color = "text-amber-400"; }
    else if (percentage >= 40) { label = "Em Desenvolvimento"; color = "text-orange-400"; }
    return { score: Math.round(actualScore), maxScore, percentage, label, color };
  }, [blocks]);

  // Exportar JSON
  const exportJSON = () => {
    const exportData = {
      meta: {
        version: "1.0",
        exportedAt: new Date().toISOString(),
        tool: "Grid Checklist de Validação de Protótipos",
      },
      session: { validador, grupo, data, arquitetura },
      blocks: blocks.map((b) => ({
        id: b.id,
        title: b.title,
        items: b.items.map((i) => ({
          id: i.id,
          label: i.label,
          weight: i.weight,
          status: i.status,
          evidence: i.evidence,
        })),
      })),
      melhorias: { alta: melhorias, media_baixa: melhoriasBaixa },
      conclusao,
      readinessScore: readinessScore.percentage,
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `checklist-${grupo || "prototipo"}-${data}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Dados exportados com sucesso!");
  };

  // Importar JSON
  const importJSON = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const imported = JSON.parse(ev.target?.result as string);
          if (!imported.blocks || !Array.isArray(imported.blocks)) {
            toast.error("Arquivo inválido: estrutura de blocos não encontrada.");
            return;
          }
          // Hidratar blocos
          const hydratedBlocks = initialBlocks.map((block) => {
            const importedBlock = imported.blocks.find((ib: any) => ib.id === block.id);
            if (!importedBlock) return block;
            return {
              ...block,
              items: block.items.map((item) => {
                const importedItem = importedBlock.items.find((ii: any) => ii.id === item.id);
                if (!importedItem) return item;
                return { ...item, status: importedItem.status || null, evidence: importedItem.evidence || "" };
              }),
            };
          });
          setBlocks(hydratedBlocks);
          if (imported.session) {
            if (imported.session.validador) setValidador(imported.session.validador);
            if (imported.session.grupo) setGrupo(imported.session.grupo);
            if (imported.session.data) setData(imported.session.data);
            if (imported.session.arquitetura) setArquitetura(imported.session.arquitetura);
          }
          if (imported.melhorias) {
            if (imported.melhorias.alta) setMelhorias(imported.melhorias.alta);
            if (imported.melhorias.media_baixa) setMelhoriasBaixa(imported.melhorias.media_baixa);
          }
          if (imported.conclusao) setConclusao(imported.conclusao);
          toast.success(`Dados importados com sucesso! (${imported.session?.grupo || "Protótipo"})`);
        } catch {
          toast.error("Erro ao ler o arquivo JSON. Verifique o formato.");
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const generatePDF = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Não foi possível abrir a janela de impressão. Verifique o bloqueador de pop-ups.");
      return;
    }

    const reportHTML = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Relatório de Validação — ${grupo || "Protótipo"}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', sans-serif; color: #1a1a1a; padding: 40px; line-height: 1.6; }
    h1 { font-size: 24px; color: #C41E3A; margin-bottom: 8px; }
    h2 { font-size: 18px; color: #333; margin: 24px 0 12px; border-bottom: 2px solid #C41E3A; padding-bottom: 4px; }
    .header { border-bottom: 3px solid #C41E3A; padding-bottom: 16px; margin-bottom: 24px; }
    .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 13px; color: #555; }
    .meta span { font-weight: 600; color: #1a1a1a; }
    .score-box { margin: 20px 0; padding: 16px 24px; border: 2px solid #C41E3A; border-radius: 8px; display: flex; align-items: center; justify-content: space-between; }
    .score-value { font-size: 36px; font-weight: 800; }
    .score-label { font-size: 14px; font-weight: 600; margin-top: 2px; }
    .score-pronto { color: #059669; }
    .score-quase { color: #d97706; }
    .score-dev { color: #ea580c; }
    .score-critico { color: #dc2626; }
    .score-bar { width: 200px; height: 10px; background: #e5e7eb; border-radius: 5px; overflow: hidden; }
    .score-bar-fill { height: 100%; border-radius: 5px; }
    .stats { display: flex; gap: 16px; margin: 16px 0; flex-wrap: wrap; }
    .stat { padding: 8px 16px; border-radius: 4px; font-size: 13px; font-weight: 600; }
    .stat-conforme { background: #d1fae5; color: #065f46; }
    .stat-parcial { background: #fef3c7; color: #92400e; }
    .stat-nconforme { background: #fee2e2; color: #991b1b; }
    .stat-na { background: #f3f4f6; color: #4b5563; }
    .severity-badge { display: inline-block; padding: 1px 6px; border-radius: 3px; font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-right: 6px; vertical-align: middle; }
    .severity-critico { background: #fee2e2; color: #991b1b; }
    .severity-medio { background: #fef3c7; color: #92400e; }
    .severity-baixo { background: #f3f4f6; color: #4b5563; }
    .block-summary { display: flex; gap: 12px; flex-wrap: wrap; margin: 16px 0 24px; padding: 12px 16px; background: #f9fafb; border-radius: 6px; border: 1px solid #e5e7eb; page-break-inside: avoid; }
    .block-score-item { flex: 1; min-width: 140px; text-align: center; padding: 8px; border-radius: 4px; }
    .block-score-item .block-title { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #666; margin-bottom: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .block-score-item .block-pct { font-size: 18px; font-weight: 800; }
    .block-score-item .block-label { font-size: 9px; font-weight: 600; }
    .block-score-pronto { background: #d1fae5; }
    .block-score-pronto .block-pct, .block-score-pronto .block-label { color: #065f46; }
    .block-score-quase { background: #fef3c7; }
    .block-score-quase .block-pct, .block-score-quase .block-label { color: #92400e; }
    .block-score-dev { background: #ffedd5; }
    .block-score-dev .block-pct, .block-score-dev .block-label { color: #9a3412; }
    .block-score-critico { background: #fee2e2; }
    .block-score-critico .block-pct, .block-score-critico .block-label { color: #991b1b; }
    .block-score-pendente { background: #f3f4f6; }
    .block-score-pendente .block-pct, .block-score-pendente .block-label { color: #4b5563; }
    .item { margin: 8px 0; padding: 8px 12px; border-left: 3px solid #ddd; font-size: 13px; page-break-inside: avoid; }
    .item-conforme { border-left-color: #10b981; }
    .item-parcial { border-left-color: #f59e0b; }
    .item-nconforme { border-left-color: #ef4444; }
    .item-na { border-left-color: #9ca3af; }
    .item-label { font-weight: 500; }
    .item-status { font-size: 12px; font-weight: 700; text-transform: uppercase; margin-left: 8px; }
    .item-evidence { font-size: 12px; color: #555; margin-top: 4px; font-style: italic; }
    .section-melhorias { margin-top: 24px; padding: 16px; background: #fef2f2; border-radius: 6px; page-break-inside: avoid; }
    .section-melhorias h3 { font-size: 14px; margin-bottom: 8px; }
    .section-melhorias p { font-size: 13px; white-space: pre-wrap; }
    .conclusao { margin-top: 24px; padding: 12px 16px; background: #1a1a1a; color: white; font-size: 14px; font-weight: 600; border-radius: 4px; }
    .footer { margin-top: 32px; font-size: 11px; color: #999; text-align: center; border-top: 1px solid #eee; padding-top: 12px; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>Relatório de Validação de Protótipo</h1>
    <p style="color:#555;">Programa Grid 2026 — Grupo Oscar</p>
  </div>
  <div class="meta">
    <p>Validador(a): <span>${validador || "—"}</span></p>
    <p>Data: <span>${data || "—"}</span></p>
    <p>Grupo/Protótipo: <span>${grupo || "—"}</span></p>
    <p>Arquitetura: <span>${arquitetura || "—"}</span></p>
  </div>
  <div class="score-box">
    <div>
      <div style="font-size:11px;color:#666;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Score de Prontidão</div>
      <div class="score-value ${readinessScore.percentage >= 80 ? 'score-pronto' : readinessScore.percentage >= 60 ? 'score-quase' : readinessScore.percentage >= 40 ? 'score-dev' : 'score-critico'}">${readinessScore.percentage}%</div>
      <div class="score-label ${readinessScore.percentage >= 80 ? 'score-pronto' : readinessScore.percentage >= 60 ? 'score-quase' : readinessScore.percentage >= 40 ? 'score-dev' : 'score-critico'}">${readinessScore.label}</div>
    </div>
    <div style="text-align:right;">
      <div style="font-size:11px;color:#666;margin-bottom:6px;">Pontos: ${readinessScore.score} / ${readinessScore.maxScore}</div>
      <div class="score-bar">
        <div class="score-bar-fill" style="width:${readinessScore.percentage}%;background:${readinessScore.percentage >= 80 ? '#059669' : readinessScore.percentage >= 60 ? '#d97706' : readinessScore.percentage >= 40 ? '#ea580c' : '#dc2626'}"></div>
      </div>
      <div style="font-size:10px;color:#999;margin-top:4px;">Ponderado por severidade (Crítico=3, Médio=2, Baixo=1)</div>
    </div>
  </div>
  <div class="stats">
    <div class="stat stat-conforme">Conforme: ${stats.conforme}</div>
    <div class="stat stat-parcial">Parcial: ${stats.parcial}</div>
    <div class="stat stat-nconforme">N\u00e3o Conforme: ${stats.nconforme}</div>
    <div class="stat stat-na">N/A: ${stats.na}</div>
  </div>
  <h2>Resumo de Prontid\u00e3o por Bloco</h2>
  <div class="block-summary">
    ${blocks.map((block) => {
      const evaluated = block.items.filter((i) => i.status !== null && i.status !== "na");
      let pct = 0;
      let label = "Pendente";
      let cls = "block-score-pendente";
      if (evaluated.length > 0) {
        const maxS = evaluated.reduce((s, i) => s + i.weight * 3, 0);
        const actS = evaluated.reduce((s, i) => s + i.weight * (i.status === "conforme" ? 3 : i.status === "parcial" ? 1.5 : 0), 0);
        pct = maxS > 0 ? Math.round((actS / maxS) * 100) : 0;
        if (pct >= 80) { label = "Pronto"; cls = "block-score-pronto"; }
        else if (pct >= 60) { label = "Quase Pronto"; cls = "block-score-quase"; }
        else if (pct >= 40) { label = "Em Dev."; cls = "block-score-dev"; }
        else { label = "Cr\u00edtico"; cls = "block-score-critico"; }
      }
      return `<div class="block-score-item ${cls}"><div class="block-title">${block.title}</div><div class="block-pct">${pct}%</div><div class="block-label">${label}</div></div>`;
    }).join("")}
  </div>
  ${blocks.map((block) => `
    <h2>${block.title}</h2>
    ${block.items.map((item) => `
      <div class="item item-${item.status || "pending"}">
        <span class="severity-badge ${item.weight === 3 ? 'severity-critico' : item.weight === 2 ? 'severity-medio' : 'severity-baixo'}">${item.weight === 3 ? 'Crítico' : item.weight === 2 ? 'Médio' : 'Baixo'}</span>
        <span class="item-label">${item.id}. ${item.label}</span>
        <span class="item-status" style="color:${item.status === "conforme" ? "#10b981" : item.status === "parcial" ? "#f59e0b" : item.status === "nconforme" ? "#ef4444" : "#9ca3af"}">${getStatusLabel(item.status)}</span>
        ${item.evidence ? `<div class="item-evidence">Evidência: ${item.evidence}</div>` : ""}
      </div>
    `).join("")}
  `).join("")}
  ${melhorias ? `
    <div class="section-melhorias">
      <h3>Melhorias de Alta Prioridade</h3>
      <p>${melhorias}</p>
    </div>
  ` : ""}
  ${melhoriasBaixa ? `
    <div class="section-melhorias" style="background:#fef9c3;">
      <h3>Ajustes de Média/Baixa Prioridade</h3>
      <p>${melhoriasBaixa}</p>
    </div>
  ` : ""}
  ${conclusao ? `<div class="conclusao">Parecer Final: ${conclusao}</div>` : ""}
  <div class="footer">
    Checklist de Validação de Protótipos — Programa Grid 2026 — Grupo Oscar<br>
    Gerado em ${new Date().toLocaleString("pt-BR")} | Prof. Diocélio Goulart
  </div>
</body>
</html>`;

    printWindow.document.write(reportHTML);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 500);
    toast.success("Relatório gerado. Use 'Salvar como PDF' na janela de impressão.");
  };

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 border-r border-border bg-[oklch(0.15_0.005_285)] p-4 flex flex-col gap-4 sticky top-0 h-screen overflow-y-auto hidden lg:flex">
        <div className="mb-2">
          <h2 className="text-lg font-bold text-[#C41E3A]" style={{ fontFamily: "var(--font-heading)" }}>Grid</h2>
          <p className="text-xs text-muted-foreground">Validação de Protótipos</p>
        </div>
        <Separator />

        {/* Progress global */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Progresso</span>
            <span>{Math.round(stats.progress)}%</span>
          </div>
          <Progress value={stats.progress} className="h-2" />
          <div className="grid grid-cols-2 gap-1 text-xs">
            <span className="text-emerald-400">{stats.conforme} Conf.</span>
            <span className="text-amber-400">{stats.parcial} Parc.</span>
            <span className="text-red-400">{stats.nconforme} N/C</span>
            <span className="text-zinc-400">{stats.na} N/A</span>
          </div>

          {/* Score de Prontidão */}
          <div className="mt-3 p-2 rounded-md bg-secondary/30 border border-border">
            <div className="flex items-center gap-1.5 mb-1">
              <Gauge className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Prontidão</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className={`text-xl font-bold ${readinessScore.color}`}>{readinessScore.percentage}%</span>
              <span className={`text-[10px] font-medium ${readinessScore.color}`}>{readinessScore.label}</span>
            </div>
            <Progress value={readinessScore.percentage} className="h-1.5 mt-1" />
          </div>
        </div>

        <Separator />

        {/* Navegação de blocos */}
        <nav className="flex flex-col gap-1">
          {blocks.map((block) => {
            const bs = blockStats(block.id);
            const brs = blockReadinessScore(block.id);
            const isActive = activeBlock === block.id;
            return (
              <button
                key={block.id}
                onClick={() => setActiveBlock(block.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-left text-sm transition-all duration-150 ${
                  isActive
                    ? "bg-[#C41E3A]/15 text-[#C41E3A] border border-[#C41E3A]/30"
                    : "hover:bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                {block.icon}
                <div className="flex-1 min-w-0">
                  <p className="truncate text-xs font-medium">{block.title}</p>
                  <p className="text-[10px] opacity-70">{bs.done}/{bs.total}</p>
                </div>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${brs.bgColor} ${brs.color}`}>
                  {brs.percentage}%
                </span>
              </button>
            );
          })}
        </nav>

        <div className="mt-auto space-y-2">
          <div className="text-[10px] text-center text-muted-foreground bg-secondary/50 rounded py-1">
            Salvamento automático ativo
          </div>
          <Button onClick={generatePDF} className="w-full bg-[#C41E3A] hover:bg-[#a01830] text-white">
            <FileDown className="w-4 h-4 mr-2" />
            Gerar Relatório PDF
          </Button>
          <div className="flex gap-1">
            <Button onClick={exportJSON} variant="outline" className="flex-1 text-xs text-muted-foreground hover:text-foreground" size="sm">
              <Download className="w-3.5 h-3.5 mr-1" />
              Exportar
            </Button>
            <Button onClick={importJSON} variant="outline" className="flex-1 text-xs text-muted-foreground hover:text-foreground" size="sm">
              <Upload className="w-3.5 h-3.5 mr-1" />
              Importar
            </Button>
          </div>
          <Button onClick={() => setHistoryOpen(true)} variant="outline" className="w-full text-xs text-muted-foreground hover:text-foreground border-amber-500/30 hover:border-amber-500" size="sm">
            <History className="w-3.5 h-3.5 mr-1" />
            Hist\u00f3rico ({snapshots.length})
          </Button>
          <div className="flex gap-1">
            <Input
              value={snapshotName}
              onChange={(e) => setSnapshotName(e.target.value)}
              placeholder="Nome da vers\u00e3o..."
              className="flex-1 text-xs h-8"
            />
            <Button onClick={saveSnapshot} size="sm" className="bg-amber-600 hover:bg-amber-700 text-white h-8 px-3">
              Salvar
            </Button>
          </div>
          <Button onClick={clearSavedData} variant="outline" className="w-full text-xs text-muted-foreground hover:text-destructive hover:border-destructive">
            Limpar Dados
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-3xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>
            Checklist de Validação de Protótipos
          </h1>
          <p className="text-muted-foreground mt-1">Programa Grid 2026 — Grupo Oscar</p>
        </header>

        {/* Identificação */}
        <Card className="p-6 mb-8 bg-card border-border">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Identificação da Sessão</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Validador(a)</label>
              <Input value={validador} onChange={(e) => setValidador(e.target.value)} placeholder="Nome de quem valida" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Grupo / Protótipo</label>
              <Input value={grupo} onChange={(e) => setGrupo(e.target.value)} placeholder="Ex: Grupo Alpha - App de Vendas" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Data</label>
              <Input type="date" value={data} onChange={(e) => setData(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Arquitetura Alvo</label>
              <Select value={arquitetura} onValueChange={setArquitetura}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Web App">Web App</SelectItem>
                  <SelectItem value="Mobile App">Mobile App</SelectItem>
                  <SelectItem value="Chat Conversacional">Chat Conversacional</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* Mobile block selector */}
        <div className="lg:hidden mb-4">
          <Select value={activeBlock} onValueChange={setActiveBlock}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {blocks.map((b) => (
                <SelectItem key={b.id} value={b.id}>{b.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Active Block */}
        {blocks.filter((b) => b.id === activeBlock).map((block) => {
          const brs = blockReadinessScore(block.id);
          return (
          <section key={block.id} className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-[#C41E3A]/10 text-[#C41E3A]">
                {block.icon}
              </div>
              <div>
                <h2 className="text-xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>{block.title}</h2>
                <p className="text-xs text-muted-foreground">{blockStats(block.id).done} de {blockStats(block.id).total} avaliados</p>
              </div>
              <div className="ml-auto flex items-center gap-3">
                <div className="text-right">
                  <span className={`text-lg font-bold ${brs.color}`}>{brs.percentage}%</span>
                  <p className={`text-[10px] font-medium ${brs.color}`}>{brs.label}</p>
                </div>
                <Progress value={brs.percentage} className="w-20 h-2" />
              </div>
            </div>

            {block.items.map((item) => (
              <Card key={item.id} className="p-4 bg-card border-border hover:border-[#C41E3A]/30 transition-colors duration-150">
                <div className="flex flex-col md:flex-row md:items-start gap-3">
                  <div className="flex-1">
                    <div className="flex items-start gap-2">
                      <p className="text-sm font-medium">
                        <span className="font-mono text-[#C41E3A] mr-2 text-xs">{item.id}</span>
                        <span className={`inline-block mr-2 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                          item.weight === 3 ? "bg-red-500/20 text-red-400" :
                          item.weight === 2 ? "bg-amber-500/20 text-amber-400" :
                          "bg-zinc-500/20 text-zinc-400"
                        }`}>
                          {item.weight === 3 ? "Crítico" : item.weight === 2 ? "Médio" : "Baixo"}
                        </span>
                        {item.label}
                      </p>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => setOpenHelp(openHelp === item.id ? null : item.id)}
                            className={`shrink-0 p-1 rounded transition-colors duration-150 ${
                              openHelp === item.id
                                ? "text-[#C41E3A] bg-[#C41E3A]/10"
                                : "text-muted-foreground hover:text-[#C41E3A] hover:bg-[#C41E3A]/5"
                            }`}
                          >
                            <HelpCircle className="w-4 h-4" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs">
                          <p className="text-xs">Clique para ver orientações de como verificar este item</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0 flex-wrap">
                    {(["conforme", "parcial", "nconforme", "na"] as Status[]).map((s) => (
                      <button
                        key={s}
                        onClick={() => setItemStatus(block.id, item.id, s)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-all duration-150 active:scale-95 ${
                          item.status === s ? getStatusColor(s) : "bg-secondary/50 text-muted-foreground border-border hover:bg-secondary"
                        }`}
                      >
                        <span className="flex items-center gap-1">
                          {item.status === s && getStatusIcon(s)}
                          {getStatusLabel(s)}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Help Panel */}
                {openHelp === item.id && (
                  <HelpPanel item={item} onClose={() => setOpenHelp(null)} />
                )}

                <div className="mt-3">
                  <Textarea
                    value={item.evidence}
                    onChange={(e) => setItemEvidence(block.id, item.id, e.target.value)}
                    placeholder={item.guidingQuestion}
                    className="text-sm bg-secondary/30 border-border min-h-[60px]"
                    rows={2}
                  />
                </div>
              </Card>
            ))}
          </section>
          );
        })}

        {/* Melhorias */}
        <Card className="p-6 mt-8 bg-card border-border">
          <h2 className="text-lg font-bold mb-4" style={{ fontFamily: "var(--font-heading)" }}>Plano de Ação e Melhorias</h2>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Melhorias de Alta Prioridade (Bloqueantes)</label>
              <Textarea
                value={melhorias}
                onChange={(e) => setMelhorias(e.target.value)}
                placeholder="Quais problemas impedem o protótipo de ser testado com usuários reais? O que deve ser corrigido antes da próxima etapa?"
                className="bg-secondary/30 border-border"
                rows={4}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Ajustes de Média/Baixa Prioridade</label>
              <Textarea
                value={melhoriasBaixa}
                onChange={(e) => setMelhoriasBaixa(e.target.value)}
                placeholder="Quais melhorias de interface, texto ou experiência podem ser feitas após a validação principal? O que não é bloqueante mas melhoraria a qualidade?"
                className="bg-secondary/30 border-border"
                rows={3}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Parecer Final</label>
              <Select value={conclusao} onValueChange={setConclusao}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o parecer final..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Aprovado para Teste com Usuários">Aprovado para Teste com Usuários</SelectItem>
                  <SelectItem value="Aprovado com Ressalvas (Corrigir itens críticos)">Aprovado com Ressalvas (Corrigir itens críticos)</SelectItem>
                  <SelectItem value="Reprovado - Necessita Nova Revisão Técnica">Reprovado - Necessita Nova Revisão Técnica</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* Mobile actions */}
        <div className="lg:hidden mt-6 space-y-3">
          {/* Score mobile */}
          <div className="p-3 rounded-md bg-secondary/30 border border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Gauge className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground font-semibold">Prontidão</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className={`text-lg font-bold ${readinessScore.color}`}>{readinessScore.percentage}%</span>
                <span className={`text-xs font-medium ${readinessScore.color}`}>{readinessScore.label}</span>
              </div>
            </div>
          </div>
          <Button onClick={generatePDF} className="w-full bg-[#C41E3A] hover:bg-[#a01830] text-white" size="lg">
            <FileDown className="w-5 h-5 mr-2" />
            Gerar Relatório PDF
          </Button>
          <div className="flex gap-2">
            <Button onClick={exportJSON} variant="outline" className="flex-1" size="sm">
              <Download className="w-4 h-4 mr-1" />
              Exportar JSON
            </Button>
            <Button onClick={importJSON} variant="outline" className="flex-1" size="sm">
              <Upload className="w-4 h-4 mr-1" />
              Importar JSON
            </Button>
          </div>
          <Button onClick={() => setHistoryOpen(true)} variant="outline" className="w-full border-amber-500/30" size="sm">
            <History className="w-4 h-4 mr-1" />
            Hist\u00f3rico de Vers\u00f5es ({snapshots.length})
          </Button>
        </div>

        {/* Footer */}
        <footer className="mt-12 text-center text-xs text-muted-foreground border-t border-border pt-6">
          <p>Checklist de Valida\u00e7\u00e3o de Prot\u00f3tipos \u2014 Programa Grid 2026</p>
          <p className="mt-1">Prof. Dioc\u00e9lio Goulart \u00b7 dioceliogoulart.com.br</p>
        </footer>
      </main>

      {/* Modal Hist\u00f3rico de Vers\u00f5es */}
      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="w-5 h-5 text-amber-500" />
              Hist\u00f3rico de Vers\u00f5es
            </DialogTitle>
            <DialogDescription>
              Snapshots salvos do checklist. Restaure vers\u00f5es anteriores ou acompanhe a evolu\u00e7\u00e3o do prot\u00f3tipo.
            </DialogDescription>
          </DialogHeader>

          {viewingSnapshot ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">{viewingSnapshot.name}</h3>
                <Button variant="outline" size="sm" onClick={() => setViewingSnapshot(null)}>
                  <X className="w-3.5 h-3.5 mr-1" /> Voltar
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Data:</span> {new Date(viewingSnapshot.createdAt).toLocaleString("pt-BR")}</div>
                <div><span className="text-muted-foreground">Grupo:</span> {viewingSnapshot.grupo}</div>
                <div><span className="text-muted-foreground">Validador:</span> {viewingSnapshot.validador}</div>
                <div><span className="text-muted-foreground">Score Global:</span> <span className="font-bold">{viewingSnapshot.globalScore}%</span> ({viewingSnapshot.globalLabel})</div>
              </div>
              <div className="mt-4">
                <h4 className="text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-wider">Score por Bloco</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {viewingSnapshot.blockScores.map((bs) => (
                    <div key={bs.id} className="p-2 rounded-md bg-secondary/50 text-center">
                      <p className="text-[10px] text-muted-foreground truncate">{bs.title}</p>
                      <p className={`text-lg font-bold ${
                        bs.percentage >= 80 ? "text-emerald-400" :
                        bs.percentage >= 60 ? "text-amber-400" :
                        bs.percentage >= 40 ? "text-orange-400" : "text-red-400"
                      }`}>{bs.percentage}%</p>
                      <p className="text-[9px] text-muted-foreground">{bs.label}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button onClick={() => restoreSnapshot(viewingSnapshot)} className="bg-amber-600 hover:bg-amber-700 text-white">
                  <RotateCcw className="w-4 h-4 mr-1" /> Restaurar esta vers\u00e3o
                </Button>
              </div>
            </div>
          ) : snapshots.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <History className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Nenhuma vers\u00e3o salva ainda.</p>
              <p className="text-xs mt-1">Use o campo \"Salvar\" no sidebar para criar um snapshot.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {snapshots.length >= 2 && (
                <div className="p-3 rounded-md bg-secondary/30 border border-border">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Evolu\u00e7\u00e3o do Score Global</h4>
                  <div className="flex items-end gap-1 h-16">
                    {[...snapshots].reverse().map((s) => (
                      <div key={s.id} className="flex-1 flex flex-col items-center gap-0.5">
                        <span className="text-[9px] text-muted-foreground">{s.globalScore}%</span>
                        <div
                          className={`w-full rounded-t-sm ${
                            s.globalScore >= 80 ? "bg-emerald-500" :
                            s.globalScore >= 60 ? "bg-amber-500" :
                            s.globalScore >= 40 ? "bg-orange-500" : "bg-red-500"
                          }`}
                          style={{ height: `${Math.max(s.globalScore * 0.6, 4)}px` }}
                        />
                        <span className="text-[8px] text-muted-foreground truncate max-w-full">{s.name.slice(0, 6)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Vers\u00e3o</TableHead>
                    <TableHead className="text-xs">Data</TableHead>
                    <TableHead className="text-xs">Score</TableHead>
                    <TableHead className="text-xs text-right">A\u00e7\u00f5es</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {snapshots.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="text-sm font-medium">{s.name}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{new Date(s.createdAt).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</TableCell>
                      <TableCell>
                        <span className={`text-sm font-bold ${
                          s.globalScore >= 80 ? "text-emerald-400" :
                          s.globalScore >= 60 ? "text-amber-400" :
                          s.globalScore >= 40 ? "text-orange-400" : "text-red-400"
                        }`}>{s.globalScore}%</span>
                        <span className="text-[10px] text-muted-foreground ml-1">{s.globalLabel}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          <button onClick={() => setViewingSnapshot(s)} className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => restoreSnapshot(s)} className="p-1.5 rounded hover:bg-amber-500/10 text-muted-foreground hover:text-amber-500 transition-colors">
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => deleteSnapshot(s.id)} className="p-1.5 rounded hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
