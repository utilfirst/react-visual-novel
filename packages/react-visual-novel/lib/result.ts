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
