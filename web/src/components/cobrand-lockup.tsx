type Props = { height?: number };

export function CoBrandLockup({ height = 24 }: Props) {
  return (
    <div className="flex items-center gap-3">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/faceprep.svg" alt="FACE Prep" style={{ height }} className="w-auto block" />
      <span
        className="bg-gray-300 shrink-0"
        style={{ width: 1, height: Math.round(height * 0.8) }}
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/freshsales.png" alt="Freshsales" style={{ height }} className="w-auto block" />
    </div>
  );
}
