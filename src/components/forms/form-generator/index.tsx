import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ErrorMessage } from "@hookform/error-message";
import { FieldErrors, FieldValues, UseFormRegister, Path } from "react-hook-form";
import { cn } from "@/lib/utils";

type Props<T extends FieldValues = any> = {
  type: "text" | "email" | "password" | "number";
  inputType: "select" | "input" | "textarea";
  options?: { value: string; label: string; id: string }[];
  label?: string;
  placeholder: string;
  register: UseFormRegister<T>;
  name: Path<T>;
  errors: FieldErrors<T>;
  lines?: number;
  form?: string;
  defaultValue?: string;
  disabled?: boolean;
  className?: string;
  step?: string;
  min?: string;
  setValueAs?: (value: any) => any;
};

const FormGenerator = <T extends FieldValues = any>({
  errors,
  inputType,
  name,
  placeholder,
  defaultValue,
  register,
  type,
  form,
  label,
  lines,
  options,
  disabled,
  className,
  step,
  min,
  setValueAs,
}: Props<T>) => {
  switch (inputType) {
    case "input":
    default:
      return (
        <Label className={cn("flex flex-col gap-2", className)} htmlFor={`input-${label}`}>
          {label && label}
          <Input
            id={`input-${label}`}
            type={type}
            placeholder={placeholder}
            form={form}
            defaultValue={defaultValue}
            disabled={disabled}
            step={step}
            min={min}
            {...register(name, { setValueAs })}
          />
          <ErrorMessage
            errors={errors}
            name={name as any}
            render={({ message }) => (
              <p className="text-red-400 mt-2">
                {message === "Required" ? "" : message}
              </p>
            )}
          />
        </Label>
      );
    case "select":
      return (
        <Label className={cn("flex flex-col gap-2", className)} htmlFor={`select-${label}`}>
          {label && label}
          <select form={form} id={`select-${label}`} disabled={disabled} {...register(name)}>
            {options?.length &&
              options.map((option) => (
                <option value={option.value} key={option.id}>
                  {option.label}
                </option>
              ))}
          </select>
          <ErrorMessage
            errors={errors}
            name={name as any}
            render={({ message }) => (
              <p className="text-red-400 mt-2">
                {message === "Required" ? "" : message}
              </p>
            )}
          />
        </Label>
      );
    case "textarea":
      return (
        <Label className={cn("flex flex-col gap-2", className)} htmlFor={`input-${label}`}>
          {label && label}
          <Textarea
            form={form}
            id={`input-${label}`}
            placeholder={placeholder}
            disabled={disabled}
            {...register(name)}
            rows={lines}
            defaultValue={defaultValue}
          />
          <ErrorMessage
            errors={errors}
            name={name as any}
            render={({ message }) => (
              <p className="text-red-400 mt-2">
                {message === "Required" ? "" : message}
              </p>
            )}
          />
        </Label>
      );
  }
};

export default FormGenerator;
