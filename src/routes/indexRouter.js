import express from 'express'
import cartRouter from './cartRouter.js'
import productsRouter from './productsRouter.js'
import sessionRouter from './sessionRouter.js'
import adminRouter from './adminRouter.js'
import { __dirname } from '../path.js'
import { logger } from '../utils/logger.js';


const indexRouter = express.Router()

indexRouter.get('/', (req, res) => {
    res.redirect('/login');
    logger.info('Redireccionando a /login');
});

indexRouter.use('/products', productsRouter);
indexRouter.use('/cart', cartRouter)
indexRouter.use('/', sessionRouter)
indexRouter.use('/admin', adminRouter)

export default indexRouter