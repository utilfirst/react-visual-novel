import { StatementProvider } from "#contexts/StatementContext.tsx";
import type { ReactElement, ReactNode } from "react";
import {
  Children,
  Fragment,
  cloneElement,
  isValidElement,
  useMemo,
} from "react";

export type BranchProps = {
  children?: ReactElement[] | ReactElement;
};

export function Branch(props: BranchProps) {
  const statements = useMemo(
    () => unwrapStatements(props.children),
    [props.children],
  );

  return (
    <>
      {statements.map((child, statementIndex) => (
        <StatementProvider
          key={child.key}
          statementIndex={statementIndex}
          statementLabel={
            isValidElement<LabelProps>(child) && child.type === Label
              ? child.props.label
              : null
          }
        >
          {child}
        </StatementProvider>
      ))}
    </>
  );
}

export type LabelProps = {
  label: string;
  children: ReactNode;
};

export function Label(props: LabelProps) {
  return props.children;
}

function unwrapStatements(children: ReactNode): ReactElement[] {
  return flattenChildren({ children }).flatMap((child) => {
    if (isValidElement<LabelProps>(child) && child.type === Label) {
      const subchildren = unwrapStatements(child.props.children);
      if (subchildren.length === 0) {
        // NOTE: An empty label registers no command and must not consume
        // an index in the contiguous statement sequence.
        return [];
      }

      return [
        <Label key={child.props.label} label={child.props.label}>
          {subchildren[0]}
        </Label>,
        ...subchildren.slice(1).map((element) =>
          // oxlint-disable-next-line react/no-clone-element -- Labels must prefix child keys to preserve statement identity across nested branches.
          cloneElement(element, {
            key: `${child.props.label}.${element.key}`,
          }),
        ),
      ];
    }

    return [child];
  });
}

type FlattenChildrenOptions = {
  children: ReactNode;
  keys?: (string | number)[];
};

// NOTE: Flatten nested fragments while retaining React-assigned keys.
function flattenChildren(options: FlattenChildrenOptions): ReactElement[] {
  const keys = options.keys ?? [];

  // oxlint-disable-next-line react/no-react-children -- The Branch API consumes a React child tree and must preserve React's key assignment.
  return Children.toArray(options.children).reduce(
    (children: ReactElement[], node) => {
      if (
        isValidElement<{ children?: ReactNode }>(node) &&
        node.type === Fragment
      ) {
        children.push(
          ...flattenChildren({
            children: node.props.children,
            // NOTE: Children.toArray assigns a key to every element.
            keys: keys.concat(String(node.key)),
          }),
        );
      } else if (isValidElement(node)) {
        children.push(
          // oxlint-disable-next-line react/no-clone-element -- Flattened fragment children need their enclosing key path to remain unique.
          cloneElement(node, {
            key: keys.concat(String(node.key)).join("."),
          }),
        );
      }

      return children;
    },
    [],
  );
}
