import { getMonthName } from "@/lib/utils";
import { Plus } from "lucide-react";
import { SideSheet } from "../sheet";
import { DataTable } from "../table";
import TabsMenu from "../tabs/index";
import { TableCell, TableRow } from "../ui/table";
import { TabsContent } from "../ui/tabs";
import { CreateProductForm } from "./product-form";

type Props = {
  products: {
    id: string;
    name: string;
    price: number;
    createdAt: Date | string;
    domainId: string | null;
  }[];
  id: string;
  onProductAdded?: () => void;
};

const ProductTable = ({ id, products, onProductAdded }: Props) => {
  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return {
      day: dateObj.getDate(),
      month: dateObj.getMonth(),
      year: dateObj.getFullYear()
    };
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
          <DataTable headers={["Name", "Price", "Created"]}>
            {products.map((product) => {
              const date = formatDate(product.createdAt);
              return (
                <TableRow key={product.id}>
                  <TableCell>{product.name}</TableCell>
                  <TableCell>${product.price}</TableCell>
                  <TableCell className="text-right">
                    {date.day}{" "}
                    {getMonthName(date.month)}{" "}
                    {date.year}
                  </TableCell>
                </TableRow>
              );
            })}
          </DataTable>
        </TabsContent>
        <TabsContent value="Live">
          <DataTable headers={["Name", "Price", "Created"]}>
            {products.map((product) => {
              const date = formatDate(product.createdAt);
              return (
                <TableRow key={product.id}>
                  <TableCell>{product.name}</TableCell>
                  <TableCell>${product.price}</TableCell>
                  <TableCell className="text-right">
                    {date.day}{" "}
                    {getMonthName(date.month)}{" "}
                    {date.year}
                  </TableCell>
                </TableRow>
              );
            })}
          </DataTable>
        </TabsContent>
        <TabsContent value="Deactivated">
          <DataTable headers={["Name", "Price", "Created"]}>
            {products.map((product) => {
              const date = formatDate(product.createdAt);
              return (
                <TableRow key={product.id}>
                  <TableCell>{product.name}</TableCell>
                  <TableCell>${product.price}</TableCell>
                  <TableCell className="text-right">
                    {date.day}{" "}
                    {getMonthName(date.month)}{" "}
                    {date.year}
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
