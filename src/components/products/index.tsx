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
    price: number;
    isLive: boolean;
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
    live: products.filter(p => p.isLive),
    deactivated: products.filter(p => !p.isLive),
  };

  return (
    <div>
      <div>
        <h2 className="font-bold text-2xl">Products</h2>
        <p className="text-sm font-light">
          Add products to your store and set them live to accept payments from
          customers.
        </p>
      </div>
      <TabsMenu
        className="w-full flex justify-start"
        triggers={[
          {
            label: "All products",
          },
          { label: "Live" },
          { label: "Deactivated" },
        ]}
        button={
          <div className="flex-1 flex justify-end">
            <SideSheet
              description="Add products to your store and set them live to accept payments from
          customers."
              title="Add a product"
              className="flex items-center gap-2 bg-orange px-4 py-2 text-black font-semibold rounded-lg text-sm"
              trigger={
                <>
                  <Plus size={20} className="text-white" />
                  <p className="text-white">Add Product</p>
                </>
              }
            >
              <CreateProductForm id={id} onProductAdded={onProductAdded} />
            </SideSheet>
          </div>
        }
      >
        <TabsContent value="All products">
          <DataTable headers={product_header}>
            {filteredProducts.all.map((product) => {
              const date = formatDate(product.createdAt);
              return (
                <TableRow key={product.id}>
                  <TableCell>{product.name}</TableCell>
                  <TableCell>${product.price}</TableCell>
                  <TableCell>
                    <Switch
                      checked={product.isLive}
                      onCheckedChange={(checked) => handleStatusChange(product.id, checked)}
                    />
                  </TableCell>
                  <TableCell>
                    {date.day}{" "}
                    {getMonthName(date.month)}{" "}
                    {date.year}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(product.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </DataTable>
        </TabsContent>
        <TabsContent value="Live">
          <DataTable headers={product_header}>
            {filteredProducts.live.map((product) => {
              const date = formatDate(product.createdAt);
              return (
                <TableRow key={product.id}>
                  <TableCell>{product.name}</TableCell>
                  <TableCell>${product.price}</TableCell>
                  <TableCell>
                    <Switch
                      checked={product.isLive}
                      onCheckedChange={(checked) => handleStatusChange(product.id, checked)}
                    />
                  </TableCell>
                  <TableCell>
                    {date.day}{" "}
                    {getMonthName(date.month)}{" "}
                    {date.year}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(product.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </DataTable>
        </TabsContent>
        <TabsContent value="Deactivated">
          <DataTable headers={product_header}>
            {filteredProducts.deactivated.map((product) => {
              const date = formatDate(product.createdAt);
              return (
                <TableRow key={product.id}>
                  <TableCell>{product.name}</TableCell>
                  <TableCell>${product.price}</TableCell>
                  <TableCell>
                    <Switch
                      checked={product.isLive}
                      onCheckedChange={(checked) => handleStatusChange(product.id, checked)}
                    />
                  </TableCell>
                  <TableCell>
                    {date.day}{" "}
                    {getMonthName(date.month)}{" "}
                    {date.year}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(product.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </DataTable>
        </TabsContent>
      </TabsMenu>
    </div>
  );
};

export default ProductTable;
