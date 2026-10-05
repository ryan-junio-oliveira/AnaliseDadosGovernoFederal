import { Line } from "../lib/charts";
import { useTheme } from "../lib/theme";

export function SectionHead({ icon, iconStyle, eyebrow, eyebrowColor, title }) {
  return (
    <div className="flex items-center gap-3.5 mt-12 mb-5">
      <span className="icon-chip" style={iconStyle}>
        <i className={`fa-solid ${icon}`}></i>
      </span>
      <div>
        <p className="eyebrow" style={eyebrowColor ? { color: eyebrowColor } : undefined}>
          {eyebrow}
        </p>
        <h2 className="font-display font-bold text-2xl">{title}</h2>
      </div>
    </div>
  );
}

export function Seg({ active, onClick, children }) {
  return (
    <button className={`segbtn${active ? " on" : ""}`} onClick={onClick}>
      {children}
    </button>
  );
}

export function Spark({ values, color, fill = true, height = 46, id }) {
  const { theme } = useTheme();
  if (!values?.length) return <div style={{ height }} />;
  return (
    <div style={{ height }}>
      <Line
        key={`${id}-${theme}`}
        data={{
          labels: values.map((_, i) => i),
          datasets: [
            {
              data: values,
              borderColor: color,
              borderWidth: 2,
              pointRadius: 0,
              tension: 0.35,
              fill,
              backgroundColor: fill ? `${color}26` : "transparent",
            },
          ],
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false }, tooltip: { enabled: false } },
          scales: { x: { display: false }, y: { display: false } },
          animation: { duration: 400 },
        }}
      />
    </div>
  );
}
