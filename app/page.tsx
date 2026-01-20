'use client'
import { Leva } from "leva";
import Experience from "./components/Experience";
import Hero from "./components/Hero";

export default function Home() {
  return (
    <div className="w-full relative h-lvh">
      <Leva collapsed />
      <div className="absolute inset-0 z-0">
        <Experience />
      </div>
      <Hero />
    </div>
  );
}
