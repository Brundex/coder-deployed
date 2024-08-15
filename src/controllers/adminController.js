import { userModel } from '../models/user.js';
import productModel  from '../models/product.js'
import { logger } from '../utils/logger.js';
import { sendEmail } from '../utils/nodemailer.js';
import mongoose from 'mongoose'

export const getUsers = async (req, res) => {
    try {
        const users = await userModel.find();
        logger.info('Usuarios obtenidos para la administración');
        res.status(200).render('templates/admin', { users }); 
    } catch (error) {
        logger.error('Error al obtener usuarios:', error);
        res.status(500).send('Error interno del servidor');
    }
};

export const getProducts = async (req, res) => {
    try {
        const products = await productModel.find();
        logger.info('Productos obtenidos para la administración');
        res.status(200).render('templates/productsAdmin', { products });
    } catch (error) {
        logger.error('Error al obtener los productos:', error);
        res.status(500).send('Error interno del servidor');
    }
};


export const addNewProduct = async (req, res) => {
    try {
        const { title, description, stock, category, code, price } = req.body;

        const existingProduct = await productModel.findOne({ code });
        if (existingProduct) {
            logger.warning(`Intento de agregar producto con código duplicado: ${code}`);
            return res.status(400).send('Ya existe un producto con este código');
        }
        const newProduct = new productModel({
            title,
            description,
            stock,
            category,
            code,
            price
        });

        await newProduct.save();
        logger.info(`Producto agregado: ${newProduct._id} (${title})`);
        res.status(200).redirect('/admin/products');
    } catch (error) {
        logger.error('Error al agregar el producto:', error);
        res.status(500).send('Error interno del servidor');
    }
};


export const updateStock = async (req, res) => {
    try {
        const { productId, stock } = req.body;

        await productModel.findByIdAndUpdate(productId, { stock });
        logger.info(`Stock actualizado para el producto: ${productId}`);
        res.status(200).redirect('/admin/products');
    } catch (error) {
        logger.error('Error al actualizar el stock:', error);
        res.status(500).send('Error interno del servidor');
    }
};

export const deleteUser = async (req, res) => {
    const { id } = req.params;

    try {
        if (!mongoose.Types.ObjectId.isValid(id)) {
            logger.warn(`ID de usuario no válido: ${id}`);
            return res.status(400).send('ID de usuario no válido');
        }
        const result = await userModel.deleteOne({ _id: id });

        if (result.deletedCount === 0) {
            logger.warn(`Usuario no encontrado: ${id}`);
            return res.status(404).send('Usuario no encontrado');
        }

        logger.info(`Usuario eliminado: ${id}`);
        res.status(200).redirect('/admin/users');
    } catch (error) {
        logger.error('Error al eliminar usuario:', error);
        res.status(500).send('Error interno del servidor');
    }
};

export const autodelete = async (req, res) => {
    try {
        const twoDaysAgo = new Date();
        twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

        // Buscar usuarios que no han tenido conexión en los últimos 2 días
        const inactiveUsers = await userModel.find({ lastLogin: { $lt: twoDaysAgo } });

        // Eliminar usuarios inactivos
        const result = await userModel.deleteMany({ lastLogin: { $lt: twoDaysAgo } });

        // Enviar correos a los usuarios eliminados
        for (const user of inactiveUsers) {
            const subject = 'Cuenta Eliminada por Inactividad';
            const text = 'Estimado usuario, su cuenta ha sido eliminada debido a la inactividad en los últimos 2 días.';
            
            try {
                await sendEmail(user.email, subject, text);
                logger.info(`Correo enviado a ${user.email}`);
            } catch (error) {
                logger.error(`Error al enviar correo a ${user.email}: ${error}`);
            }
        }

        logger.info('Usuarios inactivos eliminados con éxito');
        res.status(200).send(`Se han eliminado ${result.deletedCount} usuarios inactivos.`);
    } catch (error) {
        logger.error(`Error al eliminar usuarios inactivos: ${error}`);
        res.status(500).send('Error interno del servidor al eliminar usuarios inactivos');
    }
};



