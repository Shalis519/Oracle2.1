import { Router, type IRouter } from "express";
import healthRouter from "./health";
import profileRouter from "./profile";
import forecastRouter from "./forecast";
import activationsRouter from "./activations";
import systemsRouter from "./systems";
import baziHoursRouter from "./baziHours";
import contactsRouter from "./contacts";
import dreamsRouter from "./dreams";
import tasksRouter from "./tasks";
import travelRouter from "./travel";
import chatRouter from "./chat";
import journalRouter from "./journal";
import astrologyRouter from "./astrology";
import notepadRouter from "./notepad";

const router: IRouter = Router();

router.use(healthRouter);
router.use(profileRouter);
router.use(forecastRouter);
router.use(activationsRouter);
router.use(systemsRouter);
router.use(baziHoursRouter);
router.use(contactsRouter);
router.use(dreamsRouter);
router.use(tasksRouter);
router.use(travelRouter);
router.use(chatRouter);
router.use(journalRouter);
router.use(astrologyRouter);
router.use(notepadRouter);

export default router;
