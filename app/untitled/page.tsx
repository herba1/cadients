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

        setTimeout(() => {
          const event = new Event("mouseenter", {
            cancelable: true,
          });
          target.dispatchEvent(event);
          setTimeout(() => {
            const event = new Event("mouseleave", {
              cancelable: true,
            });
            target.dispatchEvent(event);
          }, 400);
        }, 1000);
      };

      if (link.current && untitled.current) {
        createTween(link.current);
        createTween(untitled.current);
      }

      const heroText = SplitText.create(".hero__tag", {
        type: "chars,words",
      });
      gsap.set(".hero__tag", {
        opacity: 1,
      });

      gsap.from(heroText.chars, {
        opacity: 0,
        duration: 0.01,
        stagger: {
          amount: 1,
          ease: "linear",
        },
      });

      gsap.set(".fade-in", {
        visibility: "visible",
      });
      gsap.from(".fade-in", {
        delay: 0.8,
        opacity: 0,
        scale: 0.8,
        yPercent: -50,
        filter: "blur(2px)",
        ease: "power3.out",
        duration: 0.6,
        stagger: 0.08,
      });
    },
    { scope: container, dependencies: [] },
  );

  return (
    <div className="relative h-dvh w-full bg-[#191919]">
      <Leva hidden />
      <CD />
      <div
        ref={container}
        className={`hero z-10 flex h-full w-full items-end p-10 font-medium tracking-tighter ${inter.className} `}
      >
        <header className="fixed top-0 left-0 flex w-full justify-between bg-transparent p-5 align-top mix-blend-difference md:p-10 md:mix-blend-normal">
          <p className="hero__tag max-w-md text-4xl text-white opacity-0 mix-blend-difference">
            A sacred place for your work-in-progress music
          </p>
          <nav className="hidden h-fit items-center gap-10 md:flex">
            <a
              className="link fade-in invisible text-lg text-white"
              href="https://untitled.stream/pricing"
              ref={link}
              onMouseEnter={() => tl.current.play(0)}
            >
              [<span className="chars">membership</span>]
            </a>
            <a
              href="https://untitled.stream/login"
              className="fade-in mix-black invisible cursor-pointer rounded-full bg-white px-6 py-3 text-lg font-medium"
            >
              Enter App
            </a>
          </nav>
        </header>

        <div className="flex h-fit w-full flex-col justify-between gap-2 md:flex-row md:items-end">
          <p
            ref={untitled}
            className="fade-in invisible text-4xl text-white mix-blend-difference"
          >
            [untitled]
          </p>
          <p className="fade-in invisible text-xs text-white mix-blend-difference">
            This is unoffical and unafilliated with [untitled] by{" "}
            <a href="https://x.com/herb_dev">@herb</a>
          </p>
        </div>
      </div>
    </div>
  );
}
