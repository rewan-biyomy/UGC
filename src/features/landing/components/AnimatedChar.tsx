import { motion, useReducedMotion } from "motion/react";

const colors = ["#c4b5fd", "#f0abfc", "#67e8f9", "#fcd34d", "#86efac", "#fda4af"];
const characterDelay = 0.32;
const animationDuration = 0.26;

export function AnimatedChar({ char, index, characterCount }: { char: string; index: number; characterCount: number }) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.span
      aria-hidden="true"
      className="inline-block"
      animate={prefersReducedMotion ? { color: "#fff" } : {
        color: ["#fff", colors[index % colors.length], "#fff"],
        y: [0, -5, 0],
      }}
      transition={prefersReducedMotion ? undefined : {
        duration: animationDuration,
        delay: index * characterDelay,
        repeat: Infinity,
        repeatDelay: Math.max(0, characterCount * characterDelay - animationDuration),
        ease: "easeInOut",
      }}
    >
      {char === " " ? "\u00a0" : char}
    </motion.span>
  );
}