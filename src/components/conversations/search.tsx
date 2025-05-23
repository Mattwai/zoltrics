import { FieldValues, UseFormRegister } from "react-hook-form";

type Props = {
  register: UseFormRegister<any>;
  domains?:
    | {
        name: string;
        id: string;
      }[]
    | undefined;
};

const ConversationSearch = ({ register, domains }: Props) => {
  return (
    <div className="flex flex-col py-3">
      <select
        {...register("domain")}
        className="px-3 py-4 text-sm border-[1px] rounded-lg mr-5"
      >
        <option disabled selected>
          Domain name
        </option>
        {domains?.map((domain) => (
          <option value={domain.id} key={domain.id}>
            {domain.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default ConversationSearch;
