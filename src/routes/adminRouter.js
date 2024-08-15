import { Router } from 'express';
import dotenv from 'dotenv';
import { authenticateJWT } from '../utils/jwt.js';
import { isAdmin } from "../utils/jwt.js";
import { getUsers, getProducts, updateStock, addNewProduct, deleteUser, autodelete } from '../controllers/adminController.js';

dotenv.config();

const adminRouter = Router();
adminRouter.get('/users', authenticateJWT, isAdmin, getUsers);
adminRouter.get('/products', authenticateJWT, isAdmin, getProducts);
adminRouter.post('/products/add', authenticateJWT, isAdmin, addNewProduct);
adminRouter.post('/products/updateStock', authenticateJWT, isAdmin, updateStock);
adminRouter.post('/users/delete/:id', authenticateJWT, isAdmin, deleteUser);
adminRouter.post('/autodelete', authenticateJWT, isAdmin, autodelete);

export default adminRouter;