"use client";
import { useChangePassword } from "@/hooks/settings/use-settings";
import FormGenerator from "@/components/forms/form-generator";
import { Loader } from "@/components/loader";
import Section from "@/components/section-label";
import { Button } from "@/components/ui/button";

type Props = {};

const ChangePassword = (props: Props) => {
  const { register, errors, onChangePassword, loading } = useChangePassword();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
      <div className="lg:col-span-1">
        <Section label="Change Password" message="Reset your password" />
      </div>
      <form onSubmit={onChangePassword} className="lg:col-span-4">
        <div className="lg:w-[500px] flex flex-col gap-3">
          <FormGenerator
            register={register}
            errors={errors}
            name="password"
            placeholder="New Password"
            type="text"
            inputType="input"
          />
          <FormGenerator
            register={register}
            errors={errors}
            name="confirmPassword"
            placeholder="Confirm Password"
            type="text"
            inputType="input"
          />
          <Button className="bg-royalPurple text-gray-700 font-semibold">
            <Loader loading={loading}>Change Password</Loader>
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ChangePassword;
