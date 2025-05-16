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
import { useKnowledgeBase } from "@/hooks/settings/use-settings";
import FormGenerator from "../form-generator";
import { Plans } from "@/types/prisma";
import { checkHelpdeskFeature } from "@/lib/subscription-checks";

type Props = {
  id: string;
  plan: Plans;
};

const KnowledgeBase = ({ id, plan }: Props) => {
  const { register, errors, onSubmitEntry, entries, loading } = useKnowledgeBase(id);

  const canUseKnowledgeBase = checkHelpdeskFeature(plan, "knowledgeBase");

  return (
    <Card className="w-full grid grid-cols-1 lg:grid-cols-2">
      <CardContent className="p-6 border-r-[1px]">
        <CardTitle>Knowledge Base</CardTitle>
        {!canUseKnowledgeBase && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-4">
            <p className="text-sm text-amber-800">
              Knowledge Base is only available on Professional and Business plans. Upgrade to unlock this feature:
            </p>
            <ul className="list-disc list-inside mt-2 text-sm text-amber-800">
              <li>Professional plan: Basic knowledge base</li>
              <li>Business plan: Advanced knowledge base with AI integration</li>
            </ul>
          </div>
        )}
        <form onSubmit={onSubmitEntry} className="flex flex-col gap-6 mt-4">
          <div className="flex flex-col gap-3">
            <Section
              label="Knowledge Base Content"
              message="Add content to your knowledge base to help your chatbot answer questions."
            />
            <FormGenerator
              inputType="textarea"
              register={register}
              errors={errors}
              form="knowledge-base-form"
              name="content"
              placeholder="Enter your knowledge base content..."
              type="text"
              lines={10}
              disabled={!canUseKnowledgeBase}
            />
          </div>
          <Button
            type="submit"
            className="bg-purple hover:bg-purple hover:opacity-70 transition duration-150 ease-in-out text-white font-semibold"
            disabled={!canUseKnowledgeBase}
          >
            Save
          </Button>
        </form>
      </CardContent>
      <CardContent className="p-6 overflow-y-auto chat-window">
        <Loader loading={loading}>
          {entries.length ? (
            entries.map((entry) => (
              <div key={entry.id} className="prose max-w-none">
                <pre className="whitespace-pre-wrap">{entry.content}</pre>
              </div>
            ))
          ) : (
            <CardDescription>No knowledge base content to show</CardDescription>
          )}
        </Loader>
      </CardContent>
    </Card>
  );
};

export default KnowledgeBase; 