"""Coleta SICONFI/STN para estados + DF (RREO bimestral + DCA anual).

Status: esqueleto da Fase 2 da expansão (ver docs/EXPANSAO-ESTADOS.md).
Gera o layout padrão por UF em public/data/uf/{slug}/, reutilizando os
mesmos nomes de arquivo da União para o frontend não precisar de fork.

A API do Tesouro limita o ritmo (HTTP 429). Por isso este script:
- espera 1.5s entre chamadas (ajuste com --delay),
- em 429/5xx espera o tempo do cabecalho Retry-After (ou backoff
  exponencial) e tenta de novo ate --tentativas vezes.

Fontes:
- SICONFI API pública: https://apidatalake.tesouro.gov.br/ords/siconfi/tt/rreo
- RREO Anexo 1 (Balanço Orçamentário): receitas realizadas x despesas empenhadas/pagas
- DCA Anexo I-C: detalhamento por órgão (quando disponível)

Uso:
  python scripts/coleta_siconfi.py --uf SP --anos 2022 2023 2024 2025 2026
  python scripts/coleta_siconfi.py --todos
  (sem --anos, usa a decada automatica de scripts/janela.py)
  (atalho Windows: menu.bat opcoes 2 e 3)

Saída:
  public/data/uf/{slug}/{mensal,anual,receitas,despesas}.json
  (poderes/orgaos preenchidos quando a UF publicar; senão, lista vazia válida)
"""
from __future__ import annotations
import argparse
import json
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path
from urllib.error import HTTPError

BASE = Path(__file__).resolve().parent.parent
OUT = BASE / "public" / "data" / "uf"

# Código IBGE por UF (usado no filtro da API SICONFI: cod_ibge LIKE '35%' p/ SP)
IBGE = {
    "ac": "12", "al": "27", "ap": "16", "am": "13", "ba": "29", "ce": "23",
    "df": "53", "es": "32", "go": "52", "ma": "21", "mt": "51", "ms": "50",
    "mg": "31", "pa": "15", "pb": "25", "pr": "41", "pe": "26", "pi": "22",
    "rj": "33", "rn": "24", "rs": "43", "ro": "11", "rr": "14", "sc": "42",
    "sp": "35", "se": "28", "to": "17",
}

RREO = "https://apidatalake.tesouro.gov.br/ords/siconfi/tt/rreo"
HEADERS = {"User-Agent": "Mozilla/5.0 (PainelFiscalBR-expansao-ufs)"}

PAUSA_PADRAO = 1.5   # segundos entre chamadas (evita o 429)
TENTATIVAS_PADRAO = 6


def get_json(url: str, params: dict, timeout: int = 60,
             tentativas: int = TENTATIVAS_PADRAO, rotulo: str = "") -> dict:
    """GET com retry em 429/5xx (respeita Retry-After + backoff exponencial)."""
    qs = urllib.parse.urlencode(params)
    espera = 5.0
    for t in range(1, tentativas + 1):
        try:
            req = urllib.request.Request(f"{url}?{qs}", headers=HEADERS)
            with urllib.request.urlopen(req, timeout=timeout) as r:
                return json.loads(r.read().decode("utf-8"))
        except HTTPError as e:
            if e.code == 429 or 500 <= e.code < 600:
                try:
                    espera = max(1.0, float(e.headers.get("Retry-After") or 0) or espera)
                except (TypeError, ValueError):
                    pass
                print(f"[{rotulo}] API pediu calma ({e.code}, tentativa {t}/{tentativas}): "
                      f"aguardando {espera:.0f}s...", file=sys.stderr, flush=True)
                time.sleep(espera)
                espera = min(espera * 2, 180)
                continue
            raise
    raise RuntimeError(f"[{rotulo}] API bloqueou apos {tentativas} tentativas. "
                       "Aguarde alguns minutos e rode de novo.")


def coleta_uf(slug: str, anos: list[int], pausa: float = PAUSA_PADRAO,
              tentativas: int = TENTATIVAS_PADRAO) -> dict:
    """Busca RREO Anexo 1 bimestral e converte para série mensal aproximada."""
    slug = slug.lower()
    ibge = IBGE[slug]
    linhas: list[dict] = []
    itens: list[dict] = []
    pulados = 0
    for ano in anos:
        for bimestre in range(1, 7):
            rotulo = f"{slug} {ano} b{bimestre}"
            try:
                # id_ente e obrigatorio: sem ele a API devolve lista vazia.
                # Para UFs, id_ente = codigo IBGE de 2 digitos (ex. SP=35).
                resp = get_json(RREO, {
                    "an_exercicio": ano,
                    "nr_periodo": bimestre,
                    "co_tipo_demonstrativo": "RREO",
                    "no_anexo": "RREO-Anexo 01",
                    "co_esfera": "E",  # Estadual
                    "id_ente": int(ibge),
                }, tentativas=tentativas, rotulo=rotulo)
                for item in resp.get("items", []):
                    cod = str(item.get("cod_ibge", "") or item.get("id_ente", ""))
                    if cod.startswith(ibge):
                        linhas.append({"ano": ano, "bimestre": bimestre, **item})
                        itens.append({"ano": ano, "bimestre": bimestre, **item})
            except Exception as e:
                pulados += 1
                print(f"[{rotulo}] aviso (periodo pulado): {e}", file=sys.stderr, flush=True)
            time.sleep(pausa)
    return {"slug": slug, "linhas_rreo": len(linhas), "anos": anos,
            "pulados": pulados, "itens": itens}


