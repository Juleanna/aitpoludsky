type Props = {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
};

export function Sparkline({ data, width = 300, height = 40, color = "var(--accent)" }: Props) {
  if (data.length === 0) {
    return <svg width={width} height={height} />;
  }
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const step = data.length > 1 ? width / (data.length - 1) : 0;

  const points = data
    .map((v, i) => {
      const x = i * step;
      const y = height - ((v - min) / range) * height * 0.85 - height * 0.075;
      return `${x},${y}`;
    })
    .join(" ");

  const lastIdx = data.length - 1;
  const lastX = lastIdx * step;
  const lastY = height - ((data[lastIdx] - min) / range) * height * 0.85 - height * 0.075;

  return (
    <svg width={width} height={height} style={{ display: "block", overflow: "visible" }}>
      <polyline points={`${points} ${width},${height} 0,${height}`} fill={color} opacity={0.08} />
      <polyline points={points} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" />
      <circle cx={lastX} cy={lastY} r={3} fill={color} />
    </svg>
  );
}
