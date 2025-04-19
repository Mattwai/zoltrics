import { onIntegrateDomain } from "@/actions/settings";
import { useToast } from "@/components/ui/use-toast";
import { AddDomainSchema } from "@/schemas/settings-schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { usePathname, useRouter } from "next/navigation";
import { z } from "zod";

import { useEffect, useState } from "react";
import { FieldValues, useForm } from "react-hook-form";

type AddDomainFormValues = z.infer<typeof AddDomainSchema>;

export const useDomain = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<AddDomainFormValues>({
    resolver: zodResolver(AddDomainSchema),
  });

  const pathname = usePathname();
  const { toast } = useToast();
  const [loading, setLoading] = useState<boolean>(false);
  const [isDomain, setIsDomain] = useState<string | undefined>(undefined);
  const router = useRouter();

  useEffect(() => {
    setIsDomain(pathname.split("/").pop());
  }, [pathname]);

  const onAddDomain = handleSubmit(async (values: FieldValues) => {
    setLoading(true);
    try {
      const domain = await onIntegrateDomain(values.domain);
  
      toast({
        title: domain?.status === 200 ? "Success" : "Error",
        description: domain?.message ?? "Something went wrong.",
      });
  
      if (domain?.status === 200) {
        reset();
        router.refresh();
      }
    } catch (error) {
      console.error("Domain integration failed", error);
      toast({
        title: "Error",
        description: "Failed to add domain. Try again.",
      });
    } finally {
      setLoading(false); // ✅ always turn off loading
    }
  });

  return {
    register,
    onAddDomain,
    errors,
    loading,
    isDomain,
  };
};
