import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

type DataTableProps = {
  headers: string[];
  children: React.ReactNode;
};

export const DataTable = ({ headers, children }: DataTableProps) => {
  return (
    <Table className="rounded-t-xl overflow-hidden">
      <TableHeader>
        <TableRow>
          {headers.map((header, key) => (
            <TableHead
              key={key}
              className={cn(
                "text-black",
                key === headers.length - 1 ? "text-right" : "text-left",
                "align-middle"
              )}
            >
              {header}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>{children}</TableBody>
    </Table>
  );
};
