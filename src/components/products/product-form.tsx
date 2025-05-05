"use client";

import { Loader } from "@/components/loader";
import { Button } from "@/components/ui/button";
import { useProducts } from "@/hooks/settings/use-settings";
import { useRouter } from "next/navigation";
import FormGenerator from "../forms/form-generator";

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
      className="mt-3 w-full flex flex-col gap-5 py-10"
      onSubmit={handleSubmit}
    >
      <FormGenerator
        inputType="input"
        register={register}
        label="Name"
        name="name"
        errors={errors}
        placeholder="Your product name"
        type="text"
      />
      <FormGenerator
        inputType="input"
        register={register}
        label="Price (NZD)"
        name="price"
        errors={errors}
        placeholder="0.00"
        type="text"
      />
      <Button type="submit" className="w-full">
        <Loader loading={loading}>Create Product</Loader>
      </Button>
    </form>
  );
};
