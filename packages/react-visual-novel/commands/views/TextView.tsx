import type {AnimationControls} from 'framer-motion'
import {motion} from 'framer-motion'
import React from 'react'
import {twMerge} from 'tailwind-merge'
import type {
  CommandViewAnimation,
  CommandViewColorScheme,
} from '../../components'
import {useBranchContext, useGameContext} from '../../contexts'
import type {CharGroup} from './char-group'
import type {Frame} from './frame'
import {styleForFrame} from './frame'

export type TextPlacement = 'top' | 'middle' | 'bottom'

export interface TextViewProps {
  groups: CharGroup[]
  controls: AnimationControls
  tag?: string | {text: string; color?: string; style?: React.CSSProperties}
  placement?: TextPlacement
  style?: React.CSSProperties
  frame?: Frame
  scheme?: CommandViewColorScheme
}

export function TextView({
  groups,
  controls,
  tag,
  placement = 'top',
  style,
  frame,
  scheme,
}: TextViewProps) {
  const {handleLinkClick, playSound} = useGameContext()
  const {containerRect} = useBranchContext()
  const length = groups.flatMap((g) => g.chars).length
  const size: 'md' | 'lg' | 'xl' = (() => {
    if (length > 90) {
      return 'md'
    }
    if (length > 40) {
      return 'lg'
    }
    return 'xl'
  })()
  const fontSize = `${containerRect?.width / REFERENCE_SIZE[0]}em`
  return (
    <div
      className={twMerge(
        'pointer-events-none absolute inset-0 flex flex-col p-8 py-20',
        {
          top: 'justify-start',
          middle: 'justify-center',
          bottom: 'justify-end',
        }[placement],
      )}
    >
      <div className="pointer-events-auto z-10 flex flex-col items-center space-y-2">
        {tag && (
          <motion.span
            variants={{
              initial: {opacity: 0},
              entrance: {
                opacity: 1,
                transition: {duration: 1},
              },
              exit: {
                opacity: 0,
                transition: {duration: 0.5, ease: 'easeOut'},
              },
            }}
            initial="initial"
            animate={controls}
            className="rvn-tag mb-1 whitespace-pre-wrap rounded-md px-1 text-center font-script text-base"
            style={{
              ...(typeof tag === 'object' &&
                tag.color && {
                  backgroundColor: tag.color,
                  color: 'white',
                }),
              ...(typeof tag === 'object' && tag.style),
            }}
          >
            {typeof tag === 'string' ? tag : tag.text}
          </motion.span>
        )}

        <div
          className={twMerge(
            'rvn-text whitespace-pre-wrap text-center font-script leading-tight',
            scheme === 'dark' && 'rvn-text--dark',
            {
              md: 'text-base',
              lg: 'text-xl',
              xl: 'text-3xl',
            }[size],
          )}
          style={{
            ...style,
            ...(frame && styleForFrame({containerRect}, frame)),
          }}
        >
          {groups.map((group, groupIdx) => {
            switch (group.type) {
              case 'text':
                return (
                  <React.Fragment key={groupIdx}>
                    {group.chars.map((char, charIdx) => (
                      <motion.span
                        key={`${char}_${group.startIndex + charIdx}`}
                        style={{fontSize}}
                        variants={charAnimation}
                        initial="initial"
                        animate={controls}
                        custom={group.startIndex + charIdx}
                      >
                        {char}
                      </motion.span>
                    ))}
                  </React.Fragment>
                )
              case 'link':
                return (
                  <a
                    key={groupIdx}
                    href={group.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(event) => {
                      event.stopPropagation()
                      playSound('click')
                      handleLinkClick(group.url, group.chars.join(''), event)
                    }}
                    className="-m-4 p-4 underline"
                    style={{
                      fontSize,
                      textUnderlineOffset: size ? '6px' : '4px',
                    }}
                  >
                    {group.chars.map((char, charIdx) => (
                      <motion.span
                        key={`${char}_${group.startIndex + charIdx}`}
                        variants={charAnimation}
                        initial="initial"
                        animate={controls}
                        custom={group.startIndex + charIdx}
                      >
                        {char}
                      </motion.span>
                    ))}
                  </a>
                )
            }
          })}
        </div>
      </div>
    </div>
  )
}

const charAnimation: CommandViewAnimation = {
  initial: {opacity: 0},
  entrance: (idx) => ({
    opacity: 1,
    transition: {delay: 0.5 + 0.05 * idx},
  }),
  exit: {
    opacity: 0,
    transition: {duration: 0.5, ease: 'easeOut'},
  },
}

const REFERENCE_SIZE = [375, 667] as const
