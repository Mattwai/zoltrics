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

type Props = {
  id: string;
};

const KnowledgeBase = ({ id }: Props) => {
  const { register, errors, onSubmitEntry, entries, loading } = useKnowledgeBase(id);

  return (
    <Card className="w-full grid grid-cols-1 lg:grid-cols-2">
      <CardContent className="p-6 border-r-[1px]">
        <CardTitle>Knowledge Base</CardTitle>
        <form onSubmit={onSubmitEntry} className="flex flex-col gap-6 mt-10">
          <div className="flex flex-col gap-3">
            <Section
              label="Title"
              message="Add a title for this knowledge base entry"
            />
            <FormGenerator
              inputType="input"
              register={register}
              errors={errors}
              form="knowledge-base-form"
              name="title"
              placeholder="Type the title"
              type="text"
            />
          </div>
          <div className="flex flex-col gap-3">
            <Section
              label="Content"
              message="Add the content for this knowledge base entry"
            />
            <FormGenerator
              inputType="textarea"
              register={register}
              errors={errors}
              form="knowledge-base-form"
              name="content"
              placeholder="Type the content"
              type="text"
              lines={5}
            />
          </div>
          <div className="flex flex-col gap-3">
            <Section
              label="Category"
              message="Optional category for organizing entries"
            />
            <FormGenerator
              inputType="input"
              register={register}
              errors={errors}
              form="knowledge-base-form"
              name="category"
              placeholder="Type the category"
              type="text"
            />
          </div>
          <Button
            type="submit"
            className="bg-purple hover:bg-purple hover:opacity-70 transition duration-150 ease-in-out text-white font-semibold"
          >
            Create
          </Button>
        </form>
      </CardContent>
      <CardContent className="p-6 overflow-y-auto chat-window">
        <Loader loading={loading}>
          {entries.length ? (
            entries.map((entry) => (
              <div key={entry.id} className="mb-4 p-4 border rounded">
                <h3 className="font-bold">{entry.title}</h3>
                <p className="text-sm text-gray-600">{entry.category}</p>
                <p className="mt-2">{entry.content}</p>
              </div>
            ))
          ) : (
            <CardDescription>No knowledge base entries</CardDescription>
          )}
        </Loader>
      </CardContent>
    </Card>
  );
};

export default KnowledgeBase; 