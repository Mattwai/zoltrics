import Image from "next/image";
import Link from "next/link";
import { SmoothScrollLink } from "../global/smooth-scroll";

function NavBar() {
  return (
    <header
      className="fixed right-0 left-0 top-0 py-3 px-4 bg-black/40 backdrop-blur-lg z-[100] flex items-center 
        border-b-[1px] border-neutral-900 justify-between"
    >
      <aside className="flex items-center gap-[2px] pl-4">
        <Image
          src="/images/logo.png"
          alt="LOGO"
          sizes="100vw"
          style={{
            width: "100px",
            height: "auto",
          }}
          width={0}
          height={0}
        />
      </aside>
      <nav className="absolute left-[50%] top-[50%] transform translate-x-[-50%] translate-y-[-50%] hidden md:block">
        <ul className="gap-5 justify-between self-stretch my-auto text-sm leading-5 text-neutral-300 max-md:flex-wrap max-md:max-w-full font-normal hidden md:flex">
          <li>
            <SmoothScrollLink href="#pricing">Pricing</SmoothScrollLink>
          </li>
          <li>
            <SmoothScrollLink href="#features">Features</SmoothScrollLink>
          </li>
          <li>
            <Link href="#">Contact Us</Link>
          </li>
        </ul>
      </nav>
      <Link
        href="/dashboard"
        className="relative inline-flex h-10 overflow-hidden rounded-full mr-3 p-[3px] focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-50"
      >
        <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#E2CBFF_100%)]" />
        <span className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full bg-slate-950 px-7 py-1 text-sm font-medium text-white backdrop-blur-3xl">
          Sign In
        </span>
      </Link>
    </header>
  );
}

export default NavBar;
