import express, { Router } from "express";
import { UserRoutes } from "../app/modules/user/user.route";
import { ProfileRoutes } from "../app/modules/profile/profile.route";
import { MatchRoutes } from "../app/modules/match/match.route";

const router: Router = express.Router();

const apiRoutes = [
  {
    path: "/user",
    route: UserRoutes,
  },
  {
    path: "/profile",
    route: ProfileRoutes,
  },
  {
    path: "/match",
    route: MatchRoutes,
  },
];

apiRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
