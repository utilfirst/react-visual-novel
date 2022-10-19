import React from 'react'

export function useResult<E, D>(initial: Result<E, D> = {status: 'loading'}) {
  return React.useState<Result<E, D>>(initial)
}

export type Result<E, D> =
  | {
      status: 'loading'
      data?: never
      error?: never
    }
  | {
      status: 'failure'
      data?: never
      error: E
    }
  | {
      status: 'success'
      data: D
      error?: never
    }
