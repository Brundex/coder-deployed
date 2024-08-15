import jwt from 'jsonwebtoken'
import dotenv from 'dotenv';
import { logger } from './logger.js';

dotenv.config();

export const PRIVATE_KEY = process.env.PRIVATE_KEY

export const generateToken = (user) => {
    const token = jwt.sign({ user }, PRIVATE_KEY, { expiresIn: '12h' })
    return token
}

export const authenticateJWT = (req, res, next) => {
    const token = req.cookies.token;

    jwt.verify(token, PRIVATE_KEY, (err, user) => {
        if (err) {
            return res.redirect('/login');
        }
        req.user = user;
        next();
    });
};

export const isUser = (req, res, next) => {
    if (req.user.user.rol === 'admin') {
        return res.status(403).send('Solo usuarios con rol "user" pueden comprar');
    }
    next();
};

export const isAdmin = (req, res, next) => {
    logger.info('Comprobando si el usuario es admin');
    if (req.user.user.rol === 'admin') {
        logger.info('Usuario admin autenticado');
        return next();
    }
    logger.warn('Acceso denegado: usuario no es admin');
    res.status(403).send('Access denied');
};