# ---- Mapeamento Anexo 1 -> schema do front (mesmo da Uniao) ----
COL_REC_BIM = "No Bimestre (b)"
COL_PAGA_ATE = "DESPESAS PAGAS ATÉ O BIMESTRE (j)"
CONTA_REC_TOTAL = "ReceitasExcetoIntraOrcamentarias"
CONTA_DES_TOTAL = "DespesasExcetoIntraOrcamentarias"

# (cod_conta EXATO, rotulo no painel) — as contas do Anexo 1 sao
# hierarquicas (ex.: OutrasDespesasCorrentes CONTEM DemaisDespesasCorrentes);
# so os agregados de nivel 1 entram aqui; o resto cai em "Demais".
MAP_REC = [
    ("ReceitaTributaria", "Impostos e Taxas"),
    ("TransferenciasCorrentes", "Transferências Correntes"),
    ("ReceitaDeContribuicoes", "Contribuições"),
    ("ReceitaPatrimonial", "Patrimonial"),
    ("ReceitaDeServicos", "Serviços"),
    ("ReceitasDeCapital", "Receitas de Capital"),
]
MAP_DES = [
    ("PessoalEEncargosSociais", "Pessoal e Encargos"),
    ("JurosEEncargosDaDivida", "Juros e Encargos da Dívida"),
    ("OutrasDespesasCorrentes", "Outras Despesas Correntes"),
    ("Investimentos", "Investimentos"),
    ("InversoesFinanceiras", "Inversões Financeiras"),
    ("AmortizacaoDaDivida", "Amortização da Dívida"),
]


