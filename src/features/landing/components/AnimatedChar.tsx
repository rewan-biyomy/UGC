import { motion } from "motion/react";

const colors = ["#c4b5fd", "#f0abfc", "#67e8f9", "#fcd34d", "#86efac", "#fda4af"];

export function AnimatedChar({ char, index }: { char: string; index: number }) {
  return (
    <motion.span
      custom={index}
      aria-hidden="true"
      className="inline-block"
      variants={{
        rest: { y: 0, rotate: 0, scale: 1, color: "#fff" },
        hover: (characterIndex: number) => ({
          y: characterIndex % 2 === 0 ? -9 : -13,
          rotate: characterIndex % 2 === 0 ? 3 : -3,
          scale: 1.08,
          color: colors[characterIndex % colors.length],
          transition: { type: "spring", stiffness: 500, damping: 18, delay: characterIndex * 0.008 },
        }),
      }}
    >
      {char === " " ? "\u00a0" : char}
    </motion.span>
  );
}