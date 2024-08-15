import { Router } from "express";
import { authenticateJWT } from '../utils/jwt.js'
import { login, register, renderLogin, renderRegister, logout } from "../controllers/sessionController.js";

const sessionRouter = Router()

sessionRouter.get('/login', renderLogin);
sessionRouter.post('/login', login);
sessionRouter.get('/register', renderRegister);
sessionRouter.post('/logout', authenticateJWT, logout);
sessionRouter.post('/register', register);

export default sessionRouter