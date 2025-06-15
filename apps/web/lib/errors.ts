export type ErrorType =
  | "bad_request"
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "internal_server_error"
  | "model_not_found"
  | "api_key_missing"
  | "file_too_large"
  | "unsupported_file_type"
  | "rate_limit"
  | "upload_failed";

export type Surface =
  | "auth"
  | "api"
  | "chat"
  | "stream"
  | "database"
  | "files"
  | "models"
  | "thread"
  | "attachment";

export type ErrorCode = `${ErrorType}:${Surface}`;

export type ErrorVisibility = "response" | "log" | "none";

export const visibilityBySurface: Record<Surface, ErrorVisibility> = {
  database: "log",
  auth: "response",
  api: "response",
  chat: "response",
  stream: "response",
  files: "response",
  models: "response",
  thread: "response",
  attachment: "response",
};

export class OneChatSDKError extends Error {
  public type: ErrorType;
  public surface: Surface;
  public statusCode: number;

  constructor(errorCode: ErrorCode, cause?: string) {
    super();

    const [type, surface] = errorCode.split(":") as [ErrorType, Surface];

    this.type = type;
    this.surface = surface;
    this.cause = cause;
    this.message = getMessageByErrorCode(errorCode);
    this.statusCode = getStatusCodeByType(this.type);
  }

  public toResponse() {
    const code: ErrorCode = `${this.type}:${this.surface}`;
    const visibility = visibilityBySurface[this.surface];
    const { message, cause, statusCode } = this;

    if (visibility === "log") {
      console.error({
        code,
        message,
        cause,
      });

      return Response.json(
        { error: "Something went wrong. Please try again later." },
        { status: statusCode }
      );
    }

    const errorResponse: Record<string, any> = {
      message,
      code,
    };

    if (cause) {
      errorResponse.cause = cause;
    }

    return Response.json(errorResponse, { status: statusCode });
  }
}

export function getMessageByErrorCode(errorCode: ErrorCode): string {
  // Database errors - logged only
  if (errorCode.includes("database")) {
    return "An error occurred while executing a database query.";
  }

  switch (errorCode) {
    // Auth errors
    case "unauthorized:auth":
      return "You need to sign in before continuing.";
    case "forbidden:auth":
      return "Your account does not have access to this feature.";

    // API errors
    case "bad_request:api":
      return "The request couldn't be processed. Please check your input and try again.";

    // Chat errors
    case "unauthorized:chat":
      return "You need to sign in to access this chat. Please sign in and try again.";
    case "not_found:chat":
      return "The requested chat was not found. Please check the chat ID and try again.";
    case "forbidden:chat":
      return "This chat belongs to another user. Please check the chat ID and try again.";
    case "rate_limit:chat":
      return "You have exceeded your maximum number of messages. Please try again later.";

    // Model errors
    case "model_not_found:models":
      return "The requested AI model was not found. Please select a different model.";
    case "api_key_missing:models":
      return "API key is missing for the selected model. Please contact support.";

    // File errors
    case "unauthorized:files":
      return "You need to sign in to upload files. Please sign in and try again.";
    case "file_too_large:files":
      return "File is too large. Maximum file size is 8MB.";
    case "unsupported_file_type:files":
      return "This file type is not supported by the selected model.";
    case "upload_failed:files":
      return "File upload failed. Please try again.";

    // Thread errors
    case "unauthorized:thread":
      return "You need to sign in to access this thread. Please sign in and try again.";
    case "not_found:thread":
      return "The requested thread was not found. Please check the thread ID and try again.";
    case "forbidden:thread":
      return "This thread belongs to another user. Please check the thread ID and try again.";

    // Attachment errors
    case "not_found:attachment":
      return "The requested attachment was not found. Please check the attachment ID and try again.";
    case "forbidden:attachment":
      return "This attachment belongs to another user. Please check the attachment ID and try again.";
    case "unauthorized:attachment":
      return "You need to sign in to access this attachment. Please sign in and try again.";

    default:
      return "Something went wrong. Please try again later.";
  }
}

function getStatusCodeByType(type: ErrorType): number {
  switch (type) {
    case "bad_request":
      return 400;
    case "unauthorized":
      return 401;
    case "forbidden":
      return 403;
    case "not_found":
      return 404;
    case "rate_limit":
      return 429;
    case "file_too_large":
      return 413;
    case "unsupported_file_type":
      return 415;
    case "upload_failed":
      return 422;
    case "model_not_found":
      return 404;
    case "api_key_missing":
      return 503;
    case "internal_server_error":
    default:
      return 500;
  }
}
