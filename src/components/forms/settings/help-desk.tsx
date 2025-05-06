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
import { Plans } from "@prisma/client";
import { checkHelpdeskFeature } from "@/lib/subscription-checks";

type Props = {
  id: string;
  plan: Plans;
};

const HelpDesk = ({ id, plan }: Props) => {
  const { register, errors, onSubmitQuestion, isQuestions, loading } =
    useHelpDesk(id);

  const maxFaqs = checkHelpdeskFeature(plan, "maxFaqs");
  const canAddMore = typeof maxFaqs === "number" && (maxFaqs === -1 || isQuestions.length < maxFaqs);

  return (
    <Card className="w-full grid grid-cols-1 lg:grid-cols-2">
      <CardContent className="p-6 border-r-[1px]">
        <CardTitle>Help Desk</CardTitle>
        <form onSubmit={onSubmitQuestion} className="flex flex-col gap-6 mt-10">
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
            <p className="text-sm text-amber-600">
              You have reached the maximum number of FAQs for your plan. Upgrade to add more.
            </p>
          )}
          <Button
            type="submit"
            className="bg-purple hover:bg-purple hover:opacity-70 transition duration-150 ease-in-out text-white font-semibold"
            disabled={!canAddMore}
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
                content={question.answer}
              />
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
