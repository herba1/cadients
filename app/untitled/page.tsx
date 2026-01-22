"use client";
import CD from "./CD";
import { useGSAP } from "@gsap/react";
import { Leva } from "leva";
import SplitText from "gsap/src/SplitText";
import gsap from "gsap";
gsap.registerPlugin(SplitText);
import React, { useRef } from "react";
import { Inter } from "next/font/google";

// If loading a variable font, you don't need to specify the font weight
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export default function Experience() {
  const container = useRef(null);
  const tl = useRef(gsap.timeline());
  const link = useRef(null);
  const untitled = useRef(null);

  useGSAP(
    () => {
      //   const tl = gsap.timeline();
      const createTween = (target: HTMLElement) => {
        const text = SplitText.create(target, { type: "chars" });
        target.addEventListener("mouseenter", () => {
          gsap.to(text.chars, {
            // paddingLeft: 2,
            // paddingRight: 2,
            scale: 0.75,
            // filter: "brightness(200%) saturate(50%) ",
            stagger: 0.03,
            duration: 0.3,
            textTransform: "capitalize",
            // marginLeft: 5,
            ease: "power4.out",
          });
        });
        target.addEventListener("mouseleave", () => {
          gsap.to(text.chars, {
            textTransform: "none",
            scale: 1,
            duration: 0.3,
            stagger: 0.03,
            ease: "power4.out",
          });
        });
      };

      if (link.current && untitled.current) {
        createTween(link.current);
        createTween(untitled.current);
      }
    },
    { scope: container, dependencies: [] },
  );

  return (
    <div className="w-full relative h-dvh bg-[#1f1f1f]">
      <Leva hidden />
      <CD />
      <div
        ref={container}
        className={`hero w-full h-full z-10 p-10 flex items-end tracking-tighter font-medium ${inter.className} `}
      >
        <header className="fixed mix-blend-difference md:mix-blend-normal bg-transparent top-0 left-0 flex align-top w-full p-5 md:p-10 justify-between ">
          <p className="text-4xl mix-blend-difference text-white max-w-md">
            A sacred place for your work-in-progress music
          </p>
          <nav className="items-center hidden md:flex h-fit gap-10">
            <a
              className="text-lg link text-white "
              href="https://untitled.stream/pricing"
              ref={link}
              onMouseEnter={() => tl.current.play(0)}
            >
              [<span className="chars">membership</span>]
            </a>
            <a
              href="https://untitled.stream/login"
              className="active:scale-95 hover:scale-105 transition-transform will-change-transform ease-in-out duration-200 cursor-pointer text-lg font-medium px-6 py-3 bg-white rounded-full   mix-black"
            >
              Enter App
            </a>
          </nav>
        </header>

        <div className="w-full h-fit items-end flex justify-between">
          <p
            ref={untitled}
            className="text-white mix-blend-difference text-4xl"
          >
            [untitled]
          </p>
          <p className="text-white text-xs mix-blend-difference">
            This is unoffical and unafilliated with [untitled] by{" "}
            <a href="https://x.com/herb_dev">@herb</a>
          </p>
        </div>
      </div>
    </div>
  );
}
