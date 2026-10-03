import { StatementProvider } from "#contexts/index.ts";
import React from "react";

export type BranchProps = {
  children?: React.ReactElement[] | React.ReactElement;
};

export function Branch(props: BranchProps) {
  const statements = React.useMemo(
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
            React.isValidElement<LabelProps>(child) && child.type === Label
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
  children: React.ReactNode;
};

export function Label(props: LabelProps) {
  return props.children;
}

function unwrapStatements(children: React.ReactNode): React.ReactElement[] {
  return flattenChildren({ children }).flatMap((child) => {
    if (React.isValidElement<LabelProps>(child) && child.type === Label) {
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
          React.cloneElement(element, {
            key: `${child.props.label}.${element.key}`,
          }),
        ),
      ];
    }

    return [child];
  });
}

type FlattenChildrenOptions = {
  children: React.ReactNode;
  keys?: (string | number)[];
};

// NOTE: Flatten nested fragments while retaining React-assigned keys.
function flattenChildren(
  options: FlattenChildrenOptions,
): React.ReactElement[] {
  const keys = options.keys ?? [];

  // oxlint-disable-next-line react/no-react-children -- The Branch API consumes a React child tree and must preserve React's key assignment.
  return React.Children.toArray(options.children).reduce(
    (children: React.ReactElement[], node) => {
      if (
        React.isValidElement<{ children?: React.ReactNode }>(node) &&
        node.type === React.Fragment
      ) {
        children.push(
          ...flattenChildren({
            children: node.props.children,
            // NOTE: Children.toArray assigns a key to every element.
            keys: keys.concat(String(node.key)),
          }),
        );
      } else if (React.isValidElement(node)) {
        children.push(
          // oxlint-disable-next-line react/no-clone-element -- Flattened fragment children need their enclosing key path to remain unique.
          React.cloneElement(node, {
            key: keys.concat(String(node.key)).join("."),
          }),
        );
      }

      return children;
    },
    [],
  );
}
