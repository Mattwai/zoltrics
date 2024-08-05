"use client";

import { Button } from "@/components/ui/button";

import { Loader } from "@/components/loader";
import { useProducts } from "@/hooks/settings/use-settings";
import FormGenerator from "../forms/form-generator";

type CreateProductFormProps = {
  id: string;
};

export const CreateProductForm = ({ id }: CreateProductFormProps) => {
  const { onCreateNewProduct, register, errors, loading } = useProducts(id);
  return (
    <form
      className="mt-3 w-full flex flex-col gap-5 py-10"
      onSubmit={onCreateNewProduct}
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
        label="Price"
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
