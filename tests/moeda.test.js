import { describe, expect, it } from "vitest";
import {
  escalaParaValores,
  formatBRL,
  multiplicadorDeEscala,
  numeroDeTexto,
  paraReais,
  serieGrafico,
} from "../src/lib/moeda.js";
import {
  agregar,
  anualizar,
  cobertura,
  comparativo,
  construirDeflator,
  periodicidade,
  resumoMensal,
} from "../src/lib/data.js";

describe("paraReais: identifica tri/bi/mi/mil em JSON e CSV", () => {
  it("números já em reais passam intactos", () => {
    expect(paraReais(13200000000)).toBe(13200000000);
    expect(paraReais(0)).toBe(0);
  });
  it("strings com escala pt-BR", () => {
    expect(paraReais("13,2 tri")).toBe(13.2e12);
    expect(paraReais("13.200 bi")).toBe(13.2e12); // milhar pt-BR × bi = tri
    expect(paraReais("450 mi")).toBe(450e6);
    expect(paraReais("R$ 13,2 bilhões")).toBe(13.2e9);
    expect(paraReais("900k")).toBe(900e3);
  });
  it("strings numéricas pt-BR e en", () => {
    expect(paraReais("1.234,56")).toBeCloseTo(1234.56);
    expect(paraReais("1,234.56")).toBeCloseTo(1234.56);
    expect(paraReais("13200000000")).toBe(13.2e9);
  });
  it("nulos e vazios viram zero (neutro p/ somas)", () => {
    expect(paraReais(null)).toBe(0);
    expect(paraReais("")).toBe(0);
    expect(paraReais(undefined)).toBe(0);
  });
  it("origem explícita multiplica", () => {
    expect(paraReais(13.2, { origem: "tri" })).toBe(13.2e12);
    expect(paraReais("450", { origem: "mi" })).toBe(450e6);
  });
});

describe("numeroDeTexto", () => {
  it("distingue milhar pt-BR de decimal", () => {
    expect(numeroDeTexto("13.200")).toBe(13200);
    expect(numeroDeTexto("13,2")).toBeCloseTo(13.2);
    expect(numeroDeTexto("13.200,50")).toBeCloseTo(13200.5);
  });
});

describe("multiplicadorDeEscala", () => {
  it("resolve sinônimos", () => {
    expect(multiplicadorDeEscala("tri")).toBe(1e12);
    expect(multiplicadorDeEscala("trilhões")).toBe(1e12);
    expect(multiplicadorDeEscala("bi")).toBe(1e9);
    expect(multiplicadorDeEscala("bilhões")).toBe(1e9);
    expect(multiplicadorDeEscala("mi")).toBe(1e6);
    expect(multiplicadorDeEscala("R$")).toBe(1);
    expect(multiplicadorDeEscala("safra")).toBeNull();
  });
});

describe("escalaParaValores: unidade segue o tamanho do dado", () => {
  it("tri acima de 1 tri, bi acima de 1 bi", () => {
    expect(escalaParaValores([13.2e12]).unidade).toBe("R$ tri");
    expect(escalaParaValores([320e9]).unidade).toBe("R$ bi");
    expect(escalaParaValores([450e6]).unidade).toBe("R$ mi");
    expect(escalaParaValores([999])).toEqual(
      expect.objectContaining({ divisor: 1 })
    );
  });
  it("pizza e barras do mesmo conjunto usam a mesma unidade", () => {
    const vals = [13.2e12, 5e12, 1.1e12];
    const a = escalaParaValores(vals);
    const b = escalaParaValores([Math.max(...vals)]);
    expect(a.unidade).toBe(b.unidade);
  });
});

describe("formatBRL", () => {
  it("13,2 tri não vira 13.200 bi", () => {
    expect(formatBRL(13.2e12)).toContain("tri");
    expect(formatBRL(13.2e12)).not.toContain("bi");
  });
  it("infinito/NaN viram travessão", () => {
    expect(formatBRL(NaN)).toBe("—");
    expect(formatBRL("abc")).toBe("—");
  });
});

describe("serieGrafico", () => {
  it("divide todos pela mesma escala e devolve a unidade", () => {
    const s = serieGrafico([2e12, 1e12]);
    expect(s.unidade).toBe("R$ tri");
    expect(s.dados).toEqual([2, 1]);
  });
});

