/**
 * Railway-Oriented Programming (ROP) Result Pattern
 * Menjamin penanganan error bisnis secara deterministik dan eksplisit tanpa exception runtime liar.
 */

export interface AppError {
  readonly code: string;
  readonly message: string;
  readonly status: number;
  readonly details?: Record<string, unknown> | undefined;
}

export class DomainError implements AppError {
  constructor(
  public readonly code: string,
  public readonly message: string,
  public readonly status: number = 400,
  public readonly details?: Record<string, unknown> | undefined
  ) {}
}

export type Result<T, E = AppError> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E };

export const Ok = <T>(value: T): Result<T, never> => ({ ok: true, value });
export const Err = <E>(error: E): Result<never, E> => ({ ok: false, error });

/**
 * Helper untuk memetakan (map) nilai sukses
 */
export function mapResult<T, U, E>(
  result: Result<T, E>,
  fn: (val: T) => U
): Result<U, E> {
  if (result.ok) {
  return Ok(fn(result.value));
  }
  return result;
}

/**
 * Helper untuk chaining (flatMap / bind) operasi berurutan
 */
export function flatMapResult<T, U, E>(
  result: Result<T, E>,
  fn: (val: T) => Result<U, E>
): Result<U, E> {
  if (result.ok) {
  return fn(result.value);
  }
  return result;
}
