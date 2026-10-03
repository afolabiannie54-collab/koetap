import connectDB from "@/lib/db";
import InventoryLog from "@/models/InventoryLog";
import "@/models/Product";
import "@/models/User";
import { getStorePageData } from "@/lib/store-page";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

export const metadata = { title: "Inventory Log | Koetap" };

const LIMIT = 200;

const TYPE_LABELS = { sale: "Sale", adjustment: "Adjustment", restock: "Restock" };

const formatDate = (d) =>
  new Date(d).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" });

export default async function InventoryLogPage({ params }) {
  const { storeId } = await params;
  const { store } = await getStorePageData(storeId);

  await connectDB();
  const logs = await InventoryLog.find({ storeId: store.id })
    .sort({ createdAt: -1 })
    .limit(LIMIT)
    .populate("productId", "name")
    .populate("performedBy", "name email")
    .lean();

  if (logs.length === 0) {
    return (
      <div className="rounded-xl border border-dashed py-16 text-center text-sm text-muted-foreground">
        No stock changes yet. Adding products, restocking and sales will show up here.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Change</TableHead>
              <TableHead className="text-right">Previous Stock</TableHead>
              <TableHead className="text-right">New Stock</TableHead>
              <TableHead>Performed By</TableHead>
              <TableHead>Reason</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => (
              <TableRow key={log._id.toString()}>
                <TableCell className="whitespace-nowrap">{formatDate(log.createdAt)}</TableCell>
                <TableCell className="font-medium">{log.productId?.name ?? "Deleted product"}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{TYPE_LABELS[log.type] ?? log.type}</Badge>
                </TableCell>
                <TableCell
                  className={cn(
                    "text-right font-medium",
                    log.delta > 0 ? "text-emerald-600" : "text-red-600"
                  )}
                >
                  {log.delta > 0 ? `+${log.delta}` : log.delta}
                </TableCell>
                <TableCell className="text-right">{log.previousStock}</TableCell>
                <TableCell className="text-right">{log.newStock}</TableCell>
                <TableCell>{log.performedBy?.name ?? log.performedBy?.email ?? "Unknown"}</TableCell>
                <TableCell className="text-muted-foreground">{log.reason || "-"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {logs.length === LIMIT && (
        <p className="text-xs text-muted-foreground">Showing the latest {LIMIT} changes.</p>
      )}
    </div>
  );
}
