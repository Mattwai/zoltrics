"use client";
import useSideBar from "@/context/sidebar-context";
import { Loader } from "../loader";
import { Switch } from "../ui/switch";

type Props = {};

const BreadCrumb = (props: Props) => {
  const {
    chatRoom,
    expand,
    loading,
    onActivateRealtime,
    onExpand,
    page,
    onSignOut,
    realtime,
  } = useSideBar();
  return (
    <div className="flex flex-col ">
        <h2 className="text-3xl font-bold text-gray-900 capitalize pt-4">{page}</h2>
        {page === "conversation" && chatRoom && (
          <Loader loading={loading} className="p-0 inline">
            <Switch
              defaultChecked={realtime}
              onClick={(e) => onActivateRealtime(e)}
              className="data-[state=checked]:bg-purple data-[state=unchecked]:bg-orchid"
            />
          </Loader>
        )}
        <p className="text-gray-600 mt-2">
        {page == "settings"
          ? "Manage your account settings, preferences and integrations"
          : page == "dashboard"
          ? "Welcome back! Here's what's happening with your business today."
          : page == "appointment"
          ? "View and edit all your appointments"
          : page == "appointment-settings"
          ? "Configure your booking link, calendar availability, and custom time slots"
          : page == "integration"
          ? "Connect third-party applications into Zoltrics"
          : "Modify domain settings, change chatbot options, enter sales questions and train your bot to do what you want it to."}
      </p>
      </div>
  );
};                                                                                                                                                                                                                                                                                                                                                                                                                                               

export default BreadCrumb;
