import { ZodError, ZodIssue } from "zod";
import { TErrorSources, TGenericErrorResponse } from "../../types/error";

// Helper function to generate user-friendly error messages
const generateUserFriendlyMessage = (issue: ZodIssue): string => {
  const fieldName = issue?.path[issue.path.length - 1] || "Field";
  
  // Format field name: convert camelCase to Title Case with spaces
  const formattedFieldName = String(fieldName)
    .replace(/([A-Z])/g, ' $1')
    .trim()
    .toLowerCase()
    .replace(/^./, str => str.toUpperCase());

  switch (issue.code) {
    case "invalid_type":
      if (issue.received === "undefined" || issue.received === "null") {
        return `${formattedFieldName} is required`;
      }
      
      // Map technical types to user-friendly terms
      const typeMap: Record<string, string> = {
        string: "text",
        number: "number",
        boolean: "true/false value",
        array: "list",
        object: "valid data",
        date: "date",
      };
      
      const expectedType = typeMap[issue.expected] || issue.expected;
      const receivedType = typeMap[issue.received] || issue.received;
      
      return `${formattedFieldName} must be a ${expectedType}, but received ${receivedType}`;
    
    case "invalid_string":
      if (issue.validation === "email") {
        return `${formattedFieldName} must be a valid email address`;
      }
      if (issue.validation === "url") {
        return `${formattedFieldName} must be a valid URL`;
      }
      if (issue.validation === "uuid") {
        return `${formattedFieldName} must be a valid UUID`;
      }
      return `${formattedFieldName} format is invalid`;
    
    case "too_small":
      if (issue.type === "string") {
        return `${formattedFieldName} must be at least ${issue.minimum} characters long`;
      }
      if (issue.type === "number") {
        return `${formattedFieldName} must be at least ${issue.minimum}`;
      }
      if (issue.type === "array") {
        return `${formattedFieldName} must contain at least ${issue.minimum} item(s)`;
      }
      return `${formattedFieldName} is too small`;
    
    case "too_big":
      if (issue.type === "string") {
        return `${formattedFieldName} must be at most ${issue.maximum} characters long`;
      }
      if (issue.type === "number") {
        return `${formattedFieldName} must be at most ${issue.maximum}`;
      }
      if (issue.type === "array") {
        return `${formattedFieldName} must contain at most ${issue.maximum} item(s)`;
      }
      return `${formattedFieldName} is too large`;
    
    case "invalid_enum_value":
      return `${formattedFieldName} must be one of: ${issue.options?.join(", ")}`;
    
    case "unrecognized_keys":
      return `Unrecognized field(s): ${issue.keys?.join(", ")}`;
    
    case "invalid_date":
      return `${formattedFieldName} must be a valid date`;
    
    case "custom":
      return issue.message || `${formattedFieldName} is invalid`;
    
    default:
      // Fallback to the original message if we don't have a specific handler
      return issue.message;
  }
};

const handleZodError = (err: ZodError): TGenericErrorResponse => {
  const errorSources: TErrorSources = err.issues.map((issue: ZodIssue) => {
    return {
      path: issue?.path[issue.path.length - 1],
      message: generateUserFriendlyMessage(issue),
    };
  });

  const statusCode = 400;

  // Generate a meaningful message based on the number of errors
  let message: string;
  if (errorSources.length === 1) {
    // Single error: use the error message directly
    message = errorSources[0].message;
  } else if (errorSources.length === 2) {
    // Two errors: mention both fields
    message = `Invalid input for ${errorSources.map(e => e.path).join(' and ')}`;
  } else {
    // Multiple errors: provide a count
    message = `${errorSources.length} validation errors found. Please check your input.`;
  }

  return {
    statusCode,
    message,
    errorSources,
  };
};

export default handleZodError;
