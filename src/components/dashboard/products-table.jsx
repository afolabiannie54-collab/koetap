"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Ban, Package, Pencil, Plus, RotateCcw, Search, SlidersHorizontal, Tags } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FormError } from "@/components/auth/form-error";
import { KBadge } from "@/components/ui/koetap/KBadge";
import { useConfirm } from "@/components/ui/koetap/confirm-dialog";
import { EmptyState } from "@/components/ui/koetap/empty-state";
import { useToast } from "@/components/ui/koetap/toast";
import { FadeImage } from "@/components/ui/koetap/fade-image";
import { KTooltip } from "@/components/ui/koetap/tooltip";
import { imageThumb } from "@/lib/images";
import { CategoryManager } from "@/components/dashboard/category-manager";
import { ProductDialog } from "@/components/dashboard/product-dialog";
import { StockDialog } from "@/components/dashboard/stock-dialog";
import { formatMoney } from "@/lib/stores";
import { cn } from "@/lib/utils";

const ALL = "all";

// Icon-only with a tooltip on larger screens; icon + words on phones, where there's no hover.
function RowAction({ label, icon: Icon, onClick, variant = "ghost", tone, disabled }) {
  return (
    <KTooltip label={label} align="end">
      <Button
        size="sm"
        variant={variant}
        onClick={onClick}
        disabled={disabled}
        aria-label={label}
        className={cn("size-8 px-0 sm:size-9", tone === "danger" && "text-error-ink hover:bg-error-soft")}
      >
        <Icon />
        <span className="sr-only">{label}</span>
      </Button>
    </KTooltip>
  );
}

