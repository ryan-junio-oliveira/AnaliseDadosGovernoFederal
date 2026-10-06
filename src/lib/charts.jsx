import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from "chart.js";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import { chartPalette } from "./theme";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

ChartJS.defaults.font.family = "Inter, system-ui, sans-serif";
ChartJS.defaults.plugins.tooltip.backgroundColor = "#101014";
ChartJS.defaults.plugins.tooltip.borderColor = "rgba(255,255,255,.14)";
ChartJS.defaults.plugins.tooltip.borderWidth = 1;
ChartJS.defaults.plugins.tooltip.padding = 12;
ChartJS.defaults.plugins.tooltip.boxPadding = 5;
ChartJS.defaults.plugins.tooltip.titleFont = { weight: "600", size: 12 };
ChartJS.defaults.plugins.tooltip.bodyFont = { size: 12 };
// Tooltip padrao: numero em pt-BR + unidade do dataset (ex. dataset.unit = "R$ bi").
// Acaba com o "6.800,01 de quê?": todo valor vem com sua unidade.
const _fmtBR = (v) => (typeof v === "number" ? v.toLocaleString("pt-BR", { maximumFractionDigits: 2 }) : String(v ?? "—"));
ChartJS.defaults.plugins.tooltip.callbacks = {
  ...(ChartJS.defaults.plugins.tooltip.callbacks || {}),
  label: (ctx) => {
    const nome = ctx.dataset.label ? `${ctx.dataset.label}: ` : "";
    const u = ctx.dataset.unit ? ` ${ctx.dataset.unit}` : "";
    const p = ctx.parsed;
    const v = typeof p === "number" ? p : p?.y ?? p?.x ?? ctx.raw;
    return `${nome}${_fmtBR(v)}${u}`;
  },
};

export { Bar, Doughnut, Line };

/** aplica cores do tema nos ticks/grade/legenda */
export function themed(theme, options) {
  const p = chartPalette(theme);
  ChartJS.defaults.color = p.tick;
  ChartJS.defaults.borderColor = p.grid;
  return {
    ...options,
    plugins: {
      ...(options.plugins || {}),
      legend: {
        ...(options.plugins?.legend || {}),
        labels: {
          boxWidth: 12,
          usePointStyle: true,
          color: p.legend,
          ...(options.plugins?.legend?.labels || {}),
        },
      },
    },
  };
}
