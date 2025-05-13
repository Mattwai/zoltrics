import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Accordion as ShadcnAccordion,
} from "@/components/ui/accordion";

type Props = {
  trigger?: string;
  content?: string;
  title?: string;
  helpdesks?: {
    id: string;
    question: string;
    answer: string;
    domainId: string | null;
  }[];
};

const Accordion = ({ content, trigger, title, helpdesks }: Props) => {
  if (helpdesks && helpdesks.length > 0) {
    return (
      <div>
        {title && <h3 className="mb-3 font-medium">{title}</h3>}
        <ShadcnAccordion type="single" collapsible className="w-full">
          {helpdesks.map((item) => (
            <AccordionItem key={item.id} value={item.id}>
              <AccordionTrigger>{item.question}</AccordionTrigger>
              <AccordionContent>{item.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </ShadcnAccordion>
      </div>
    );
  }

  return (
    <ShadcnAccordion type="single" collapsible>
      <AccordionItem value="item-1">
        <AccordionTrigger>{trigger}</AccordionTrigger>
        <AccordionContent>{content}</AccordionContent>
      </AccordionItem>
    </ShadcnAccordion>
  );
};

export default Accordion;
