import { StatementProvider } from "#contexts/index.ts";
import React from "react";
import { isFragment } from "react-is";

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
  return flattenChildren({ children })
    .filter((child) => React.isValidElement(child))
    .flatMap((child) => {
      if (React.isValidElement<LabelProps>(child) && child.type === Label) {
        const subchildren = unwrapStatements(child.props.children);

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
  depth?: number;
  keys?: (string | number)[];
};

// NOTE: Flatten nested fragments while retaining React-assigned keys.
function flattenChildren(options: FlattenChildrenOptions): React.ReactNode[] {
  const depth = options.depth ?? 0;
  const keys = options.keys ?? [];

  // oxlint-disable-next-line react/no-react-children -- The Branch API consumes a React child tree and must preserve React's key assignment.
  return React.Children.toArray(options.children).reduce(
    (children: React.ReactNode[], node) => {
      if (
        React.isValidElement<{ children?: React.ReactNode }>(node) &&
        isFragment(node)
      ) {
        children.push(
          ...flattenChildren({
            children: node.props.children,
            depth: depth + 1,
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
      } else if (typeof node === "string" || typeof node === "number") {
        children.push(node);
      }

      return children;
    },
    [],
  );
}
