export class ApiError extends Error {
    constructor(public status: number, message: string) {
      super(message);
      this.name = this.constructor.name;
      Error.captureStackTrace(this, this.constructor);
    }
  }