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
      className="h-[150vh] py-40 overflow-hidden antialiased relative flex flex-col self-auto [perspective:500px] [transform-style:preserve-3d] bg-gradient-to-b from-neutral-950 to-neutral-900"
    >
      <Header />
      <motion.div
        style={{
          rotateX,
          rotateZ,
          translateY,
          opacity,
        }}
        className="mt-20"
      >
        <motion.div className="flex flex-row-reverse space-x-reverse space-x-20 mb-28">
          {firstRow.map((service) => (
            <ServiceCard
              service={service}
              translate={translateX}
              key={service.title}
            />
          ))}
        </motion.div>
        <motion.div className="flex flex-row space-x-20 mb-28">
          {secondRow.map((service) => (
            <ServiceCard
              service={service}
              translate={translateXReverse}
              key={service.title}
            />
          ))}
        </motion.div>
        {thirdRow.length > 0 && (
          <motion.div className="flex flex-row-reverse space-x-reverse space-x-20">
            {thirdRow.map((service) => (
              <ServiceCard
                service={service}
                translate={translateX}
                key={service.title}
              />
            ))}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export const Header = () => {
  return (
    <div className="max-w-7xl relative mx-auto px-4 w-full left-0 top-0">
      <div className="flex flex-col items-center text-center">
        <div className="inline-block px-6 py-2 mb-6 rounded-full bg-royalPurple text-white font-medium text-sm">
          Introducing BookerBuddy
        </div>
        <h1 className="text-3xl md:text-7xl font-bold text-white tracking-tight">
          Seamless Booking <br /> Made Simple
        </h1>
        <p className="max-w-2xl text-base md:text-xl mt-8 text-neutral-300 leading-relaxed">
          BookerBuddy transforms your website into a powerful booking platform. Our lightweight, customizable widget helps businesses of all sizes streamline appointments, reduce no-shows, and delight customers with automated reminders and 24/7 booking capability.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/#contact" className="px-6 py-3 bg-royalPurple hover:bg-royalPurple text-white font-medium rounded-lg transition-colors">
            Get Started Free
          </Link>
          <Link href="/demo" className="px-6 py-3 bg-neutral-800 hover:bg-neutral-700 text-white font-medium rounded-lg transition-colors border border-neutral-700">
            View Demo
          </Link>
        </div>
      </div>
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
      className="group/service w-[30rem] relative flex-shrink-0"
    >
      <Link
        href={service.link}
        className="block group-hover/service:shadow-2xl w-full"
      >
        <div className="relative w-full overflow-hidden rounded-xl bg-neutral-900 border border-neutral-800" style={{ aspectRatio: '2618/1610' }}>
          <Image
            src={service.thumbnail}
            fill
            sizes="(max-width: 768px) 100vw, 1200px"
            className="transition-transform duration-500 group-hover/service:scale-105"
            alt={service.title}
            priority
            style={{ 
              objectFit: 'cover', 
              objectPosition: 'center',
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover/service:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-full p-6">
            <h2 className="text-xl font-semibold text-white opacity-0 group-hover/service:opacity-100 transition-opacity duration-300 z-10">
              {service.title}
            </h2>
            <div className="mt-2 opacity-0 group-hover/service:opacity-100 transition-opacity duration-300 flex items-center text-purple-400">
              <span className="text-sm">Learn more</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};
