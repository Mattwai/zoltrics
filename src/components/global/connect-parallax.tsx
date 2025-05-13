"use client";
import {
  motion,
  MotionValue,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import React from "react";

export const HeroParallax = ({
  services,
}: {
  services: {
    title: string;
    link: string;
    thumbnail: string;
  }[];
}) => {
  const firstRow = services.slice(0, 5);
  const secondRow = services.slice(5, 10);
  const thirdRow = services.slice(10, 15);
  const ref = React.useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const springConfig = { stiffness: 300, damping: 30, bounce: 100 };

  const translateX = useSpring(
    useTransform(scrollYProgress, [0, 1], [0, 1000]),
    springConfig
  );
  const translateXReverse = useSpring(
    useTransform(scrollYProgress, [0, 1], [0, -1000]),
    springConfig
  );
  const rotateX = useSpring(
    useTransform(scrollYProgress, [0, 0.2], [15, 0]),
    springConfig
  );
  const opacity = useSpring(
    useTransform(scrollYProgress, [0, 0.2], [0.2, 1]),
    springConfig
  );
  const rotateZ = useSpring(
    useTransform(scrollYProgress, [0, 0.2], [20, 0]),
    springConfig
  );
  const translateY = useSpring(
    useTransform(scrollYProgress, [0, 0.2], [-700, 50]),
    springConfig
  );
  return (
    <div
      ref={ref}
      className="h-[135vh] py-40 overflow-hidden  antialiased relative flex flex-col self-auto [perspective:500px] [transform-style:preserve-3d]"
    >
      <Header />
      <motion.div
        style={{
          rotateX,
          rotateZ,
          translateY,
          opacity,
        }}
        className=""
      >
        <motion.div className="flex flex-row-reverse space-x-reverse space-x-20 mb-10">
          {firstRow.map((service) => (
            <ServiceCard
              service={service}
              translate={translateX}
              key={service.title}
            />
          ))}
        </motion.div>
        <motion.div className="flex flex-row-reverse space-x-reverse space-x-20 ">
          {secondRow.map((service) => (
            <ServiceCard
              service={service}
              translate={translateXReverse}
              key={service.title}
            />
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
};

export const Header = () => {
  return (
    <div className="max-w-7xl relative mx-auto px-4 w-full left-0 top-0">
      <h1 className="text-2xl md:text-7xl font-bold text-white">
        The Ultimate <br /> development studio <br />
        Embed BookerBuddy into any website with just a snippet of code!
      </h1>
      <p className="max-w-2xl text-base md:text-xl mt-8 text-neutral-200">
        We build beautiful services with the latest technologies and frameworks.
        We are a team of passionate developers and designers that love to build
        amazing services.
      </p>
    </div>
  );
};

export const ServiceCard = ({
  service,
  translate,
}: {
  service: {
    title: string;
    link: string;
    thumbnail: string;
  };
  translate: MotionValue<number>;
}) => {
  return (
    <motion.div
      style={{
        x: translate,
      }}
      whileHover={{
        y: -20,
      }}
      key={service.title}
      className="group/service h-96 w-[30rem] relative flex-shrink-0"
    >
      <Link
        href={service.link}
        className="block group-hover/service:shadow-2xl "
      >
        <Image
          src={service.thumbnail}
          height="600"
          width="600"
          className="object-cover object-left-top absolute h-full w-full inset-0"
          alt={service.title}
        />
      </Link>
      <div className="absolute inset-0 h-full w-full opacity-0 group-hover/service:opacity-80 bg-black pointer-events-none"></div>
      <h2 className="absolute bottom-4 left-4 opacity-0 group-hover/service:opacity-100 text-white">
        {service.title}
      </h2>
    </motion.div>
  );
};
