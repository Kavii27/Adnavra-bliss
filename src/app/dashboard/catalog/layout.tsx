import { SectionShell } from "@/components/dashboard/section-shell";
import { CatalogSubNav } from "./sub-nav";

export default function CatalogLayout({ children }: { children: React.ReactNode }) {
  return (
    <SectionShell
      sidebar={
        <div className="space-y-6">
          <div>
            <CatalogSubNav
              links={[
                { href: "/dashboard/catalog/service-menu", label: "Service menu" },
                { href: "/dashboard/catalog/packages", label: "Packages" },
                { href: "/dashboard/catalog/products", label: "Products" },
              ]}
            />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-[#a89880] mb-2">Inventory</p>
            <CatalogSubNav
              links={[
                { href: "/dashboard/catalog/stocktakes", label: "Stocktakes" },
                { href: "/dashboard/catalog/stock-orders", label: "Stock orders" },
                { href: "/dashboard/catalog/suppliers", label: "Suppliers" },
              ]}
            />
          </div>
        </div>
      }
    >
      {children}
    </SectionShell>
  );
}
