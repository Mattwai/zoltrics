"use client";
import Accordion from "@/components/accordian";
import { Loader } from "@/components/loader";
import Section from "@/components/section-label";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { useHelpDesk } from "@/hooks/settings/use-settings";
import FormGenerator from "../form-generator";
import { Plans } from "@/types/prisma";
import { checkHelpdeskFeature } from "@/lib/subscription-checks";
import { Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";

type Props = {
  id: string;
  plan: Plans;
};

const HelpDesk = ({ id, plan }: Props) => {
  const { register, errors, onSubmitQuestion, isQuestions, loading, onDeleteQuestion, onUpdateQuestion } =
    useHelpDesk(id);

  const [editingQuestion, setEditingQuestion] = useState<{
    id: string;
    question: string;
    answer: string;
  } | null>(null);

  const editForm = useForm({
    defaultValues: {
      question: "",
      answer: "",
    },
  });

  const maxFaqs = checkHelpdeskFeature(plan, "maxFaqs");
  const canAddMore = typeof maxFaqs === "number" && (maxFaqs === -1 || isQuestions.length < maxFaqs);

  const handleEdit = (question: { id: string; question: string; answer: string }) => {
    setEditingQuestion(question);
    editForm.reset({
      question: question.question,
      answer: question.answer,
    });
  };

  const handleDelete = async (questionId: string) => {
    if (window.confirm("Are you sure you want to delete this question?")) {
      await onDeleteQuestion(questionId);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingQuestion) {
      const values = editForm.getValues();
      await onUpdateQuestion(editingQuestion.id, values.question, values.answer);
      setEditingQuestion(null);
    }
  };

  return (
    <Card className="w-full grid grid-cols-1 lg:grid-cols-2">
      <CardContent className="p-6 border-r-[1px]">
        <CardTitle>Help Desk</CardTitle>
        <div className="mt-2 mb-4">
          <p className="text-sm text-gray-500">
            {typeof maxFaqs === "number" && maxFaqs !== -1
              ? `You can add up to ${maxFaqs} FAQs on your current plan.`
              : "You can add unlimited FAQs on your current plan."}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Current FAQs: {isQuestions.length}
            {typeof maxFaqs === "number" && maxFaqs !== -1
              ? ` / ${maxFaqs}`
              : ""}
          </p>
        </div>
        {editingQuestion ? (
          <form onSubmit={handleUpdate} className="flex flex-col gap-6 mt-4">
            <div className="flex flex-col gap-3">
              <Section
                label="Question"
                message="Edit your question"
              />
              <FormGenerator
                inputType="input"
                register={editForm.register}
                errors={editForm.formState.errors}
                form="help-desk-form"
                name="question"
                placeholder="Type your question"
                type="text"
              />
            </div>
            <div className="flex flex-col gap-3">
              <Section
                label="Answer to question"
                message="Edit your answer"
              />
              <FormGenerator
                inputType="textarea"
                register={editForm.register}
                errors={editForm.formState.errors}
                form="help-desk-form"
                name="answer"
                placeholder="Type your answer"
                type="text"
                lines={5}
              />
            </div>
            <div className="flex gap-2">
              <Button
                type="submit"
                className="bg-purple hover:bg-purple hover:opacity-70 transition duration-150 ease-in-out text-white font-semibold"
              >
                Save Changes
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingQuestion(null)}
              >
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <form onSubmit={onSubmitQuestion} className="flex flex-col gap-6 mt-4">
            <div className="flex flex-col gap-3">
              <Section
                label="Question"
                message="Add a question that you believe is frequently asked."
              />
              <FormGenerator
                inputType="input"
                register={register}
                errors={errors}
                form="help-desk-form"
                name="question"
                placeholder="Type your question"
                type="text"
                disabled={!canAddMore}
              />
            </div>
            <div className="flex flex-col gap-3">
              <Section
                label="Answer to question"
                message="The answer for the question above"
              />
              <FormGenerator
                inputType="textarea"
                register={register}
                errors={errors}
                form="help-desk-form"
                name="answer"
                placeholder="Type your answer"
                type="text"
                lines={5}
                disabled={!canAddMore}
              />
            </div>
            {!canAddMore && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm text-amber-800">
                  You have reached the maximum number of FAQs for your plan. Upgrade to add more:
                </p>
                <ul className="list-disc list-inside mt-2 text-sm text-amber-800">
                  <li>Professional plan: 10 FAQs</li>
                  <li>Business plan: Unlimited FAQs</li>
                </ul>
              </div>
            )}
            <Button
              type="submit"
              className="bg-purple hover:bg-purple hover:opacity-70 transition duration-150 ease-in-out text-white font-semibold"
              disabled={!canAddMore}
            >
              Create
            </Button>
          </form>
        )}
      </CardContent>
      <CardContent className="p-6 overflow-y-auto chat-window">
        <Loader loading={loading}>
          {isQuestions.length ? (
            isQuestions.map((question) => (
              <div key={question.id} className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <Accordion
                    trigger={question.question}
                    content={question.answer}
                  />
                  <div className="flex gap-2 ml-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(question)}
                      className="h-8 w-8"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(question.id)}
                      className="h-8 w-8 text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <CardDescription>No Questions to show</CardDescription>
          )}
        </Loader>
      </CardContent>
    </Card>
  );
};

export default HelpDesk;
