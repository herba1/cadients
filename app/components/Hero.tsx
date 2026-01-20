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
        type: "lines,chars",
        reduceWhiteSpace: false,
      });
      const text2 = SplitText.create(".text-2", {
        type: "lines,chars",
        mask: "lines",
        reduceWhiteSpace: false,
      });
      const text3 = SplitText.create(".text-3", {
        type: "lines,chars",
        mask: "lines",
        reduceWhiteSpace: false,
      });
      const text4 = SplitText.create(".text-4", {
        type: "lines,chars",
        reduceWhiteSpace: false,
      });
      const text5 = SplitText.create(".text-5", {
        type: "lines,chars",
        mask:"lines",
        reduceWhiteSpace: false,
      });
      const text6 = SplitText.create(".text-6", {
        type: "lines,chars",
        mask:"lines",
        reduceWhiteSpace: false,
      });

      gsap.set(
        [
          text1.chars,
          text2.chars,
          text3.chars,
          text4.chars,
          text5.chars,
          text6.chars,
        ],
        {
          opacity: 0,
        },
      );

      gsap
        .timeline({ delay: 1 })
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
            delay:1,
          },
          "",
        )
        .fromTo(
          text3.chars,
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
          },"-=0.5",
          
        )
        .to(text4.chars, {
          opacity: 1,
          duration: 0,
          stagger: {
            from: "random",
            ease: "power2.out",
            amount:1,
          },
        },"<+=0.75")
        .fromTo(
          text5.chars,
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
          },
          "<+=0.25",
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
          },
          "<+=0.25",
        )

    },
    { scope: container, dependencies: [] },
  );

  return (
    <div
      ref={container}
      className=" relative w-full h-full flex flex-col items-start justify-end z-10 max-w-full max-h-full overflow-hidden px-6"
    >
      <div className="text-9xl relative tracking-[-0.56rem] w-fit h-fit font-bold text-neutral-800 text-shadow-sm my-10 text-shadow-black/0 ">
        <div className="absolute inset-0 -z-10 bg-white blur-2xl mix-blend-color-burn rounded-full scale-x-100"></div>
        <p className="bg-clip-text bg-linear-to-b w-full from-zinc-400 to-50% to-zinc-800">
          <span
            className={`inline-block text-1 font-normal tracking-[-0.4rem] ${lastik.className}`}
          >
            Herbart
          </span>
          <span className="inline-block text-2">&nbsp;Hernandez is a</span>
        </p>
        <p className="bg-clip-text bg-linear-to-b from-zinc-400 to-50% to-zinc-800">
          <span className="inline-block text-3 ">Frontend&nbsp;</span>
          <span
            className={`inline-block font-normal text-4 tracking-[-0.32rem] ${spencerOutline.className}`}
          >
            Developer,
          </span>
          <span className="inline-block text-5">&nbsp;Currently</span>
        </p>
        <p className="bg-clip-text bg-linear-to-b from-zinc-400 to-50% leading-tight -mt-5 to-zinc-800">
          <span className="inline-block text-6">open for work <span>=)</span> </span>
        </p>
      </div>
    </div>
  );
}
