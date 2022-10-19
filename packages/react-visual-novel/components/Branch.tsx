import React from 'react'
import flattenChildren from 'react-keyed-flatten-children'
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
          }>
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
