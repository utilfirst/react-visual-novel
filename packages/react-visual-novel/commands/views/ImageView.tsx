import type { CommandViewAnimation } from "#components/Command.tsx";
import type { useAnimation } from "framer-motion";
import { motion } from "framer-motion";
import type { CSSProperties } from "react";

export type ImageViewProps = {
  uri: string;
  align?: "top" | "bottom";
  style?: CSSProperties;
  animation?: CommandViewAnimation;
  controls: ReturnType<typeof useAnimation>;
};

export function ImageView(props: ImageViewProps) {
  const animation = props.animation ?? imageAnimation;
  const style: CSSProperties = {};
  if (props.align === "top" || props.align === "bottom") {
    style.width = "100%";
    style[props.align] = 0;
  }

  Object.assign(style, props.style);

  return (
    <motion.div
      variants={animation}
      initial="initial"
      animate={props.controls}
      className="pointer-events-none absolute inset-0 flex"
    >
      {/* oxlint-disable-next-line nextjs/no-img-element -- Library image URLs must work in host frameworks without a Next image loader. */}
      <img
        src={props.uri}
        alt=""
        className="absolute max-w-none"
        style={style}
      />
    </motion.div>
  );
}

const imageAnimation: CommandViewAnimation = {
  initial: { opacity: 0 },
  entrance: { opacity: 1, transition: { duration: 1 } },
  exit: { opacity: 0, transition: { duration: 0.5, ease: "easeOut" } },
};
