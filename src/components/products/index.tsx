import { getMonthName } from "@/lib/utils";
import { Plus, Trash2 } from "lucide-react";
import { SideSheet } from "../sheet";
import { DataTable } from "../table";
import TabsMenu from "../tabs/index";
import { TableCell, TableRow } from "../ui/table";
import { TabsContent } from "../ui/tabs";
import { CreateProductForm } from "./product-form";
import { Switch } from "../ui/switch";
import { Button } from "../ui/button";
import { useToast } from "../ui/use-toast";
import { onDeleteProduct, onUpdateProductStatus } from "@/actions/settings";

type Props = {
  products: {
    id: string;
    name: string;
    pricing: {
      price: number;
    } | null;
    status: {
      isLive: boolean;
    } | null;
    createdAt: Date | string;
    domainId: string | null;
  }[];
  id: string;
  onProductAdded?: () => void;
};

const product_header = ["Name", "Price (NZD)", "Status", "Created", "Actions"]

const ProductTable = ({ id, products, onProductAdded }: Props) => {
  const { toast } = useToast();
  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return {
      day: dateObj.getDate(),
      month: dateObj.getMonth(),
      year: dateObj.getFullYear()
    };
  };

  const handleStatusChange = async (productId: string, isLive: boolean) => {
    try {
      const result = await onUpdateProductStatus(productId, isLive);
      if (result?.status === 200) {
        toast({
          title: "Success",
          description: result.message,
        });
        onProductAdded?.();
      } else {
        toast({
          title: "Error",
          description: result?.message || "Failed to update product status",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error updating product status:", error);
      toast({
        title: "Error",
        description: "Failed to update product status",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this product?")) {
      return;
    }

    try {
      const result = await onDeleteProduct(productId);
      if (result?.status === 200) {
        toast({
          title: "Success",
          description: result.message,
        });
        onProductAdded?.();
      } else {
        toast({
          title: "Error",
          description: result?.message || "Failed to delete product",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error deleting product:", error);
      toast({
        title: "Error",
        description: "Failed to delete product",
        variant: "destructive",
      });
    }
  };

  const filteredProducts = {
    all: products,
    live: products.filter(p => p.status?.isLive),
    deactivated: products.filter(p => !p.status?.isLive),
  };

  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="rounded-full bg-gray-100 p-3 mb-4">
        <Plus className="h-6 w-6 text-gray-400" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-1">No products found</h3>
      <p className="text-sm text-gray-500 mb-4">Get started by adding your first product</p>
      <SideSheet
        description="Add products to your store and set them live to accept payments from customers."
        title="Add a product"
        className="inline-flex items-center gap-2 bg-purple px-4 py-2 text-white font-semibold rounded-lg text-sm hover:bg-purple/90 transition-colors"
        trigger={
          <>
            <Plus size={20} />
            <span>Add Product</span>
          </>
        }
      >
        <CreateProductForm id={id} onProductAdded={onProductAdded} />
      </SideSheet>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Products</h2>
          <p className="mt-1 text-sm text-gray-500">
            Add products to your store and set them live to accept payments from customers.
          </p>
        </div>
        <SideSheet
          description="Add products to your store and set them live to accept payments from customers."
          title="Add a product"
          className="inline-flex items-center gap-2 bg-purple px-4 py-2 text-white font-semibold rounded-lg text-sm hover:bg-purple/90 transition-colors"
          trigger={
            <>
              <Plus size={20} />
              <span>Add Product</span>
            </>
          }
        >
          <CreateProductForm id={id} onProductAdded={onProductAdded} />
        </SideSheet>
      </div>

      <TabsMenu
        className="w-full"
        triggers={[
          {
            label: "All products",
            count: filteredProducts.all.length,
          },
          { 
            label: "Live",
            count: filteredProducts.live.length,
          },
          { 
            label: "Deactivated",
            count: filteredProducts.deactivated.length,
          },
        ]}
      >
        <TabsContent value="All products">
          {filteredProducts.all.length === 0 ? (
            <EmptyState />
          ) : (
            <DataTable headers={product_header}>
              {filteredProducts.all.map((product) => {
                const date = formatDate(product.createdAt);
                return (
                  <TableRow key={product.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>${(product.pricing?.price ?? 0).toFixed(2)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={product.status?.isLive ?? false}
                          onCheckedChange={(checked) => handleStatusChange(product.id, checked)}
                          className="data-[state=checked]:bg-purple data-[state=unchecked]:bg-gray-200"
                        />
                        <span className="text-sm text-gray-500">
                          {product.status?.isLive ? "Live" : "Draft"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-500">
                        {date.day} {getMonthName(date.month)} {date.year}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(product.id)}
                        className="hover:bg-red-50 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </DataTable>
          )}
        </TabsContent>
        <TabsContent value="Live">
          {filteredProducts.live.length === 0 ? (
            <EmptyState />
          ) : (
            <DataTable headers={product_header}>
              {filteredProducts.live.map((product) => {
                const date = formatDate(product.createdAt);
                return (
                  <TableRow key={product.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>${(product.pricing?.price ?? 0).toFixed(2)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={product.status?.isLive ?? false}
                          onCheckedChange={(checked) => handleStatusChange(product.id, checked)}
                          className="data-[state=checked]:bg-purple data-[state=unchecked]:bg-gray-200"
                        />
                        <span className="text-sm text-gray-500">
                          {product.status?.isLive ? "Live" : "Draft"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-500">
                        {date.day} {getMonthName(date.month)} {date.year}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(product.id)}
                        className="hover:bg-red-50 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </DataTable>
          )}
        </TabsContent>
        <TabsContent value="Deactivated">
          {filteredProducts.deactivated.length === 0 ? (
            <EmptyState />
          ) : (
            <DataTable headers={product_header}>
              {filteredProducts.deactivated.map((product) => {
                const date = formatDate(product.createdAt);
                return (
                  <TableRow key={product.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>${(product.pricing?.price ?? 0).toFixed(2)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={product.status?.isLive ?? false}
                          onCheckedChange={(checked) => handleStatusChange(product.id, checked)}
                          className="data-[state=checked]:bg-purple data-[state=unchecked]:bg-gray-200"
                        />
                        <span className="text-sm text-gray-500">
                          {product.status?.isLive ? "Live" : "Draft"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-500">
                        {date.day} {getMonthName(date.month)} {date.year}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(product.id)}
                        className="hover:bg-red-50 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </DataTable>
          )}
        </TabsContent>
      </TabsMenu>
    </div>
  );
};

export default ProductTable;
