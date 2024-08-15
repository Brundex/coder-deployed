import { userModel } from "../models/user.js";
import { logger } from '../utils/logger.js'; 
import {generateToken, PRIVATE_KEY} from '../utils/jwt.js'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'

export const renderLogin = (req, res) => {
    const token = req.cookies.token;  // Lee el token desde las cookies
    if (token) {
        jwt.verify(token, PRIVATE_KEY, (err, decodedToken) => {
            if (err) {
                logger.error('Error verificando token:', err);
                return res.render('templates/login');
            }
            const user = decodedToken.user;
            if (user.rol === 'admin') {
                logger.info('Usuario admin autenticado, redirigiendo a /admin/products');
                return res.status(200).redirect('/admin/products');
            } else {
                logger.info('Usuario autenticado, redirigiendo a /products');
                return res.status(200).redirect('/products');
            }
        });
    } else {
        logger.info('No se encontró token, mostrando página de login');
        res.status(200).render('templates/login');
    }
};
export const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        if (email === 'admin@admin.com' && password === '1234') {
            const accessToken = generateToken({ email, rol: 'admin' });
            res.cookie('token', accessToken, {
                httpOnly: true,
                secure: false,
                maxAge: 12 * 60 * 60 * 1000 // Expira en 12 horas
            });
            logger.info('Admin autenticado, redirigiendo a /admin/users');
            return res.status(200).redirect('/admin/users');
        }

        const user = await userModel.findOne({ email });

        if (!user) {
            logger.warn('Intento de inicio de sesión fallido: usuario no encontrado');
            return res.status(400).send('Usuario no encontrado');
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            logger.warn('Intento de inicio de sesión fallido: contraseña incorrecta');
            return res.status(400).send('Contraseña incorrecta');
        }

        const accessToken = generateToken(user);
        res.cookie('token', accessToken, {
            httpOnly: true,
            secure: false,
            maxAge: 12 * 60 * 60 * 1000 // Expira en 12 horas
        });
        logger.info('Usuario autenticado, redirigiendo a /products');
        res.status(200).redirect('/products');

    } catch (error) {
        logger.error('Error al iniciar sesión:', error);
        res.status(500).send('Error interno del servidor');
    }
};

export const logout = (req, res) => {
    res.clearCookie('token');
    logger.info('Usuario desconectado');
    res.status(200).redirect('/login');
};

export const renderRegister = (req, res) => {
    const token = req.cookies.token;  // Lee el token desde las cookies

    if (token) {
        jwt.verify(token, PRIVATE_KEY, (err, decodedToken) => {
            if (err) {
                logger.error('Error verificando token en registro:', err);
                return res.render('templates/register');
            }

            const user = decodedToken.user;
            if (user.rol === 'admin') {
                logger.info('Usuario admin autenticado, redirigiendo a /admin/products');
                return res.status(200).redirect('/admin/products');
            } else {
                logger.info('Usuario autenticado, redirigiendo a /products');
                return res.status(200).redirect('/products');
            }
        });
    } else {
        logger.info('No se encontró token, mostrando página de registro');
        res.status(200).render('templates/register');
    }
};

export const register = async (req, res) => {
    const { name, email, password } = req.body;

    try {
        const existingUser = await userModel.findOne({ email });
        if (existingUser) {
            logger.warn('Intento de registro fallido: correo ya en uso');
            return res.status(400).send('El correo ya está en uso.');
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const newUser = new userModel({
            name,
            email,
            password: hashedPassword
        });

        await newUser.save();
        logger.info('Usuario registrado exitosamente:', { userId: newUser._id });
        res.status(200).redirect('/login');
    } catch (error) {
        logger.error('Error al registrar el usuario:', error);
        res.status(500).send('Error interno del servidor');
    }
};

