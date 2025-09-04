import mongoose from "mongoose";
import { TErrorSources, TGenericErrorResponse } from "../../types/error";


// Todo without further modification you can use the code. If you want to customize the error message then you can do so.

const handleCastError = (
  err: mongoose.Error.CastError,
): TGenericErrorResponse => {
  const errorSources: TErrorSources = [
    {
      path: err.path,
      message: err.message,
    },
  ];

  const statusCode = 400;

  return {
    statusCode,
    message: "Invalid ID",
    errorSources,
  };
};

export default handleCastError;
