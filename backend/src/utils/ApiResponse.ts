class ApiResponse<T = any> {
  public statusCode: number;
  public success: boolean;
  public data: T;
  public error: string | null;
  public message: string;
  public meta?: Record<string, any>;

  constructor(
    statusCode: number,
    data: T,
    message: string = "Success",
    meta?: Record<string, any>
  ) {
    this.statusCode = statusCode;
    this.success = statusCode < 400;
    this.data = data;
    this.error = null;
    this.message = message;

    if (meta) {
      this.meta = meta;
    }
  }

  toJSON() {
    const json: Record<string, any> = {
      success: this.success,
      data: this.data,
      error: this.error,
      message: this.message,
    };
    if (this.meta) {
      json.meta = this.meta;
    }
    return json;
  }
}

export { ApiResponse };
