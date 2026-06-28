import { Router, type IRouter } from "express";
import healthRouter from "./health";
import profileRouter from "./profile";
import forecastRouter from "./forecast";
import systemsRouter from "./systems";
import contactsRouter from "./contacts";
import dreamsRouter from "./dreams";
import tasksRouter from "./tasks";
import travelRouter from "./travel";

const router: IRouter = Router();

router.use(healthRouter);
router.use(profileRouter);
router.use(forecastRouter);
router.use(systemsRouter);
router.use(contactsRouter);
router.use(dreamsRouter);
router.use(tasksRouter);
router.use(travelRouter);

export default router;
