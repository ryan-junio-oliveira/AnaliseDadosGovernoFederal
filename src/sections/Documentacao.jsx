import { useState } from "react";
import { SectionHead } from "../components/ui.jsx";
import {
  META,
  LINKS,
  RESUMO,
  FONTES,
  EDA,
  POSICAO,
  VARIAB,
  WELCH,
  TABELAS,
  CODIGOS,
  VERIFICACOES,
} from "./documentacao/conteudo.js";

function Codigo({ titulo, children }) {
  return (
    <div className="mt-3 rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)", background: "#0b1220" }}>
      <p className="px-3 py-1.5 text-[11px] font-mono" style={{ borderBottom: "1px solid #1e293b", color: "#94a3b8" }}>{titulo}</p>
      <pre className="px-3 py-3 text-[11.5px] leading-[1.6] font-mono overflow-x-auto" style={{ color: "#e2e8f0" }}>{children}</pre>
    </div>
  );
}

function Topico({ n, titulo, children }) {
  return (
    <div className="mt-5 first:mt-0">
      <h4 className="font-display font-semibold text-[15px]" style={{ color: "var(--text)" }}>
        <span className="secnum">{n}</span>{titulo}
      </h4>
      <div className="mt-2 text-sm tx-mut leading-relaxed flex flex-col gap-2.5">{children}</div>
    </div>
  );
}

function Stat({ label, value, sub }) {
  return (
    <div className="p-3 text-center" style={{ background: "var(--chip-bg)" }}>
      <p className="text-[11px] uppercase tracking-widest tx-faint">{label}</p>
      <p className="font-display font-bold text-lg mt-0.5" style={{ color: "var(--text)" }}>{value}</p>
      {sub ? <p className="text-[11px] tx-faint mt-0.5">{sub}</p> : null}
    </div>
  );
}

