import type { CommandViewAnimation } from "#components/Command.tsx";
import type { useAnimation } from "framer-motion";
import { motion } from "framer-motion";
import type { ComponentPropsWithRef, ForwardedRef } from "react";
import { forwardRef } from "react";

export type CommandSurfaceProps = Omit<
  ComponentPropsWithRef<typeof motion.div>,
  "animate" | "initial" | "variants"
> & {
  controls: ReturnType<typeof useAnimation>;
  animation?: CommandViewAnimation;
};

/** Render custom content with the command's entrance and exit controls. */
export const CommandSurface = forwardRef(function CommandSurface(
  props: CommandSurfaceProps,
  forwardedRef: ForwardedRef<HTMLDivElement>,
) {
  const {
    animation: suppliedAnimation,
    controls,
    children,
    ...surfaceProps
  } = props;

  const animation = suppliedAnimation ?? surfaceAnimation;

  // NOTE: Keep one motion div and forward host layout props so sharing
  // transition defaults does not add a wrapper or change positioning.
  return (
    <motion.div
      {...surfaceProps}
      ref={forwardedRef}
      variants={animation}
      initial="initial"
      animate={controls}
    >
      {children}
    </motion.div>
  );
});

const surfaceAnimation: CommandViewAnimation = {
  initial: { opacity: 0 },
  entrance: { opacity: 1, transition: { duration: 1 } },
  exit: { opacity: 0, transition: { duration: 0.5, ease: "easeOut" } },
};
