import { useState } from "react";

export function useResult<E, D>(initial?: Result<E, D>) {
  return useState<Result<E, D>>(initial ?? { status: "loading" });
}

export type Result<E, D> =
  | {
      status: "loading";
      data?: never;
      error?: never;
    }
  | {
      status: "failure";
      data?: never;
      error: E;
    }
  | {
      status: "success";
      data: D;
      error?: never;
    };
