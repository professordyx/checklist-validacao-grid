import { useState, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileDown, CheckCircle2, AlertTriangle, XCircle, MinusCircle, ClipboardList, Shield, TestTube, Monitor, Layers, ChevronRight } from "lucide-react";
import { toast } from "sonner";

type Status = "conforme" | "parcial" | "nconforme" | "na" | null;

interface CheckItem {
  id: string;
  label: string;
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
      { id: "A1", label: "Problema organizacional e proposta de valor estão explicitados no protótipo.", status: null, evidence: "" },
      { id: "A2", label: "Tipo de artefato declarado (instanciação, modelo, método ou constructo).", status: null, evidence: "" },
      { id: "A3", label: "Arquitetura-alvo definida e separação de camadas (Front/Back) implementada.", status: null, evidence: "" },
      { id: "A4", label: "Requisitos funcionais principais decompostos em tarefas verificáveis.", status: null, evidence: "" },
      { id: "A5", label: "Requisitos não funcionais listados (desempenho, usabilidade, acessibilidade).", status: null, evidence: "" },
    ],
  },
  {
    id: "bloco2",
    title: "Testes Unitários e Domínio",
    icon: <TestTube className="w-5 h-5" />,
    items: [
      { id: "B1", label: "Campos obrigatórios rejeitam valores vazios ou malformados.", status: null, evidence: "" },
      { id: "B2", label: "Regras de negócio (cálculos, scores, lógicas condicionais) funcionam isoladamente.", status: null, evidence: "" },
      { id: "B3", label: "Tratamento adequado para ausência de dados (sem quebrar a aplicação).", status: null, evidence: "" },
      { id: "B4", label: "Derivação de scores e métricas produz resultados corretos.", status: null, evidence: "" },
      { id: "B5", label: "Fallback de tradução (i18n) funciona quando chave não existe.", status: null, evidence: "" },
      { id: "B6", label: "Cobertura de código dos módulos de domínio registrada.", status: null, evidence: "" },
    ],
  },
  {
    id: "bloco3",
    title: "Testes Funcionais e E2E (Interface)",
    icon: <Monitor className="w-5 h-5" />,
    items: [
      { id: "C1", label: "Acesso protegido redireciona corretamente quando não há sessão ativa.", status: null, evidence: "" },
      { id: "C2", label: "Fluxo de autenticação (Login/Cadastro/OAuth) operando corretamente.", status: null, evidence: "" },
      { id: "C3", label: "Jornada principal do usuário pode ser concluída do início ao fim.", status: null, evidence: "" },
      { id: "C4", label: "Funcionalidade de autossave opera sem perda de dados.", status: null, evidence: "" },
      { id: "C5", label: "Funcionalidades de IA (avaliação, melhoria, geração) retornam resultados válidos.", status: null, evidence: "" },
      { id: "C6", label: "Exportação e impressão funcionam corretamente.", status: null, evidence: "" },
      { id: "C7", label: "Responsividade validada (Desktop e Mobile).", status: null, evidence: "" },
      { id: "C8", label: "Acessibilidade: sem violações sérias ou críticas (axe/Lighthouse).", status: null, evidence: "" },
      { id: "C9", label: "Navegação por teclado funcional em todos os campos.", status: null, evidence: "" },
    ],
  },
  {
    id: "bloco4",
    title: "Segurança e Integração",
    icon: <Shield className="w-5 h-5" />,
    items: [
      { id: "D1", label: "Nenhuma chave de API exposta no código front-end, HTML ou repositório público.", status: null, evidence: "" },
      { id: "D2", label: "Row Level Security (RLS) testada no servidor (não apenas na interface).", status: null, evidence: "" },
      { id: "D3", label: "Controle de permissões (viewer vs. editor) validado contra o banco.", status: null, evidence: "" },
      { id: "D4", label: "Tratamento de erros para falhas de rede, timeout e rate limit (429).", status: null, evidence: "" },
      { id: "D5", label: "CORS configurado adequadamente nas funções de borda.", status: null, evidence: "" },
      { id: "D6", label: "Autenticação robusta com gestão de sessões implementada.", status: null, evidence: "" },
      { id: "D7", label: "Concorrência de operações (ex: autossave × streaming) sem perda de dados.", status: null, evidence: "" },
    ],
  },
  {
    id: "bloco5",
    title: "Avaliação de Contexto (Naturalística)",
    icon: <ClipboardList className="w-5 h-5" />,
    items: [
      { id: "E1", label: "Construtos e proxies de medida definidos (SUS, TAM, rubrica).", status: null, evidence: "" },
      { id: "E2", label: "Avaliação heurística concluída (3-5 avaliadores, heurísticas de Nielsen).", status: null, evidence: "" },
      { id: "E3", label: "Teste de usabilidade moderado realizado (5-8 participantes, think-aloud).", status: null, evidence: "" },
      { id: "E4", label: "SUS médio ≥ 68 (ou justificativa documentada se inferior).", status: null, evidence: "" },
      { id: "E5", label: "Estudo de campo curto planejado ou executado (2-4 semanas).", status: null, evidence: "" },
      { id: "E6", label: "Riscos à validade identificados e mitigados.", status: null, evidence: "" },
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

export default function Home() {
  const [blocks, setBlocks] = useState<Block[]>(initialBlocks);
  const [activeBlock, setActiveBlock] = useState("bloco1");
  const [validador, setValidador] = useState("");
  const [grupo, setGrupo] = useState("");
  const [data, setData] = useState(new Date().toISOString().split("T")[0]);
  const [arquitetura, setArquitetura] = useState("");
  const [melhorias, setMelhorias] = useState("");
  const [melhoriasBaixa, setMelhoriasBaixa] = useState("");
  const [conclusao, setConclusao] = useState("");

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
    h3 { font-size: 14px; color: #555; margin: 16px 0 8px; }
    .header { border-bottom: 3px solid #C41E3A; padding-bottom: 16px; margin-bottom: 24px; }
    .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 13px; color: #555; }
    .meta span { font-weight: 600; color: #1a1a1a; }
    .stats { display: flex; gap: 16px; margin: 16px 0; flex-wrap: wrap; }
    .stat { padding: 8px 16px; border-radius: 4px; font-size: 13px; font-weight: 600; }
    .stat-conforme { background: #d1fae5; color: #065f46; }
    .stat-parcial { background: #fef3c7; color: #92400e; }
    .stat-nconforme { background: #fee2e2; color: #991b1b; }
    .stat-na { background: #f3f4f6; color: #4b5563; }
    .item { margin: 8px 0; padding: 8px 12px; border-left: 3px solid #ddd; font-size: 13px; }
    .item-conforme { border-left-color: #10b981; }
    .item-parcial { border-left-color: #f59e0b; }
    .item-nconforme { border-left-color: #ef4444; }
    .item-na { border-left-color: #9ca3af; }
    .item-label { font-weight: 500; }
    .item-status { font-size: 12px; font-weight: 700; text-transform: uppercase; margin-left: 8px; }
    .item-evidence { font-size: 12px; color: #555; margin-top: 4px; font-style: italic; }
    .section-melhorias { margin-top: 24px; padding: 16px; background: #fef2f2; border-radius: 6px; }
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
  <div class="stats">
    <div class="stat stat-conforme">Conforme: ${stats.conforme}</div>
    <div class="stat stat-parcial">Parcial: ${stats.parcial}</div>
    <div class="stat stat-nconforme">Não Conforme: ${stats.nconforme}</div>
    <div class="stat stat-na">N/A: ${stats.na}</div>
  </div>
  ${blocks.map((block) => `
    <h2>${block.title}</h2>
    ${block.items.map((item) => `
      <div class="item item-${item.status || "pending"}">
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
    Gerado em ${new Date().toLocaleString("pt-BR")}
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
        </div>

        <Separator />

        {/* Navegação de blocos */}
        <nav className="flex flex-col gap-1">
          {blocks.map((block) => {
            const bs = blockStats(block.id);
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
                {isActive && <ChevronRight className="w-3 h-3 shrink-0" />}
              </button>
            );
          })}
        </nav>

        <div className="mt-auto">
          <Button onClick={generatePDF} className="w-full bg-[#C41E3A] hover:bg-[#a01830] text-white">
            <FileDown className="w-4 h-4 mr-2" />
            Gerar Relatório PDF
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
        {blocks.filter((b) => b.id === activeBlock).map((block) => (
          <section key={block.id} className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-[#C41E3A]/10 text-[#C41E3A]">
                {block.icon}
              </div>
              <div>
                <h2 className="text-xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>{block.title}</h2>
                <p className="text-xs text-muted-foreground">{blockStats(block.id).done} de {blockStats(block.id).total} avaliados</p>
              </div>
              <div className="ml-auto">
                <Progress value={blockStats(block.id).progress} className="w-24 h-2" />
              </div>
            </div>

            {block.items.map((item) => (
              <Card key={item.id} className="p-4 bg-card border-border hover:border-[#C41E3A]/30 transition-colors duration-150">
                <div className="flex flex-col md:flex-row md:items-start gap-3">
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      <span className="font-mono text-[#C41E3A] mr-2 text-xs">{item.id}</span>
                      {item.label}
                    </p>
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
                <div className="mt-3">
                  <Textarea
                    value={item.evidence}
                    onChange={(e) => setItemEvidence(block.id, item.id, e.target.value)}
                    placeholder="Evidências / Observações..."
                    className="text-sm bg-secondary/30 border-border min-h-[60px]"
                    rows={2}
                  />
                </div>
              </Card>
            ))}
          </section>
        ))}

        {/* Melhorias */}
        <Card className="p-6 mt-8 bg-card border-border">
          <h2 className="text-lg font-bold mb-4" style={{ fontFamily: "var(--font-heading)" }}>Plano de Ação e Melhorias</h2>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Melhorias de Alta Prioridade (Bloqueantes)</label>
              <Textarea
                value={melhorias}
                onChange={(e) => setMelhorias(e.target.value)}
                placeholder="Problemas críticos que devem ser resolvidos antes do contato com o usuário real..."
                className="bg-secondary/30 border-border"
                rows={4}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Ajustes de Média/Baixa Prioridade</label>
              <Textarea
                value={melhoriasBaixa}
                onChange={(e) => setMelhoriasBaixa(e.target.value)}
                placeholder="Melhorias de UI, refinamentos de texto, ajustes não bloqueantes..."
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

        {/* Mobile PDF button */}
        <div className="lg:hidden mt-6">
          <Button onClick={generatePDF} className="w-full bg-[#C41E3A] hover:bg-[#a01830] text-white" size="lg">
            <FileDown className="w-5 h-5 mr-2" />
            Gerar Relatório PDF
          </Button>
        </div>

        {/* Footer */}
        <footer className="mt-12 text-center text-xs text-muted-foreground border-t border-border pt-6">
          <p>Checklist de Validação de Protótipos — Programa Grid 2026</p>
          <p className="mt-1">Prof. Diocélio Goulart · dioceliogoulart.com.br</p>
        </footer>
      </main>
    </div>
  );
}
