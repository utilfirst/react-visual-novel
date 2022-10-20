import React from 'react'
import {isFragment} from 'react-is'
import {StatementProvider} from '../contexts'

export interface BranchProps {
  children?: React.ReactElement[] | React.ReactElement
}

export function Branch({children: childrenProp}: BranchProps) {
  const statements = React.useMemo(
    () => unwrapStatements(childrenProp),
    [childrenProp],
  )
  return (
    <>
      {statements.map((child, idx) => (
        <StatementProvider
          key={child.key}
          statementIndex={idx}
          statementLabel={
            child.type === Label ? (child.props as LabelProps).label : null
          }
        >
          {child}
        </StatementProvider>
      ))}
    </>
  )
}

// MARK: Label

export interface LabelProps {
  label: string
  children: React.ReactNode
}

export function Label({children}: LabelProps) {
  return <>{children}</>
}

// MARK: Helpers

function unwrapStatements(children: React.ReactNode): React.ReactElement[] {
  return flattenChildren(children)
    .filter(React.isValidElement)
    .flatMap((c) => {
      if (c.type === Label) {
        const props = c.props as LabelProps
        const subchildren = unwrapStatements(props.children)
        return [
          <Label key={props.label} label={props.label}>
            {subchildren[0]}
          </Label>,
          ...subchildren
            .slice(1)
            .map((el) =>
              React.cloneElement(el, {key: `${props.label}.${el.key}`}),
            ),
        ]
      }
      return [c]
    })
}

/**
 * Similar to [React's built-in `Children.toArray` method](https://reactjs.org/docs/react-api.html#reactchildrentoarray),
 * this utility takes children and returns them as an array for introspection or filtering.
 *
 * Different from `Children.toArray`, it will flatten arrays and `React.Fragment`s into a regular, one-dimensional
 * array while ensuring element and fragment keys are preserved, unique, and stable between renders.
 *
 * Copied from https://github.com/grrowl/react-keyed-flatten-children (since ESM import doesn't work with the module)
 */
function flattenChildren(
  children: React.ReactNode,
  depth: number = 0,
  keys: Array<string | number> = [],
): React.ReactNode[] {
  return React.Children.toArray(children).reduce(
    (acc: React.ReactNode[], node) => {
      if (isFragment(node)) {
        acc.push(
          ...flattenChildren(
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
            node.props.children,
            depth + 1,
            /**
             * No need for index fallback, React will always assign keys
             * See: https://reactjs.org/docs/react-api.html#reactchildrentoarray
             */
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            keys.concat(node.key!),
          ),
        )
      } else {
        if (React.isValidElement(node)) {
          acc.push(
            React.cloneElement(node, {
              key: keys.concat(String(node.key)).join('.'),
            }),
          )
        } else if (typeof node === 'string' || typeof node === 'number') {
          acc.push(node)
        }
      }
      return acc
    },
    [],
  )
}