export default function Documentacao({ onVoltar }) {
  const [pdf, setPdf] = useState("idle");

  async function baixarPdf() {
    if (pdf === "gerando") return;
    setPdf("gerando");
    try {
      const { gerarPdf } = await import("./documentacao/gerarPdf.js");
      await gerarPdf();
      setPdf("idle");
    } catch (e) {
      console.error(e);
      setPdf("erro");
      setTimeout(() => setPdf("idle"), 3000);
    }
  }

  return (
    <div className="pb-6">
      <section className="pt-6" aria-label="Cabeçalho do relatório">
        <div className="panel overflow-hidden">
          <div className="p-5 sm:p-7" style={{ background: "linear-gradient(135deg, var(--chip-bg), transparent)" }}>
            <p className="eyebrow"><span className="secnum">AP1</span>{META.subtitulo}</p>
            <h1 className="font-display font-bold text-[1.9rem] sm:text-[2.3rem] leading-none mt-1.5">{META.titulo}</h1>
            <p className="text-[13.5px] tx-mut mt-3 leading-relaxed max-w-3xl">
              <b style={{ color: "var(--text)" }}>{META.saudacao}</b> {META.intro}
            </p>
            <div className="flex gap-2 mt-4 flex-wrap items-center">
              <button type="button" className="btn-primary !py-2.5 !px-4 text-sm" onClick={baixarPdf} disabled={pdf === "gerando"}>
                <i className={`fa-solid ${pdf === "gerando" ? "fa-circle-notch fa-spin" : pdf === "erro" ? "fa-triangle-exclamation" : "fa-file-pdf"}`} aria-hidden="true"></i>
                {pdf === "gerando" ? "Gerando PDF…" : pdf === "erro" ? "Falha — tente de novo" : "Gerar PDF do relatório"}
              </button>
              <button type="button" className="btn-ghost !py-2.5 !px-4 text-sm" onClick={onVoltar}>
                <i className="fa-solid fa-arrow-left" aria-hidden="true"></i>Painel
              </button>
              <span className="text-[11px] tx-faint">PDF gerado por código</span>
            </div>
            <div className="flex gap-3 mt-4 flex-wrap text-sm">
              <a href={LINKS.projeto} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 font-semibold" style={{ color: "var(--blue)" }}>
                <i className="fa-solid fa-globe" aria-hidden="true"></i>Projeto publicado
              </a>
              <a href={LINKS.github} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 font-semibold" style={{ color: "var(--blue)" }}>
                <i className="fa-brands fa-github" aria-hidden="true"></i>Repositório no GitHub
              </a>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-px" style={{ background: "var(--border)", borderTop: "1px solid var(--border)" }}>
            <Stat label="Fontes" value="6" sub="oficiais" />
            <Stat label="Bases" value="8" sub="processadas" />
            <Stat label="Banco" value="20" sub="tabelas · 8.624 linhas" />
            <Stat label="Amostra" value="127" sub="meses (2016–2026)" />
          </div>
        </div>
      </section>

      <section className="panel p-5 sm:p-6 mt-4" aria-label="Resumo">
        <h2 className="font-display font-semibold mb-3"><i className="fa-solid fa-comment-dots mr-2 tx-mut" aria-hidden="true"></i>Resumo do que foi desenvolvido</h2>
        <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-2">
          {RESUMO.map((r) => (
            <li key={r} className="flex gap-2.5 text-sm tx-mut leading-relaxed">
              <span className="c-rec flex-none mt-0.5"><i className="fa-solid fa-check" aria-hidden="true"></i></span>
              <span>{r}</span>
            </li>
          ))}
        </ul>
      </section>

      <SectionHead index="01" eyebrow="Cenário e fontes" title="Escolha do cenário e origem dos dados" />
      <div className="panel p-5 sm:p-6">
        <div className="text-sm tx-mut leading-relaxed flex flex-col gap-3">
          <p>O manual permite cenário de negócio real ou dataset público. Optei por um <b style={{ color: "var(--text)" }}>dataset público com dados abertos do Governo Federal</b>, por se tratar de dados oficiais, estáveis e de licença aberta. Foram integradas <b style={{ color: "var(--text)" }}>6 fontes</b>:</p>
          <div className="grid sm:grid-cols-2 gap-2">
            {FONTES.map(([f, o]) => (
              <div key={f} className="flex gap-2.5 p-3 rounded-lg" style={{ background: "var(--chip-bg)", border: "1px solid var(--border-soft)" }}>
                <i className="fa-solid fa-database tx-faint mt-0.5" aria-hidden="true"></i>
                <p className="text-[13px]"><b style={{ color: "var(--text)" }}>{f}:</b> {o}.</p>
              </div>
            ))}
          </div>
          <p>A coleta, o processamento e a validação foram automatizados em um pipeline em Python, permitindo a reprodução de ponta a ponta dos dados publicados.</p>
        </div>
      </div>

      <span id="bloco-a" className="scroll-mt-24 block" aria-hidden="true" />
      <SectionHead index="A" eyebrow="Obrigatório · Python" title="Análise Exploratória e Tratamento" />
      <div className="panel p-5 sm:p-6">
        <p className="text-sm tx-mut leading-relaxed">Antes da análise, foi realizada a limpeza e o tratamento das bases, com atenção à conversão de tipos, aos valores nulos e ao tratamento de erros e exceções.</p>

        <Topico n="A.1" titulo="Limpeza dos dados">
          <p>As planilhas oficiais foram convertidas para estruturas tabulares e tratadas. Três correções foram essenciais:</p>
          <ol className="list-decimal pl-5 flex flex-col gap-2">
            <li><b style={{ color: "var(--text)" }}>Correção de rótulo que inflava os valores (209% → 93,7%).</b> Uma série de receita trazia um subtotal duplicado (já continha IR, COFINS, PIS etc.). Após a correção do mapeamento, a soma por tributo passou a 93,7% da receita líquida e a identidade <span className="font-mono text-[12.5px]">Receita Total − Transferências = Receita Líquida</span> passou a conferir em 100% dos meses.</li>
            <li><b style={{ color: "var(--text)" }}>Datas e campos vazios.</b> Datas convertidas com coerção de erros e valores numéricos tipados; 0 datas inválidas e 0 duplicatas nas 8 bases.</li>
            <li><b style={{ color: "var(--text)" }}>Registros duplicados de emendas (14 → 7).</b> O código identificador era interpretado como número, gerando duplicidade; a leitura passou a preservá-lo como texto.</li>
          </ol>
          <Codigo titulo="Leitura e coerção de tipos na planilha de origem">{CODIGOS.limpeza}</Codigo>
        </Topico>

        <Topico n="A.2" titulo="Tratamento de tipos de dados">
          <p>Datas tipadas na leitura e normalizadas para o padrão ISO (<span className="font-mono text-[12.5px]">AAAA-MM-01</span>); valores convertidos para escala numérica consistente; no banco, tipos definidos (inteiro, numérico real, texto) com chaves e restrições (Bloco B).</p>
          <Codigo titulo="Normalização do tipo data">{CODIGOS.tipos}</Codigo>
        </Topico>

        <Topico n="A.3" titulo="Tratamento de valores nulos">
          <p>Regra adotada: <b style={{ color: "var(--text)" }}>valor nulo publicado permanece nulo</b>, sem substituição por zero. Há lacunas reais documentadas (ex.: indicador sem publicação em determinado mês e séries sem divulgação no fim da janela) — 10 nulos na base de conjuntura, todos explicados. A atualização das séries preserva valores válidos já coletados.</p>
          <Codigo titulo="Mescla que preserva valores nulos publicados">{CODIGOS.nulos}</Codigo>
        </Topico>

        <Topico n="A.4" titulo="Tratamento de erros e exceções">
          <ul className="flex flex-col gap-1.5">
            {[
              "Novas tentativas com espera progressiva em falhas de resposta (incluindo limites de requisição).",
              "Fonte alternativa de download quando a obtenção principal falha.",
              "Coleta vazia ou arquivo corrompido não sobrescreve uma base válida anterior.",
              "Separação entre etapas críticas (interrompem com erro) e tolerantes (registram aviso).",
              "Exportação realizada apenas após a leitura de todos os insumos, evitando saídas parciais.",
            ].map((t) => <li key={t} className="flex gap-2"><span className="tx-faint flex-none">—</span><span>{t}</span></li>)}
          </ul>
          <Codigo titulo="Tentativas com espera progressiva na coleta de séries">{CODIGOS.erros}</Codigo>
        </Topico>

        <Topico n="A.5" titulo="Resultado da análise exploratória">
          <p>A análise exploratória processou 8 bases com <b style={{ color: "var(--text)" }}>zero falhas de carga</b>:</p>
          <div className="rounded-xl overflow-x-auto mt-1" style={{ border: "1px solid var(--border)" }}>
            <table className="w-full text-sm min-w-[480px]">
              <thead><tr className="text-left text-[11px] tx-faint uppercase tracking-widest" style={{ background: "var(--chip-bg)" }}>
                <th className="py-2.5 px-3">Base</th><th className="py-2.5 px-3 text-right">Linhas</th><th className="py-2.5 px-3 text-right">Duplicatas</th><th className="py-2.5 px-3 text-right">Nulos</th>
              </tr></thead>
              <tbody>
                {EDA.map(([b, l, d, n]) => (
                  <tr key={b} style={{ borderTop: "1px solid var(--border-soft)" }}>
                    <td className="py-2 px-3 font-semibold">{b}</td>
                    <td className="py-2 px-3 text-right">{l}</td><td className="py-2 px-3 text-right">{d}</td><td className="py-2 px-3 text-right">{n}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p>Foram verificadas a identidade contábil <span className="font-mono text-[12.5px]">receita − despesa = resultado</span> (maior desvio de meio centavo) e a continuidade temporal sem meses faltantes (2016–2026). Os 11 valores atípicos no resultado primário (critério de Tukey) foram mantidos por corresponderem a eventos reais (fechamentos de dezembro, eleições e pandemia).</p>
        </Topico>
      </div>

      <span id="bloco-b" className="scroll-mt-24 block" aria-hidden="true" />
      <SectionHead index="B" eyebrow="Obrigatório · Banco de dados" title="Modelagem de Dados" />
      <div className="panel p-5 sm:p-6">
        <p className="text-sm tx-mut leading-relaxed">Com os dados tratados, foi elaborado o modelo Entidade-Relacionamento para organizar as informações de forma estruturada.</p>

        <Topico n="B.1" titulo="Modelo conceitual">
          <p>O modelo conceitual foi dividido em dois diagramas: núcleo fiscal federal e bloco de conjuntura, emendas e estados.</p>
          <Codigo titulo="Diagrama conceitual A — núcleo fiscal federal">{CODIGOS.diagramaA}</Codigo>
          <Codigo titulo="Diagrama conceitual B — conjuntura, emendas e estados">{CODIGOS.diagramaB}</Codigo>
        </Topico>

        <Topico n="B.2" titulo="Modelo lógico">
          <p>Separação em <b style={{ color: "var(--text)" }}>dimensões</b> (poder, órgão, período, estado, tipo de receita, função de despesa) e <b style={{ color: "var(--text)" }}>fatos</b> (execução, receitas, despesas, conjuntura, dívida, emendas e séries por UF), totalizando <b style={{ color: "var(--text)" }}>20 tabelas e 4 índices</b>, com chaves compartilhadas de tempo e unidade federativa.</p>
          <div className="flex gap-1.5 flex-wrap mt-1">
            {TABELAS.map((t) => <span key={t} className="chip !py-1 !px-2.5 !text-[11.5px] font-mono">{t}</span>)}
          </div>
        </Topico>

        <Topico n="B.3" titulo="DDL — criação das tabelas">
          <p>Script de definição com chaves primárias e estrangeiras, campos obrigatórios e restrições de integridade. Exemplo de regra aplicada na tabela:</p>
          <Codigo titulo="DDL — exemplo de tabela com restrição de integridade">{CODIGOS.ddl}</Codigo>
        </Topico>

        <Topico n="B.4" titulo="DML — carga inicial">
          <p>Carga inicial gerada a partir dos dados tratados, com inserções ordenadas conforme as dependências (dimensões antes dos fatos), totalizando <b style={{ color: "var(--text)" }}>8.717 linhas</b> de carga.</p>
          <Codigo titulo="DML — trecho da carga inicial">{CODIGOS.dml}</Codigo>
          <p>Resultado da carga: <b style={{ color: "var(--text)" }}>20 tabelas, 8.624 linhas inseridas e 0 violações de chave estrangeira</b> na verificação de integridade referencial.</p>
        </Topico>
      </div>

      <span id="bloco-c" className="scroll-mt-24 block" aria-hidden="true" />
      <SectionHead index="C" eyebrow="Obrigatório · Estatística" title="Diagnóstico Estatístico" />
      <div className="panel p-5 sm:p-6">
        <p className="text-sm tx-mut leading-relaxed">A amostra analisada é o <b style={{ color: "var(--text)" }}>resultado primário</b> da União (receita líquida − despesa), com <b style={{ color: "var(--text)" }}>127 observações mensais</b> (2016-01 a 2026-07), em R$ milhões por mês.</p>

        <Topico n="C.1" titulo="Distribuição: medidas de posição e variabilidade">
          <p>A média (<b style={{ color: "var(--text)" }}>−12.969,76 R$ mi/mês</b>) é superior à mediana (<b style={{ color: "var(--text)" }}>−15.540,20 R$ mi/mês</b>), indicando assimetria à esquerda. O coeficiente de variação elevado (307%) é compatível com uma série mensal sem ajuste sazonal.</p>
          <div className="grid sm:grid-cols-2 gap-4 mt-1">
            <div className="rounded-xl overflow-x-auto" style={{ border: "1px solid var(--border)" }}>
              <table className="w-full text-sm">
                <thead><tr className="text-left text-[11px] tx-faint uppercase tracking-widest" style={{ background: "var(--chip-bg)" }}><th className="py-2.5 px-3" colSpan="2">Medidas de posição (R$ mi/mês)</th></tr></thead>
                <tbody>{POSICAO.map(([m, v]) => (<tr key={m} style={{ borderTop: "1px solid var(--border-soft)" }}><td className="py-1.5 px-3 tx-mut">{m}</td><td className="py-1.5 px-3 text-right font-semibold">{v}</td></tr>))}</tbody>
              </table>
            </div>
            <div className="rounded-xl overflow-x-auto" style={{ border: "1px solid var(--border)" }}>
              <table className="w-full text-sm">
                <thead><tr className="text-left text-[11px] tx-faint uppercase tracking-widest" style={{ background: "var(--chip-bg)" }}><th className="py-2.5 px-3" colSpan="2">Medidas de variabilidade</th></tr></thead>
                <tbody>{VARIAB.map(([m, v]) => (<tr key={m} style={{ borderTop: "1px solid var(--border-soft)" }}><td className="py-1.5 px-3 tx-mut">{m}</td><td className="py-1.5 px-3 text-right font-semibold">{v}</td></tr>))}</tbody>
              </table>
            </div>
          </div>
        </Topico>

        <Topico n="C.2" titulo="Normalidade da distribuição">
          <p>Teste de Shapiro-Wilk: W = 0,9359 e <span className="font-mono text-[12.5px]">p &lt; 0,001</span> — <b style={{ color: "var(--brick)" }}>rejeita-se a hipótese de normalidade</b> (α = 0,05). Por isso, além dos testes paramétricos, foi aplicado um teste não paramétrico como confirmação.</p>
        </Topico>

        <Topico n="C.3" titulo="Teste de hipótese: déficit/superávit médio sistemático">
          <p>Teste t de uma amostra (H₀: média = 0; H₁: média ≠ 0): <span className="font-mono text-[12.5px]">t = −3,667 · gl = 126 · p &lt; 0,001</span> — <b style={{ color: "var(--brick)" }}>rejeita-se H₀</b> (α = 0,05). Conclui-se que a média mensal do resultado primário é estatisticamente diferente de zero (−12.969,76 R$ mi/mês).</p>
        </Topico>

        <Topico n="C.4" titulo="Teste de hipótese: mudança da receita média entre períodos">
          <p>Comparação das receitas médias entre 2016-2020 e 2021-2025 (2026 excluído por ser ano incompleto), com teste t de Welch (variâncias desiguais):</p>
          <div className="rounded-xl overflow-x-auto mt-1" style={{ border: "1px solid var(--border)" }}>
            <table className="w-full text-sm min-w-[440px]">
              <thead><tr className="text-left text-[11px] tx-faint uppercase tracking-widest" style={{ background: "var(--chip-bg)" }}><th className="py-2.5 px-3">Grupo</th><th className="py-2.5 px-3 text-right">n</th><th className="py-2.5 px-3 text-right">Média (R$ mi/mês)</th><th className="py-2.5 px-3 text-right">Desvio padrão</th></tr></thead>
              <tbody>
                {WELCH.map((r, i) => (<tr key={r[0]} style={i ? { borderTop: "1px solid var(--border-soft)" } : undefined}><td className="py-2 px-3 font-semibold">{r[0]}</td><td className="py-2 px-3 text-right">{r[1]}</td><td className="py-2 px-3 text-right">{r[2]}</td><td className="py-2 px-3 text-right">{r[3]}</td></tr>))}
              </tbody>
            </table>
          </div>
          <p>Welch: <span className="font-mono text-[12.5px]">t = −11,333 · p &lt; 0,001</span> — <b style={{ color: "var(--brick)" }}>rejeita-se H₀</b> (efeito grande, d de Cohen = +2,07; alta de 63,1%). Confirmação não paramétrica (Mann-Whitney U = 211 · <span className="font-mono text-[12.5px]">p &lt; 0,001</span>) também rejeita H₀, convergindo com o resultado.</p>
          <p className="text-xs tx-faint">Premissas: independência razoável na série agregada; normalidade avaliada por Shapiro-Wilk em cada grupo (p = 0,0030 e 0,1014) — com n = 60 por grupo o teste t de Welch é robusto; variâncias desiguais tratadas pelo próprio teste.</p>
        </Topico>
      </div>

      <SectionHead index="05" eyebrow="Conclusão" title="Verificações realizadas" />
      <div className="panel p-5 sm:p-6">
        <ul className="flex flex-col gap-1.5 text-sm tx-mut leading-relaxed">
          {VERIFICACOES.map((t) => (<li key={t} className="flex gap-2"><span className="c-rec flex-none"><i className="fa-solid fa-check" aria-hidden="true"></i></span><span>{t}</span></li>))}
        </ul>
      </div>

      <SectionHead index="06" eyebrow="Acesso" title="Links do trabalho" />
      <div className="panel p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <a href={LINKS.projeto} target="_blank" rel="noreferrer" className="flex-1 flex items-center gap-3 p-4 rounded-xl" style={{ border: "1px solid var(--border)", background: "var(--chip-bg)" }}>
            <span className="icon-chip"><i className="fa-solid fa-globe" aria-hidden="true"></i></span>
            <div className="min-w-0">
              <p className="text-xs tx-faint uppercase tracking-widest">Projeto publicado</p>
              <p className="font-semibold text-sm truncate" style={{ color: "var(--blue)" }}>{LINKS.projeto}</p>
            </div>
          </a>
          <a href={LINKS.github} target="_blank" rel="noreferrer" className="flex-1 flex items-center gap-3 p-4 rounded-xl" style={{ border: "1px solid var(--border)", background: "var(--chip-bg)" }}>
            <span className="icon-chip"><i className="fa-brands fa-github" aria-hidden="true"></i></span>
            <div className="min-w-0">
              <p className="text-xs tx-faint uppercase tracking-widest">Repositório no GitHub</p>
              <p className="font-semibold text-sm truncate" style={{ color: "var(--blue)" }}>{LINKS.github}</p>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}
