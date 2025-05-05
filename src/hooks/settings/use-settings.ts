import {
  onCreateFilterQuestions,
  onCreateHelpDeskQuestion,
  onCreateKnowledgeBaseEntry,
  onGetAllKnowledgeBaseEntries,
  onCreateNewDomainProduct,
  onDeleteUserDomain,
  onGetAllFilterQuestions,
  onGetAllHelpDeskQuestions,
  onUpdateDomain,
  onUpdateWelcomeMessage,
} from "@/actions/settings";
import { useToast } from "@/components/ui/use-toast";
import {
  AddProductProps,
  AddProductSchema,
  DomainSettingsProps,
  DomainSettingsSchema,
  FilterQuestionsProps,
  FilterQuestionsSchema,
  HelpDeskQuestionsProps,
  HelpDeskQuestionsSchema,
} from "@/schemas/settings-schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

export const useThemeMode = () => {
  const { setTheme, theme } = useTheme();
  return {
    setTheme,
    theme,
  };
};

export const useSettings = (id: string) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<DomainSettingsProps>({
    resolver: zodResolver(DomainSettingsSchema),
  });
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState<boolean>(false);
  const [deleting, setDeleting] = useState<boolean>(false);

  const onUpdateSettings = handleSubmit(async (values) => {
    setLoading(true);
    if (values.domain) {
      const domain = await onUpdateDomain(id, values.domain);
      if (domain) {
        toast({
          title: "Success",
          description: domain.message,
        });
      }
    }
    if (values.welcomeMessage) {
      const message = await onUpdateWelcomeMessage(values.welcomeMessage, id);
      if (message) {
        toast({
          title: "Success",
          description: message.message,
        });
      }
    }
    reset();
    router.refresh();
    setLoading(false);
  });

  const onDeleteDomain = async () => {
    setDeleting(true);
    const deleted = await onDeleteUserDomain(id);
    if (deleted) {
      toast({
        title: "Success",
        description: deleted.message,
      });
      setDeleting(false);
      router.refresh();
    }
  };
  return {
    register,
    onUpdateSettings,
    errors,
    loading,
    onDeleteDomain,
    deleting,
  };
};

export const useHelpDesk = (id: string) => {
  const {
    register,
    formState: { errors },
    handleSubmit,
    reset,
  } = useForm<HelpDeskQuestionsProps>({
    resolver: zodResolver(HelpDeskQuestionsSchema),
  });
  const { toast } = useToast();

  const [loading, setLoading] = useState<boolean>(false);
  const [isQuestions, setIsQuestions] = useState<
    { id: string; question: string; answer: string }[]
  >([]);
  const onSubmitQuestion = handleSubmit(async (values) => {
    setLoading(true);
    const question = await onCreateHelpDeskQuestion(
      id,
      values.question,
      values.answer
    );
    if (question) {
      setIsQuestions(question.questions!);
      toast({
        title: question.status == 200 ? "Success" : "Error",
        description: question.message,
      });
      setLoading(false);
      reset();
    }
  });

  const onGetQuestions = async () => {
    setLoading(true);
    const questions = await onGetAllHelpDeskQuestions(id);
    if (questions) {
      setIsQuestions(questions.questions);
      setLoading(false);
    }
  };

  useEffect(() => {
    onGetQuestions();
  }, []);

  return {
    register,
    onSubmitQuestion,
    errors,
    isQuestions,
    loading,
  };
};

export const useFilterQuestions = (userId: string) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FilterQuestionsProps>({
    resolver: zodResolver(FilterQuestionsSchema),
  });
  const { toast } = useToast();
  const [loading, setLoading] = useState<boolean>(false);
  const [isQuestions, setIsQuestions] = useState<
    { id: string; question: string }[]
  >([]);

  const onAddFilterQuestions = handleSubmit(async (values) => {
    setLoading(true);
    const questions = await onCreateFilterQuestions(userId, values.question);
    if (questions) {
      setIsQuestions(questions.questions!);
      toast({
        title: questions.status == 200 ? "Success" : "Error",
        description: questions.message,
      });
      reset();
      setLoading(false);
    }
  });

  const onGetQuestions = async () => {
    setLoading(true);
    const questions = await onGetAllFilterQuestions(userId);
    if (questions) {
      setIsQuestions(questions.questions);
      setLoading(false);
    }
  };

  useEffect(() => {
    onGetQuestions();
  }, []);

  return {
    loading,
    onAddFilterQuestions,
    register,
    errors,
    isQuestions,
  };
};

export const useProducts = (domainId: string) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState<boolean>(false);
  const {
    register,
    reset,
    formState: { errors },
    handleSubmit,
  } = useForm<AddProductProps>({
    resolver: zodResolver(AddProductSchema),
  });

  const onCreateNewProduct = handleSubmit(async (values) => {
    try {
      setLoading(true);
      const product = await onCreateNewDomainProduct(
        domainId,
        values.name,
        values.price
      );
      if (product) {
        reset();
        toast({
          title: "Success",
          description: product.message,
        });
        setLoading(false);
      }
    } catch (error) {
      console.log(error);
    }
  });

  return { onCreateNewProduct, register, errors, loading };
};

const KnowledgeBaseSchema = z.object({
  title: z.string().min(1, { message: "Title cannot be empty" }),
  content: z.string().min(1, { message: "Content cannot be empty" }),
  category: z.string().optional(),
});

type KnowledgeBaseProps = z.infer<typeof KnowledgeBaseSchema>;

export const useKnowledgeBase = (id: string) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<KnowledgeBaseProps>({
    resolver: zodResolver(KnowledgeBaseSchema),
  });
  const { toast } = useToast();
  const [loading, setLoading] = useState<boolean>(false);
  const [entries, setEntries] = useState<{ id: string; title: string; content: string; category?: string }[]>([]);

  const onSubmitEntry = handleSubmit(async (values) => {
    setLoading(true);
    const entry = await onCreateKnowledgeBaseEntry(
      id,
      values.title,
      values.content,
      values.category
    );
    if (entry) {
      setEntries(entry.entries!.map(e => ({ ...e, category: e.category || undefined })));
      toast({
        title: entry.status === 200 ? "Success" : "Error",
        description: entry.message,
      });
      reset();
    }
    setLoading(false);
  });

  const onGetEntries = async () => {
    setLoading(true);
    const result = await onGetAllKnowledgeBaseEntries(id);
    if (result) {
      setEntries(result.entries.map(e => ({ ...e, category: e.category || undefined })));
    }
    setLoading(false);
  };

  useEffect(() => {
    onGetEntries();
  }, []);

  return {
    register,
    errors,
    onSubmitEntry,
    entries,
    loading,
  };
};
