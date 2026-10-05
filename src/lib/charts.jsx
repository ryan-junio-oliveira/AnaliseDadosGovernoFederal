import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
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
  Legend
);

ChartJS.defaults.font.family = "Inter, system-ui, sans-serif";

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
