export function SectionShell({
  sidebar,
  children,
}: {
  sidebar: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full">
      <aside className="hidden lg:block w-64 shrink-0 border-r border-[#E9E1D3] bg-[#FAF7F2] px-4 py-6">
        {sidebar}
      </aside>
      <div className="min-w-0 flex-1 bg-[#FAF7F2] px-6 py-8 text-[#1F1E1D]">{children}</div>
    </div>
  );
}
