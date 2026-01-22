"use client";
import localFont from "next/font/local";
import gsap from "gsap";
import SplitText from "gsap/src/SplitText";
import { useGSAP } from "@gsap/react";
import { useRef } from "react";
import CustomBounce from "gsap/dist/CustomBounce";
import { CustomEase } from "gsap/all";

gsap.registerPlugin(SplitText, CustomBounce, CustomEase);

const lastik = localFont({
  src: "../../public/fonts/lastikfont.otf",
});
const spencerOutline = localFont({
  src: "../../public/fonts/spencer-outlined-webfont.woff2",
});

export default function Hero() {
  const container = useRef(null);

  useGSAP(
    () => {
      const text1 = SplitText.create(".text-1", {
        type: "chars,words",
      });
      const text2 = SplitText.create(".text-2", {
        type: "chars,words",
        mask: "words",
        reduceWhiteSpace: false,
      });
      const text4 = SplitText.create(".text-4", {
        type: "chars, words",
      });
      const text6 = SplitText.create(".text-6", {
        type: "chars,words",
        mask: "words",
        reduceWhiteSpace: false,
      });

      const facetl = gsap.timeline({ paused: true });

      gsap.set([text1.chars, text2.chars, text4.chars, text6.chars], {
        opacity: 0,
      });
      gsap.set(".hero__text", {
        visibility: "visible",
      });

      gsap.from(".hero__bg", {
        scale: 2,
        ease: "power4.inOut",
      });

      gsap
        .timeline({
          delay: 0.7,
          onComplete: () => {
            facetl.play();
          },
        })
        .to(text1.chars, {
          opacity: 1,
          duration: 0,
          stagger: 0.08,
        })
        .fromTo(
          text2.chars,
          {
            yPercent: 100,
            opacity: 1,
          },
          {
            yPercent: 0,
            opacity: 1,
            duration: 1,
            ease: "power4.out",
            stagger: 0.015,
          },
          "-=0.2",
        )
        .to(
          text4.chars,
          {
            opacity: 1,
            duration: 0,
            stagger: {
              from: "random",
              ease: "power2.out",
              amount: 1,
            },
          },
          "<+=0.75",
        )
        .fromTo(
          text6.chars,
          {
            yPercent: 100,
            opacity: 1,
          },
          {
            yPercent: 0,
            opacity: 1,
            duration: 1,
            ease: "power4.out",
            stagger: 0.015,
            onComplete: () => {
              text1.revert();
              text2.revert();
              text4.revert();
              text6.revert();
            },
          },
          "<+=0.5",
        );

      facetl
        .from(
          ".face1",
          {
            ease: "elastic",
            rotate: gsap.utils.random(-50, 50),
            duration: 2,
            scale: 0.5,
            opacity: 0,
            filter: "blur(2px)",
          },
          0,
        )
        .from(
          ".face2",
          {
            ease: "elastic",
            rotate: gsap.utils.random(-50, 50),
            duration: 2,
            scale: 0.5,
            opacity: 0,
            filter: "blur(2px)",
          },
          0.1,
        )
        .to(".face1,.face2", {
          yPercent: -30,
          repeat: -1,
          duration: 2.5,
          repeatDelay: 0,
          stagger: 0.2,
          ease: CustomBounce.create("myBounce", {
            strength: 0.7,
            endAtStart: true,
            squash: 1,
            squashID: "myBounce-squash",
          }),
        });
    },
    { scope: container, dependencies: [] },
  );

  return (
    <div
      ref={container}
      className=" relative w-full h-full flex flex-col items-start justify-end z-10 max-w-full max-h-full overflow-hidden p-2 md:px-6"
    >
      <div className="md:text-[6.5vw]! md:max-w-8/10 text-5xl relative tracking-tighter md:tracking-[-0.4vw] w-fit h-fit font-bold text-neutral-800 text-shadow-sm md:my-10 text-shadow-black/0 ">
        <div className="absolute inset-0 hero__bg -z-10 bg-white blur-[100px] rounded-full scale-x-100"></div>
        <p className="bg-clip-text hero__text text-pretty invisible bg-linear-to-b max-w-full w-full from-zinc-400 to-50% to-zinc-800">
          <span
            className={`text-1 font-normal tracking-tighter ${lastik.className}`}
          >
            Herbart
          </span>
          <span className=" text-2"> Hernandez is a Frontend </span>
          <span
            className={`font-normal text-4 tracking-tight ${spencerOutline.className}`}
          >
            Developer,
          </span>
          <span className="text-6">&nbsp;currently open for work </span>
          <span className="face1 inline-block align-top">☺</span>
          <span className="face2 inline-block align-top">☻</span>
        </p>
      </div>
    </div>
  );
}
