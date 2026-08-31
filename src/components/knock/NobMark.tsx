const FACE = "/nob-face.svg";

export function NobMark({
  className = "",
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  if (compact) {
    return (
      <img
        src={FACE}
        alt="Nob"
        width={64}
        height={56}
        className={`nob-chip h-14 w-16 object-contain object-left ${className}`}
      />
    );
  }

  return (
    <div
      className={`hard-shadow sticker inline-flex rotate-[-3deg] items-center gap-1.5 border-[3px] border-ink bg-nob py-1 pr-3 pl-1 ${className}`}
    >
      <img src={FACE} alt="" width={44} height={40} className="h-10 w-11 object-contain" />
      <span className="nob-word">nob</span>
    </div>
  );
}