export function ProductsTable({ storeId, currency, storeThreshold, products, categories, initialLow = false }) {
  const router = useRouter();
  const toast = useToast();
  const [confirm, confirmDialog] = useConfirm();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState(ALL);
  const [status, setStatus] = useState(ALL);
  const [lowOnly, setLowOnly] = useState(initialLow);
  const [productDialog, setProductDialog] = useState(null); // "new" or a product
  const [stockProduct, setStockProduct] = useState(null);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [actionError, setActionError] = useState("");

  // The store's own category list (created in "Categories"), not whatever happens to be typed on products
  const categoryNames = useMemo(() => categories.map((c) => c.name), [categories]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      if (q && !p.name.toLowerCase().includes(q) && !p.sku.toLowerCase().includes(q)) return false;
      if (category !== ALL && p.category !== category) return false;
      if (status === "active" && !p.isActive) return false;
      if (status === "inactive" && p.isActive) return false;
      if (lowOnly && !p.isLowStock) return false;
      return true;
    });
  }, [products, search, category, status, lowOnly]);

  async function toggleActive(product) {
    if (
      product.isActive &&
      !(await confirm({
        title: `Deactivate "${product.name}"?`,
        description:
          "It will disappear from the POS straight away, so it can't be sold. Its stock and history are kept, and you can reactivate it any time.",
        confirmLabel: "Deactivate",
        destructive: true,
      }))
    ) {
      return;
    }

    setActionError("");
    setBusyId(product.id);
    const url = `/api/stores/${storeId}/products/${product.id}`;
    // Deactivating is a DELETE (soft delete); reactivating is a PATCH.
    const res = product.isActive
      ? await fetch(url, { method: "DELETE" })
      : await fetch(url, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isActive: true }),
        });
    setBusyId(null);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setActionError(data.error || "Could not update the product");
      return;
    }
    toast.success(`${product.name} ${product.isActive ? "deactivated" : "reactivated"}`);
    router.refresh();
  }

  const addButton = (
    <KTooltip label="Add a product to this store" align="end">
      <Button onClick={() => setProductDialog("new")}>
        <Plus />
        Add Product
      </Button>
    </KTooltip>
  );

  return (
    <div className="animate-contentIn space-y-5">
      {products.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No products yet"
          description="No products yet. Add your first product to get started."
        >
          {addButton}
        </EmptyState>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-52 flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or SKU"
                aria-label="Search products"
                className="pl-10"
              />
            </div>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-40" aria-label="Filter by category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All categories</SelectItem>
                {categoryNames.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-36" aria-label="Filter by status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <KTooltip label="Show only products that are running low or sold out">
              <Button
                variant={lowOnly ? "default" : "secondary"}
                aria-pressed={lowOnly}
                onClick={() => setLowOnly(!lowOnly)}
              >
                Low stock only
              </Button>
            </KTooltip>
            <div className="ml-auto flex items-center gap-2">
              <KTooltip label="Create and edit the categories your products are sorted into" align="end">
                <Button variant="secondary" onClick={() => setCategoriesOpen(true)}>
                  <Tags />
                  Categories
                </Button>
              </KTooltip>
              {addButton}
            </div>
          </div>

          {actionError && <FormError>{actionError}</FormError>}

          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden md:table-cell">Category</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead className="hidden sm:table-cell">Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                      No products match your filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((p) => (
                    <TableRow key={p.id} className={cn(!p.isActive && "opacity-60")}>
                      {/* Low stock rows get an amber edge on the left */}
                      <TableCell className={cn("whitespace-normal", p.isLowStock && "shadow-[inset_4px_0_0_var(--warning)]")}>
                        <div className="flex items-center gap-3">
                          {p.imageUrl ? (
                            <FadeImage
                              src={imageThumb(p.imageUrl, { w: 80, h: 80 })}
                              alt=""
                              className="size-10 shrink-0 rounded-lg border border-border object-cover"
                            />
                          ) : (
                            <span
                              aria-hidden="true"
                              className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-sm font-bold text-muted-foreground"
                            >
                              {p.name.trim().charAt(0).toUpperCase()}
                            </span>
                          )}
                          <div className="min-w-0">
                            <div className="font-medium">{p.name}</div>
                            <div className="text-xs text-muted-foreground">
                              <span className="md:hidden">{p.category}</span>
                              {p.category && p.sku && <span className="md:hidden"> · </span>}
                              {p.sku && `SKU ${p.sku}`}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {p.category || <span className="text-muted-foreground">-</span>}
                      </TableCell>
                      <TableCell className="text-right">{formatMoney(p.price, currency)}</TableCell>
                      <TableCell className="text-right">
                        <span className={cn(p.isLowStock && "font-semibold text-warning-ink")}>{p.stock}</span>
                        {p.isLowStock && (
                          <Badge variant="warning" className="ml-2 hidden sm:inline-flex">
                            {p.stock === 0 ? "Out of stock" : "Low stock"}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <KBadge variant={p.isActive ? "active" : "inactive"}>{p.isActive ? "Active" : "Inactive"}</KBadge>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <RowAction label="Edit product details" icon={Pencil} onClick={() => setProductDialog(p)} />
                          <RowAction label="Adjust stock: restock, correct or write off" icon={SlidersHorizontal} onClick={() => setStockProduct(p)} />
                          <RowAction
                            label={p.isActive ? "Deactivate: hide it from the POS" : "Reactivate: sell it again"}
                            icon={p.isActive ? Ban : RotateCcw}
                            variant="ghost"
                            tone={p.isActive ? "danger" : undefined}
                            disabled={busyId === p.id}
                            onClick={() => toggleActive(p)}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      {productDialog && (
        <ProductDialog
          storeId={storeId}
          product={productDialog === "new" ? undefined : productDialog}
          storeThreshold={storeThreshold}
          categories={categories}
          onClose={() => setProductDialog(null)}
        />
      )}
      {stockProduct && (
        <StockDialog storeId={storeId} product={stockProduct} onClose={() => setStockProduct(null)} />
      )}
      {categoriesOpen && (
        <CategoryManager storeId={storeId} categories={categories} onClose={() => setCategoriesOpen(false)} />
      )}
      {confirmDialog}
    </div>
  );
}
