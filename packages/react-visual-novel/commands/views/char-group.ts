import type {Paragraph} from 'mdast'
import {fromMarkdown} from 'mdast-util-from-markdown'
import type {PhrasingContent} from 'mdast-util-from-markdown/lib'

export type CharGroup =
  | {
      type: 'text'
      chars: string[]
      startIndex: number
    }
  | {
      type: 'link'
      url: string
      chars: string[]
      startIndex: number
    }

export function charGroupsForMarkdown(value: string) {
  const tree = fromMarkdown(value)
  const paragraphs: Paragraph[] = []
  for (const child of tree.children) {
    switch (child.type) {
      case 'paragraph':
        paragraphs.push(child)
        break
      case 'code':
        paragraphs.push({
          type: 'paragraph',
          children: [{type: 'text', value: child.value}],
        })
        break
      default:
        console.warn('Unsupported syntax', child)
        continue
    }
  }
  const groups: CharGroup[] = []
  let startIndex = 0
  for (const p of paragraphs) {
    if (groups.length > 0) {
      groups.push({type: 'text', chars: ['\n', '\n'], startIndex})
      startIndex += 1
    }
    for (const node of p.children) {
      switch (node.type) {
        case 'text': {
          const chars = node.value.split('')
          groups.push({
            type: 'text',
            chars,
            startIndex,
          })
          startIndex += chars.length
          break
        }
        case 'link': {
          const value = getContentValue(node)
          const chars = value.split('')
          groups.push({
            type: 'link',
            url: node.url,
            chars,
            startIndex,
          })
          startIndex += chars.length
          break
        }
        default:
          console.warn('Unsupported syntax', node)
          break
      }
    }
  }
  return groups
}

function getContentValue(node: {children: PhrasingContent[]}) {
  let value = ''
  for (const c of node.children) {
    switch (c.type) {
      case 'text':
        value += c.value
        break
      case 'emphasis':
      case 'strong':
        value += getContentValue(c)
        break
      default:
        console.warn('Unsupported syntax', node)
        break
    }
  }
  return value
}
