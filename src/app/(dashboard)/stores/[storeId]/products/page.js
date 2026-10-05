import connectDB from "@/lib/db";
import Product from "@/models/Product";
import { getStorePageData } from "@/lib/store-page";
import { serializeProduct } from "@/lib/products";
import { getStoreCategories } from "@/lib/categories";
import { ProductsTable } from "@/components/dashboard/products-table";

export const metadata = { title: "Products | Koetap" };

export default async function ProductsPage({ params, searchParams }) {
  const { storeId } = await params;
  const { low } = await searchParams;
  const { store } = await getStorePageData(storeId);

  await connectDB();
  const [docs, categories] = await Promise.all([
    Product.find({ storeId: store.id }).sort({ name: 1 }).collation({ locale: "en" }).lean(),
    getStoreCategories({ _id: store.id, businessId: store.businessId }),
  ]);
  const products = docs.map((p) => serializeProduct(p, store.lowStockThreshold));

  return (
    <ProductsTable
      storeId={store.id}
      currency={store.currency}
      storeThreshold={store.lowStockThreshold}
      products={products}
      categories={categories}
      initialLow={low === "1"}
    />
  );
}
