// Error helpers: turn unknown errors into safe, readable messages.

/** Extracts a human-readable message from an unknown error value. */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as { message: unknown }).message === "string"
  ) {
    return (error as { message: string }).message;
  }
  return "An unexpected error occurred.";
}
