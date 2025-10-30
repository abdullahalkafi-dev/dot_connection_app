import { NextFunction, Request, Response } from "express";
import { AnyZodObject } from "zod";

const validateRequest =
  (schema: AnyZodObject) =>
  async (req: Request, res: Response, next: NextFunction) => {
     console.log({
        body: req.body,
        params: req.params,
        query: req.query,
        cookies: req.cookies,
        data: req?.body?.data ? JSON.parse(req?.body?.data) : null,
      });
    try {
      await schema.parseAsync({
        body: req.body,
        params: req.params,
        query: req.query,
        cookies: req.cookies,
        data: req?.body?.data ? JSON.parse(req?.body?.data) : null,
      });
      next();
    } catch (error) {
      next(error);
    }
  };
export default validateRequest;
