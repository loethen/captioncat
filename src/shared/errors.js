// Errors that reach the user carry a code instead of text; the page that shows
// them translates `error.<code>` with its own locale.
export class AppError extends Error {
  constructor(code, params) { super(code); this.code = code; this.params = params; }
}