def montar_uf(slug: str, itens: list[dict], anos: list[int]) -> Path:
    """Converte itens RREO em {mensal,anual,receitas,despesas}.json (+vazios)."""
    from datetime import date as _date
    por_bim: dict[tuple[int, int], dict] = {}
    for it in itens:
        por_bim.setdefault((it["ano"], it["bimestre"]), {})[
            (it.get("cod_conta", ""), it.get("coluna", ""))] = it.get("valor") or 0
    mensal, receitas, despesas = [], [], []
    pop = None
    for ano in sorted(anos):
        for bim in range(1, 7):
            vals = por_bim.get((ano, bim))
            if not vals:
                continue
            rec_bim = vals.get((CONTA_REC_TOTAL, COL_REC_BIM), 0) or 0
            # despesa paga NO bimestre = diferenca do acumulado
            ant = por_bim.get((ano, bim - 1)) if bim > 1 else None
            pago_ate = vals.get((CONTA_DES_TOTAL, COL_PAGA_ATE), 0) or 0
            pago_ant = (ant or {}).get((CONTA_DES_TOTAL, COL_PAGA_ATE), 0) or 0
            des_bim = max(0.0, pago_ate - pago_ant)
            mes = f"{ano}-{2 * bim - 1:02d}-01"  # 1o mes do bimestre
            mensal.append({"mes": mes, "bimestre": bim, "receita": round(rec_bim, 2),
                           "receita_total": round(rec_bim, 2),
                           "despesa": round(des_bim, 2),
                           "resultado_primario": round(rec_bim - des_bim, 2)})
            rec_det = {c: v for (c, col), v in vals.items() if col == COL_REC_BIM}
            tot_partes_r = 0.0
            for cod, rot in MAP_REC:
                v = rec_det.get(cod, 0) or 0
                tot_partes_r += v
                if v:
                    receitas.append({"mes": mes, "bimestre": bim,
                                     "tipo": rot, "valor": round(v, 2)})
            dem = rec_bim - tot_partes_r
            # residual (positivo ou negativo: ajustes/republicações) p/ reconciliar
            if abs(dem) > 1000:
                receitas.append({"mes": mes, "bimestre": bim, "tipo": "Demais receitas",
                                 "valor": round(dem, 2)})
            pag_det = {c: v for (c, col), v in vals.items() if col == COL_PAGA_ATE}
            pag_ant = {c: v for (c, col), v in (ant or {}).items()
                       if col == COL_PAGA_ATE} if ant else {}
            tot_partes = 0.0
            for cod, rot in MAP_DES:
                v = (pag_det.get(cod, 0) or 0) - (pag_ant.get(cod, 0) or 0)
                vv = max(0.0, v)
                tot_partes += vv
                if vv:
                    despesas.append({"mes": mes, "bimestre": bim,
                                     "funcao": rot, "valor": round(vv, 2)})
            dem_d = des_bim - tot_partes
            if abs(dem_d) > 1000:
                despesas.append({"mes": mes, "bimestre": bim, "funcao": "Demais despesas",
                                 "valor": round(dem_d, 2)})
    for it in itens:
        if it.get("populacao"):
            pop = it["populacao"]
    mensal.sort(key=lambda r: r["mes"])
    por_ano: dict[int, dict] = {}
    for r in mensal:
        a = int(r["mes"][:4])
        d = por_ano.setdefault(a, {"ano": a, "receita": 0.0, "receita_total": 0.0,
                                   "despesa": 0.0, "resultado_primario": 0.0})
        for k in ("receita", "receita_total", "despesa", "resultado_primario"):
            d[k] += r[k]
    anual = [{**v, **{k: round(v[k], 2) for k in
                      ("receita", "receita_total", "despesa", "resultado_primario")}}
             for v in sorted(por_ano.values(), key=lambda r: r["ano"])]
    dest = OUT / slug
    dest.mkdir(parents=True, exist_ok=True)
    for nome, dados in (("mensal", mensal), ("anual", anual),
                        ("receitas", receitas), ("despesas", despesas)):
        (dest / f"{nome}.json").write_text(
            json.dumps(dados, ensure_ascii=False), encoding="utf-8")
    for nome in ("poderes", "orgaos_todos", "emendas"):
        (dest / f"{nome}.json").write_text("[]", encoding="utf-8")
    (dest / "meta.json").write_text(json.dumps(
        {"slug": slug, "status": "disponivel", "fonte": "SICONFI/RREO Anexo 1",
         "periodicidade": "bimestral (mes = 1o mes do bimestre)",
         "resultado": "orcamentario (receita realizada - despesa paga)",
         "populacao_ref": pop, "atualizado_em": _date.today().isoformat(),
         "anos": sorted({int(r["mes"][:4]) for r in mensal})},
        ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"[{slug}] mensal={len(mensal)} receitas={len(receitas)} "
          f"despesas={len(despesas)} pop={pop}", flush=True)
    return dest


def exporta_placeholder(slug: str, anos: list[int]) -> Path:
    """Cria estrutura vazia válida para a UF aparecer como 'em coleta' sem quebrar o front."""
    dest = OUT / slug
    dest.mkdir(parents=True, exist_ok=True)
    for nome in ("mensal", "anual", "receitas", "despesas", "poderes", "orgaos_todos"):
        (dest / f"{nome}.json").write_text("[]", encoding="utf-8")
    (dest / "meta.json").write_text(json.dumps(
        {"slug": slug, "status": "em-coleta", "fonte": "SICONFI/RREO", "anos": anos},
        ensure_ascii=False, indent=2), encoding="utf-8")
    return dest


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--uf", default=None, help="Sigla da UF, ex. SP")
    ap.add_argument("--todos", action="store_true")
    ap.add_argument("--anos", nargs="+", type=int, default=None,
                    help="anos explicitos; omitido = decada automatica (ano atual - 10 ate ano atual)")
    ap.add_argument("--delay", type=float, default=PAUSA_PADRAO,
                    help=f"pausa entre chamadas em segundos (padrao {PAUSA_PADRAO})")
    ap.add_argument("--tentativas", type=int, default=TENTATIVAS_PADRAO,
                    help=f"retries por chamada em caso de 429 (padrao {TENTATIVAS_PADRAO})")
    a = ap.parse_args()
    from janela import janela as janela_padrao
    anos = a.anos or janela_padrao()
    alvos = sorted(IBGE) if a.todos else [(a.uf or "sp").lower()]
    total_linhas = total_pulados = 0
    for slug in alvos:
        print(f"== {slug.upper()} ==", flush=True)
        try:
            res = coleta_uf(slug, anos, pausa=a.delay, tentativas=a.tentativas)
            print(f"   linhas RREO: {res['linhas_rreo']}"
                  + (f" ({res['pulados']} periodos pulados apos retry)" if res["pulados"] else ""))
            total_linhas += res["linhas_rreo"]
            total_pulados += res["pulados"]
            if res["linhas_rreo"]:
                print(f"   -> {montar_uf(slug, res['itens'], anos)}", flush=True)
            else:
                print(f"   -> {exporta_placeholder(slug, anos)}", flush=True)
        except Exception as e:
            print(f"   erro na API, gerando placeholder: {e}")
            print(f"   -> {exporta_placeholder(slug, anos)}", flush=True)
    print(f"Total: {total_linhas} linhas RREO, {total_pulados} periodos pulados.")
    if total_linhas == 0:
        print("NENHUMA linha coletada: a API do Tesouro bloqueou o ritmo (429). "
              "Aguarde ~15 min e rode de novo, ou aumente --delay (ex. --delay 3).")
    print("OK. UFs com linhas RREO ganham mensal/anual/receitas/despesas (bimestral);")
    print("sem linhas, placeholder 'em-coleta'. Habilite a UF em src/lib/entes.js.")
