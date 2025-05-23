import Image from "next/image";

export const PortalBanner = () => {
  return (
    <div className="w-full bg-muted flex justify-center py-5">
      <Image
        src="/images/bookerbuddy-banner.png"
        alt="BookerBuddy Banner"
        sizes="100vw"
        style={{
          width: "100px",
          height: "auto",
        }}
        width={0}
        height={0}
      />
    </div>
  );
};
