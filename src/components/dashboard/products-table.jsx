"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ProductDialog } from "@/components/dashboard/product-dialog";
import { StockDialog } from "@/components/dashboard/stock-dialog";
import { formatMoney } from "@/lib/stores";
import { cn } from "@/lib/utils";

const ALL = "all";

export function ProductsTable({ storeId, currency, storeThreshold, products, initialLow = false }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState(ALL);
  const [status, setStatus] = useState(ALL);
  const [lowOnly, setLowOnly] = useState(initialLow);
  const [productDialog, setProductDialog] = useState(null); // "new" or a product
  const [stockProduct, setStockProduct] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [actionError, setActionError] = useState("");

  const categories = useMemo(
    () => [...new Set(products.map((p) => p.category).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
    [products]
  );

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
    if (product.isActive && !window.confirm(`Deactivate "${product.name}"? It will no longer appear on the POS.`)) {
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
    router.refresh();
  }

  const addButton = (
    <Button onClick={() => setProductDialog("new")}>
      <Plus data-icon="inline-start" />
      Add Product
    </Button>
  );

  return (
    <div className="space-y-4">
      {products.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-16 text-center">
          <p className="max-w-sm text-sm text-muted-foreground">
            No products yet. Add your first product to get started.
          </p>
          {addButton}
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-52 flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or SKU"
                aria-label="Search products"
                className="pl-8"
              />
            </div>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-40" aria-label="Filter by category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All categories</SelectItem>
                {categories.map((c) => (
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
            <Button
              variant={lowOnly ? "default" : "outline"}
              aria-pressed={lowOnly}
              onClick={() => setLowOnly(!lowOnly)}
            >
              Low stock only
            </Button>
            <div className="ml-auto">{addButton}</div>
          </div>

          {actionError && (
            <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {actionError}
            </p>
          )}

          <div className="rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                      No products match your filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((p) => (
                    <TableRow
                      key={p.id}
                      className={cn(p.isLowStock && "bg-amber-50 hover:bg-amber-100/70", !p.isActive && "opacity-60")}
                    >
                      <TableCell>
                        <div className="font-medium">{p.name}</div>
                        {p.sku && <div className="text-xs text-muted-foreground">SKU {p.sku}</div>}
                      </TableCell>
                      <TableCell>{p.category || <span className="text-muted-foreground">-</span>}</TableCell>
                      <TableCell className="text-right">{formatMoney(p.price, currency)}</TableCell>
                      <TableCell className="text-right">
                        <span className={cn(p.isLowStock && "font-semibold text-amber-700")}>{p.stock}</span>
                        {p.isLowStock && (
                          <Badge variant="outline" className="ml-2 border-amber-400 text-amber-700">
                            {p.stock === 0 ? "Out of stock" : "Low stock"}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={p.isActive ? "default" : "secondary"}>
                          {p.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1.5">
                          <Button size="sm" variant="outline" onClick={() => setProductDialog(p)}>
                            Edit
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setStockProduct(p)}>
                            Adjust Stock
                          </Button>
                          <Button
                            size="sm"
                            variant={p.isActive ? "destructive" : "secondary"}
                            disabled={busyId === p.id}
                            onClick={() => toggleActive(p)}
                          >
                            {p.isActive ? "Deactivate" : "Reactivate"}
                          </Button>
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
    </div>
  );
}
