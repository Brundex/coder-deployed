import { Router } from "express";
import { authenticateJWT } from '../utils/jwt.js'
import { isUser } from "../utils/jwt.js";
import { getProducts } from "../controllers/productsController.js";

const productsRouter = Router()

productsRouter.get('/', authenticateJWT, isUser, getProducts);

export default productsRouter