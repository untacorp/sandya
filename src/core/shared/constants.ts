/**
 * Central Core Constants for Sandya
 * Eliminates magic numbers across domain logic, cryptography, codecs, and API layers.
 */

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
} as const;

export const TIME_CONSTANTS = {
  MS_PER_SECOND: 1_000,
  SECONDS_PER_MINUTE: 60,
  MINUTES_PER_HOUR: 60,
  HOURS_PER_DAY: 24,
  MS_PER_MINUTE: 60_000,
  MS_PER_HOUR: 3_600_000,
  MS_PER_DAY: 86_400_000,
} as const;

export const RADIX = {
  BINARY: 2,
  OCTAL: 8,
  DECIMAL: 10,
  HEXADECIMAL: 16,
  BASE36: 36,
} as const;

export const BITWISE = {
  BYTE_MASK: 0xff,
  NIBBLE_MASK: 0x0f,
  NIBBLE_SHIFT: 4,
  BITS_PER_BYTE: 8,
  UINT16_MASK: 0xffff,
  UINT32_MASK: 0xffffffffn,
  BIGINT_BYTE_MASK: 0xffn,
  BIGINT_SHIFT_32: 32n,
  PERCENTAGE_MAX: 100,
} as const;
