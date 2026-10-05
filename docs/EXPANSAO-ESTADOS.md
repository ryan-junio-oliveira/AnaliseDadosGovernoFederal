# Expansão para 26 estados + DF — plano técnico

Situação atual: só a **União** tem dados (`public/data/*.json`, fontes RTN + SIOP).
Este plano permite adicionar as 27 UFs **sem reescrever o frontend**.

## 1. Arquitetura (decisão)

- **Um layout de dados por ente**: `public/data/uf/{slug}/{mensal,anual,receitas,despesas,poderes,orgaos_todos}.json`
  com o **mesmo schema** da União. O front já resolve a URL via `src/lib/entes.js:dataUrl(ente, file)`.
- **Catálogo de entes**: `src/lib/entes.js` (27 entradas; 1 disponível, 26 em breve) + `EnteSelector.jsx` no header.
- **Rota futura**: `/?ente=sp` (query param, sem router). Quando o JSON da UF existir, o selector habilita.
- **Vercel**: `vercel.json` já tem `rewrites` `/dados/:ente/:file → /data/:file` e cache de 1h + SWR para `/data/*`.

## 2. Fontes por UF

| Dado | Fonte oficial | Acesso |
|---|---|---|
| Resultado, receita, despesa bimestral | SICONFI — RREO Anexo 1 | API pública `apidatalake.tesouro.gov.br/ords/siconfi/tt/rreo` (sem token; `id_ente` obrigatório — sem ele a API devolve vazio; limite de 1 req/s, com retry em 429) |
| Despesa por função / órgão | SICONFI — RREO Anexo 2 + DCA | mesma API + dumps anuais |
| Poderes (Leg/Jud/MPU/DPE) | RREO por Poder + portais TCE estaduais | ETL por UF (varia) |

> Granularidade: RREO é **bimestral**. Estratégia: publicar `mensal.json` com valores bimestrais
> (campo `mes` no 1º mês do bimestre + `bimestre: n`) e o gráfico agrega por bimestre quando `ente != uniao`.
> Alternativa (Fase 3): interpolar mensalmente com nota metodológica explícita.

## 3. ETL

- `scripts/coleta_siconfi.py --uf SP --anos 2022 ...` — esqueleto pronto; busca RREO e gera placeholders válidos.
- Passo pendente: mapear contas SICONFI → categorias do painel:
  - `receitas`: Impostos, Transferências correntes (FPE/Fundeb), Contribuições, Patrimonial, Capital.
  - `despesas`: Pessoal, Juros/Dívida, Outras correntes, Investimentos, Inversões.
- `scripts/validar.py` já valida schema; estender para `public/data/uf/*/*.json` no CI.
- `scripts/atualizar.py`: adicionar loop `--ufs` após RTN/SIOP (mantém União intacta).

## 4. Roadmap sugerido

1. **Piloto (1 UF, ex. SP)**: mapear Anexo 1 → `mensal/anual/receitas/despesas`, publicar `uf/sp/`, habilitar no `ENTES` (`status: "disponivel"`), adicionar `?ente=sp`. Atalho Windows: `menu.bat` → opção 4 (não rode de dentro da pasta `scripts/`).
2. **Lote 1 (5 UFs grandes: SP, RJ, MG, RS, PR)**: validar divergências TCE x SICONFI.
3. **Lote 2 (restante + DF)**: DF usa SICONFI esfera "E" + fundo constitucional (atenção metodológica).
4. **Comparador**: página `/comparar?entes=sp,rj,mg` com per-capita (IBGE) e % RCL — usa mesma agregação `resumoMensal`.
5. **Automação**: cron semanal já existe (`.github/workflows/atualizar-dados.yml`); incluir SICONFI.

## 5. Riscos e notas

- RREO tem **republicações**: guardar `versao` + `atualizado_em` em `meta.json` por UF.
- Valores **nominais** (seguir padrão atual) + opcional IPCA-E deflacionado em Fase 3.
- Cada TCE tem portal próprio para órgãos/Poderes — aceitar `poderes.json = []` (front já trata lista vazia).
- Licenças: dados SICONFI são públicos; manter atribuição "Fonte: SICONFI/STN" por UF.
