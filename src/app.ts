import cors from "cors";
import express, { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import globalErrorHandler from "./app/middlewares/globalErrorHandler";
import router from "./routes";
import cookieParser from "cookie-parser";
import { Morgan } from "./shared/morgen";
// import admin from 'firebase-admin';
// import ServiceAccount from '../medmeet-admin.json';
const app: express.Application = express();

//morgan
app.use(Morgan.successHandler);
app.use(Morgan.errorHandler);
// admin.initializeApp({
//   credential: admin.credential.cert(ServiceAccount as admin.ServiceAccount),
// });
//body parser

app.use(
  cors({
    origin: ["https://joura.info", "http://localhost:3000", "http://10.10.12.125:3000", "http://localhost:3001"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

//file retrieve
app.use(express.static("uploads"));

//router
app.use("/api/v1", router);

//live response
app.get("/", (req: Request, res: Response) => {
  res.send(
    ` <div style="display: flex; align-items: center; justify-content: center; height: 100vh; background: #f5f3ff; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
    <div style="text-align: center; padding: 2rem 3rem; background-color: #ffffff; border-radius: 16px; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08);">
      <h1 style="font-size: 2.5rem; color: #7C3AED; margin-bottom: 1rem;">Welcome 👋</h1>
      <p style="font-size: 1.2rem; color: #555;">I'm here to help you. How can I assist today?</p>
      <div style="margin-top: 2rem;">
        <p style="color: #777;">Want to see more projects or contact me?</p>
        <a href="https://github.com/abdullahalkafi-dev" target="_blank" style="text-decoration: none; color: #fff; background-color: #6D28D9; padding: 0.75rem 1.5rem; border-radius: 8px; font-weight: bold; display: inline-block; transition: background 0.3s;">
          Visit My GitHub 🚀
        </a>
      </div>
    </div>
  </div>`
  );
});

//global error handle
app.use(globalErrorHandler);

//handle not found route;
app.use((req, res) => {
  res.status(StatusCodes.NOT_FOUND).json({
    success: false,
    message: "Not found",
    errorMessages: [
      {
        path: req.originalUrl,
        message: "API DOESN'T EXIST",
      },
    ],
  });
});

export default app;
