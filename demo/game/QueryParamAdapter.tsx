"use client";

import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import type {
  QueryParamAdapterComponent,
  QueryParamAdapter as QueryParamAdapterValue,
} from "use-query-params";

export function QueryParamAdapter(
  props: Parameters<QueryParamAdapterComponent>[0],
) {
  const searchParams = useSearchParams();

  const adapter = useMemo<QueryParamAdapterValue>(
    () => ({
      location: { search: searchParams.toString() },
      // NOTE: Native history writes sync Next's query state without fetching
      // a new route for each statement. Preserve the pathname and fragment.
      push: (location) => {
        window.history.pushState(
          null,
          "",
          `${window.location.pathname}${location.search}${window.location.hash}`,
        );
      },
      replace: (location) => {
        window.history.replaceState(
          null,
          "",
          `${window.location.pathname}${location.search}${window.location.hash}`,
        );
      },
    }),
    [searchParams],
  );

  return props.children(adapter);
}
