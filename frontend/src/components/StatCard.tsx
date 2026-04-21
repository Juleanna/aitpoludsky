import { Counter } from "./Counter";
import { Sparkline } from "./Sparkline";

type Props = {
  label: string;
  value: number;
  prefix?: string;
  fractionDigits?: number;
  data?: number[];
};

export function StatCard({ label, value, prefix = "", fractionDigits = 0, data }: Props) {
  return (
    <div className="stat-classic">
      <div className="stat-head">
        <span className="stat-label">{label}</span>
      </div>
      <div className="stat-value mono">
        <Counter value={value} prefix={prefix} fractionDigits={fractionDigits} />
      </div>
      {data && data.length > 0 && (
        <div className="stat-spark">
          <Sparkline data={data} width={300} height={40} />
        </div>
      )}
    </div>
  );
}
