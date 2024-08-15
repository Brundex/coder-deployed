import { Router } from "express";
import { authenticateJWT} from "../utils/jwt.js";
import { isUser } from "../utils/jwt.js";
import { addProductCart, checkout, getCart, updateCart } from "../controllers/cartController.js";

const cartRouter = Router()
cartRouter.get('/', authenticateJWT, isUser, getCart);
cartRouter.post('/add', authenticateJWT, isUser, addProductCart);
cartRouter.post('/update/:cid/:pid', authenticateJWT, isUser, updateCart);
cartRouter.post('/checkout/:cid', authenticateJWT, isUser, checkout);

export default cartRouter