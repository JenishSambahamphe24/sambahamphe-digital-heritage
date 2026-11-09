export class DateOutOfRangeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DateOutOfRangeError";
  }
}
