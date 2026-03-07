export default function SectionLabel({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
      {children}
    </div>
  );
}
