import type {CommandViewAnimation} from '../../components'
import type {AnimationControls} from 'framer-motion'
import {motion} from 'framer-motion'

export interface ImageViewProps {
  uri: string
  align?: 'top' | 'bottom'
  style?: React.CSSProperties
  animation?: CommandViewAnimation
  controls: AnimationControls
}

export function ImageView({
  uri,
  align,
  style,
  animation = {
    initial: {opacity: 0},
    entrance: {
      opacity: 1,
      transition: {duration: 1},
    },
    exit: {
      opacity: 0,
      transition: {duration: 0.5, ease: 'easeOut'},
    },
  },
  controls,
}: ImageViewProps) {
  return (
    <motion.div
      variants={animation}
      initial="initial"
      animate={controls}
      className="pointer-events-none absolute inset-0 flex"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={uri}
        alt=""
        className="absolute max-w-none"
        style={{
          ...(align === 'top' && {
            width: '100%',
            top: 0,
          }),
          ...(align === 'bottom' && {
            width: '100%',
            bottom: 0,
          }),
          ...style,
        }}
      />
    </motion.div>
  )
}