describe("cobertura: separa década de cobertura parcial", () => {
  it("rotula mês/ano/tri", () => {
    expect(cobertura([{ mes: "2016-01-01" }, { mes: "2026-08-01" }]).rotulo).toBe("jan/2016 – ago/2026");
    expect(cobertura([{ ano: 2023 }, { ano: 2024 }], "ano").rotulo).toBe("2023 – 2024");
    expect(cobertura([{ tri: "2026-T2" }], "tri").rotulo).toBe("2026-T2");
    expect(cobertura([]).rotulo).toBe("sem dados");
  });
  it("conta anos distintos presentes (não o intervalo)", () => {
    const fx = cobertura([{ mes: "2024-01-01" }, { mes: "2026-05-01" }]);
    expect(fx.anos.size).toBe(2);
    expect(fx.rotulo).toBe("jan/2024 – mai/2026");
  });
});

describe("periodicidade", () => {
  it("detecta bimestral pelo campo bimestre", () => {
    expect(periodicidade([{ mes: "2024-01-01" }])).toBe(1);
    expect(periodicidade([{ mes: "2024-01-01", bimestre: 1 }])).toBe(2);
    expect(periodicidade([])).toBe(1);
  });
});

describe("agregações respeitam periodicidade (UF bimestral)", () => {
  const bim = [
    { mes: "2024-01-01", bimestre: 1, receita: 60, despesa: 30, resultado_primario: 30 },
    { mes: "2024-03-01", bimestre: 2, receita: 60, despesa: 30, resultado_primario: 30 },
  ];
  it("média mensal divide pelos meses cobertos, não pelos pontos", () => {
    expect(resumoMensal(bim, new Set([2024])).med).toBe(15); // 60/4 meses
    expect(resumoMensal(bim, new Set([2024]), undefined, 1).med).toBe(30);
  });
  it("comparativo usa 6 bimestres e divide por 12 meses", () => {
    const base = [
      { mes: "2023-01-01", bimestre: 1, receita: 10, despesa: 10, resultado_primario: 0 },
      { mes: "2023-03-01", bimestre: 2, receita: 10, despesa: 10, resultado_primario: 0 },
      { mes: "2023-05-01", bimestre: 3, receita: 10, despesa: 10, resultado_primario: 0 },
      { mes: "2023-07-01", bimestre: 4, receita: 10, despesa: 10, resultado_primario: 0 },
      { mes: "2023-09-01", bimestre: 5, receita: 10, despesa: 10, resultado_primario: 0 },
      { mes: "2023-11-01", bimestre: 6, receita: 10, despesa: 10, resultado_primario: 0 },
      ...bim,
    ];
    const c = comparativo(base, new Set([2024]), undefined, 2);
    expect(c).not.toBeNull();
    expect(c.rec).toBe(60);
    expect(c.med).toBe(5); // 60/12 meses
  });
  it("agregar soma valores (idempotente p/ reais)", () => {
    const rows = [
      { mes: "2024-01-01", tipo: "A", valor: "1,5 bi" },
      { mes: "2024-03-01", tipo: "A", valor: 500e6 },
    ];
    const [a] = agregar(rows, "tipo", new Set([2024]));
    expect(a.valor).toBe(2e9);
  });
});

describe("construirDeflator", () => {
  const cm = [
    { mes: "2026-06-01", ipca_m: 0.1 },
    { mes: "2026-07-01", ipca_m: 0.2 },
    { mes: "2026-08-01", ipca_m: 0.3 },
  ];
  it("base é o último mês do filtro e fator da base é 1", () => {
    const d = construirDeflator(cm, new Set([2026]));
    expect(d.rotulo).toBe("R$ de ago/2026");
    expect(d.f("2026-08-01")).toBeCloseTo(1);
    expect(d.f("2026-06-01")).toBeGreaterThan(1);
  });
  it("sem IPCA retorna null", () => {
    expect(construirDeflator([], new Set([2026]))).toBeNull();
    expect(construirDeflator([{ mes: "2026-01-01" }], new Set([2026]))).toBeNull();
  });
});

describe("anualizar (modo real recompõe do mensal)", () => {
  it("soma por ano com fator", () => {
    const rows = [
      { mes: "2024-01-01", receita: 100, despesa: 60, resultado_primario: 40 },
      { mes: "2024-03-01", receita: 100, despesa: 60, resultado_primario: 40 },
    ];
    const an = anualizar(rows, () => 2);
    expect(an).toEqual([{ ano: 2024, receita: 400, despesa: 240, resultado_primario: 160 }]);
  });
});
