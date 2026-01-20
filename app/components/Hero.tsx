"use client";
import localFont from "next/font/local";
import gsap from "gsap";
import SplitText from "gsap/src/SplitText";
import { useGSAP } from "@gsap/react";
import { useRef } from "react";
import { TLSSocket } from "tls";
import { text } from "stream/consumers";
import { Tetrahedron } from "@react-three/drei";

gsap.registerPlugin(SplitText);

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

      gsap.set([text1.chars, text2.chars, text4.chars, text6.chars], {
        opacity: 0,
      });

      gsap
        .timeline({ delay: 0 })
        .to(text1.chars, {
          opacity: 1,
          duration: 0,
          stagger: 0.1,
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
            delay: 1,
          },
          "",
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
            duration: 1.5,
            ease: "power4.out",
            stagger: 0.025,
            onComplete:()=>{
              text1.revert();
              text2.revert();
              text4.revert();
              text6.revert();
            }
          },
          "<+=0.25",
        );
    },
    { scope: container, dependencies: [] },
  );

  return (
    <div
      ref={container}
      className=" relative w-full h-full flex flex-col items-start justify-end z-10 max-w-full max-h-full overflow-hidden px-6"
    >
      <div className="md:text-[6.5vw]! md:max-w-8/10 text-5xl relative tracking-tighter md:tracking-tightest w-fit h-fit font-bold text-neutral-800 text-shadow-sm my-10 text-shadow-black/0 ">
        <div className="absolute inset-0 -z-10 bg-white blur-2xl rounded-full scale-x-120"></div>
        <p className="bg-clip-text bg-linear-to-b max-w-full w-full from-zinc-400 to-50% to-zinc-800">
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
          <span className="text-6">
            &nbsp;currently open for work <span>=)</span>{" "}
          </span>
        </p>
      </div>
    </div>
  );
}
