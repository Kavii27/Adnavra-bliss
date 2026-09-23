export function SectionShell({
  sidebar,
  children,
}: {
  sidebar: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full">
      <aside className="hidden lg:block w-64 shrink-0 border-r border-[#e6dcc8] bg-[#faf6ef] px-4 py-6">
        {sidebar}
      </aside>
      <div className="min-w-0 flex-1 bg-[#0F1729] px-6 py-8 text-[#3a2f22]">{children}</div>
    </div>
  );
}
