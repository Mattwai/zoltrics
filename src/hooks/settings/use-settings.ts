import {
  onCreateFilterQuestions,
  onCreateHelpDeskQuestion,
  onCreateKnowledgeBaseEntry,
  onGetAllKnowledgeBaseEntries,
  onCreateNewDomainService,
  onDeleteUserDomain,
  onGetAllFilterQuestions,
  onGetAllHelpDeskQuestions,
  onUpdateDomain,
  onUpdateWelcomeMessage,
  onDeleteHelpDeskQuestion,
  onUpdateHelpDeskQuestion,
} from "@/actions/settings";
import { useToast } from "@/components/ui/use-toast";
import {
  AddServiceProps,
  AddServiceSchema,
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
import { HelpDesk } from "@prisma/client";

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
  const [isQuestions, setIsQuestions] = useState<{
    id: string;
    question: string;
    answer: string;
  }[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<HelpDeskQuestionsProps>({
    resolver: zodResolver(HelpDeskQuestionsSchema),
  });

  const onSubmitQuestion = handleSubmit(async (data) => {
    try {
      setLoading(true);
      const response = await onCreateHelpDeskQuestion(id, data.question, data.answer);

      if (response?.status === 200) {
        toast({
          title: "Success",
          description: "Question created successfully",
        });
        reset();
        await getAllQuestions();
      } else {
        toast({
          title: "Error",
          description: response?.message || "Something went wrong",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong",
      });
    } finally {
      setLoading(false);
    }
  });

  const onDeleteQuestion = async (questionId: string) => {
    try {
      setLoading(true);
      const response = await onDeleteHelpDeskQuestion(questionId);

      if (response?.status === 200) {
        toast({
          title: "Success",
          description: "Question deleted successfully",
        });
        await getAllQuestions();
      } else {
        toast({
          title: "Error",
          description: response?.message || "Something went wrong",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong",
      });
    } finally {
      setLoading(false);
    }
  };

  const onUpdateQuestion = async (questionId: string, question: string, answer: string) => {
    try {
      setLoading(true);
      const response = await onUpdateHelpDeskQuestion(questionId, question, answer);

      if (response?.status === 200) {
        toast({
          title: "Success",
          description: "Question updated successfully",
        });
        await getAllQuestions();
      } else {
        toast({
          title: "Error",
          description: response?.message || "Something went wrong",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong",
      });
    } finally {
      setLoading(false);
    }
  };

  const getAllQuestions = async () => {
    try {
      setLoading(true);
      const response = await onGetAllHelpDeskQuestions(id);
      if (response?.status === 200) {
        setIsQuestions(response.questions);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getAllQuestions();
  }, [id]);

  return {
    register,
    errors,
    onSubmitQuestion,
    isQuestions,
    loading,
    onDeleteQuestion,
    onUpdateQuestion,
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

export const useServices = (userId: string) => {
  const { toast } = useToast();
  const {
    handleSubmit,
    register: originalRegister,
    formState: { errors },
  } = useForm<AddServiceProps>({
    resolver: zodResolver(AddServiceSchema),
  });

  const onCreateNewService = handleSubmit(async (values) => {
    try {
      const result = await onCreateNewDomainService(
        userId,
        values.name,
        Number(values.price)
      );

      if (result?.status === 200) {
        toast({
          title: "Success",
          description: "Service created successfully",
        });
      } else {
        toast({
          title: "Error",
          description: result?.message || "Failed to create service",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error creating service:", error);
      toast({
        title: "Error",
        description: "Failed to create service. Please try again.",
        variant: "destructive",
      });
    }
  });

  const register = (name: keyof AddServiceProps) => originalRegister(name, {
    setValueAs: (value) => name === 'price' ? Number(value) : value
  });

  return {
    onCreateNewService,
    register,
    errors,
    loading: false,
  };
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
