"use client";
import { Loader } from "@/components/loader";
import Section from "@/components/section-label";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { useFilterQuestions } from "@/hooks/settings/use-settings";
import FormGenerator from "../form-generator";
import { Plans } from "@prisma/client";
import { checkHelpdeskFeature } from "@/lib/subscription-checks";
import Accordion from "@/components/accordian";

type Props = {
  id: string;
  plan: Plans;
};

const FilterQuestions = ({ id, plan }: Props) => {
  const { register, errors, onAddFilterQuestions, isQuestions, loading } =
    useFilterQuestions(id);

  const canCustomizeQuestions = checkHelpdeskFeature(plan, "customQuestions");

  return (
    <Card className="w-full grid grid-cols-1 lg:grid-cols-2">
      <CardContent className="p-6 border-r-[1px]">
        <CardTitle>Bot Questions</CardTitle>
        {!canCustomizeQuestions && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-4">
            <p className="text-sm text-amber-800">
              Custom bot questions are only available on the Professional and Business plan. Upgrade to unlock this feature:
            </p>
          </div>
        )}
        <form
          onSubmit={onAddFilterQuestions}
          className="flex flex-col gap-6 mt-4"
        >
          <div className="flex flex-col gap-3">
            <Section
              label="Question"
              message="Add a question that you want your chatbot to ask"
            />
            <FormGenerator
              inputType="input"
              register={register}
              errors={errors}
              form="filter-questions-form"
              name="question"
              placeholder="Type your question"
              type="text"
              disabled={!canCustomizeQuestions}
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
              form="filter-questions-form"
              name="answer"
              placeholder="Type your answer"
              type="text"
              lines={5}
              disabled={!canCustomizeQuestions}
            />
          </div>
          <Button
            type="submit"
            className="bg-purple hover:bg-purple hover:opacity-70 transition duration-150 ease-in-out text-white font-semibold"
            disabled={!canCustomizeQuestions}
          >
            Create
          </Button>
        </form>
      </CardContent>
      <CardContent className="p-6 overflow-y-auto chat-window">
        <Loader loading={loading}>
          {isQuestions.length ? (
            isQuestions.map((question) => (
              <Accordion
                key={question.id}
                trigger={question.question}
                content="Answer will be provided by the AI chatbot"
              />
            ))
          ) : (
            <CardDescription>No questions to show</CardDescription>
          )}
        </Loader>
      </CardContent>
    </Card>
  );
};

export default FilterQuestions;
