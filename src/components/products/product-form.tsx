"use client";

import { Loader } from "@/components/loader";
import { Button } from "@/components/ui/button";
import { useProducts } from "@/hooks/settings/use-settings";
import { useRouter } from "next/navigation";
import FormGenerator from "../forms/form-generator";
import { Card } from "../ui/card";

type CreateProductFormProps = {
  id: string;
  onProductAdded?: () => void;
};

export const CreateProductForm = ({
  id,
  onProductAdded,
}: CreateProductFormProps) => {
  const router = useRouter();
  const { onCreateNewProduct, register, errors, loading } = useProducts(id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onCreateNewProduct(e);
    router.refresh(); // Refresh the page to show the new product
    onProductAdded?.(); // Call the callback if provided
  };

  return (
    <form
      className="mt-3 w-full flex flex-col gap-6 py-6"
      onSubmit={handleSubmit}
    >
      <Card className="p-6 space-y-6">
        <div className="space-y-4">
          <FormGenerator
            inputType="input"
            register={register}
            label="Product Name"
            name="name"
            errors={errors}
            placeholder="Enter product name"
            type="text"
            className="w-full"
          />
          <FormGenerator
            inputType="input"
            register={register}
            label="Price (NZD)"
            name="price"
            errors={errors}
            placeholder="0.00"
            type="number"
            step="0.01"
            min="0"
            className="w-full"
          />
        </div>
        <Button 
          type="submit" 
          className="w-full bg-purple hover:bg-purple/90 text-white"
          disabled={loading}
        >
          <Loader loading={loading}>Create Product</Loader>
        </Button>
      </Card>
    </form>
  );
};
