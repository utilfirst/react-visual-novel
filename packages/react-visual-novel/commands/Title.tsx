import {motion} from 'framer-motion'
import type {CommandProps} from '../components'
import {Command} from '../components'

export interface TitleProps extends Pick<CommandProps, 'hide'> {
  children: string
  durationMs?: number
}

export function Title({children, durationMs = 4000, hide}: TitleProps) {
  return (
    <Command
      name="Title"
      behavior={['skippable_timed', {durationMs}]}
      hide={hide}
    >
      {(controls) => (
        <div className="flex flex-1 flex-col justify-center p-8">
          <motion.span
            variants={{
              initial: {opacity: 0},
              entrance: {
                opacity: 1,
                transition: {duration: 4},
              },
              exit: {
                opacity: 0,
                transition: {duration: 0.5, ease: 'easeOut'},
              },
            }}
            initial="initial"
            animate={controls}
            className="rvn-title"
          >
            {children}
          </motion.span>
        </div>
      )}
    </Command>
  )
}
