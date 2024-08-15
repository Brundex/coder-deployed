import cartModel  from "../models/cart.js";
import productModel from "../models/product.js";
import { sendEmail } from "../utils/nodemailer.js";
import { PRIVATE_KEY } from "../utils/jwt.js";
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'
import { logger } from "../utils/logger.js";

export const addProductCart = async (req, res) => {
    try {
        const { productId, quantity } = req.body;
        const token = req.cookies.token;
        const decodedToken = jwt.verify(token, PRIVATE_KEY);
        const email = decodedToken.user.email;

        let cart = await cartModel.findOne({ user: email });

        // Si el carrito no existe, crearlo
        if (!cart) {
            cart = new cartModel({ user: email, products: [] });
        }

        // Verificar que productId no esté vacío y sea un ObjectId válido
        if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).send('Invalid productId');
        }

        const product = await productModel.findById(productId);

        // Verificar que el producto exista
        if (!product) {
            return res.status(404).send('Product not found');
        }
        

        if (product.stock < quantity) {
            return res.status(400).send("No hay suficiente stock disponible");
        }

        // Buscar si el producto ya está en el carrito
        const existingProduct = cart.products.find(p => p.id_prod._id.toString() === productId);

        if (existingProduct) {
            existingProduct.quantity += parseInt(quantity, 10);
        } else {
            cart.products.push({ id_prod: productId, quantity: parseInt(quantity, 10) });
        }
        product.stock -= parseInt(quantity);
        await product.save();
        await cart.save();
        logger.info('Producto agregado al carrito existente:', { userId: req.user.user._id, productId: product._id });
        res.status(200).redirect('/products');
    } catch (error) {
        logger.error('Error al agregar producto al carrito:', error);
        res.status(500).send('Error interno del servidor');
    }
};

export const updateCart = async (req, res) => {
    try {
        const { cid, pid } = req.params;
        const { action } = req.body;

        const cart = await cartModel.findById(cid).populate('products.id_prod');

        if (!cart) {
            logger.warning(`Carrito no encontrado: ${cid}`);
            return res.status(404).send('Carrito no encontrado');
        }

        const product = cart.products.find(p => p.id_prod._id.toString() === pid);

        if (!product) {
            logger.warning(`Producto no encontrado en el carrito: ${pid}`);
            return res.status(404).send('Producto no encontrado en el carrito');
        }

        if (action === 'increment') {
            if (product.id_prod.stock > 0) {
                product.quantity += 1;
                product.id_prod.stock -= 1;
                logger.info(`Cantidad incrementada para producto: ${pid}`);
            } else {
                logger.warning(`No hay suficiente stock para el producto: ${pid}`);
                return res.status(400).send('No hay suficiente stock');
            }
        } else if (action === 'decrement') {
            product.quantity -= 1;
            product.id_prod.stock += 1;
            logger.info(`Cantidad decrementada para producto: ${pid}`);

            if (product.quantity <= 0) {
                cart.products = cart.products.filter(p => p.id_prod._id.toString() !== pid);
                logger.info(`Producto eliminado del carrito: ${pid}`);
            }
        }

        await cart.save();
        await product.id_prod.save();

        logger.info(`Carrito actualizado: ${cid}`);
        res.status(200).redirect('/cart');
    } catch (error) {
        logger.error('Error al actualizar el carrito:', error);
        res.status(500).send('Error interno del servidor');
    }
};

export const getCart = async (req, res) => {
    try {
        const token = req.cookies.token;
        const decodedToken = jwt.verify(token, PRIVATE_KEY);
        const email = decodedToken.user.email;

        let cart = await cartModel.findOne({ user: email }).populate('products.id_prod').lean();

        if (!cart) {
            logger.info(`Carrito vacío para el usuario: ${email}`);
            return res.status(200).render('templates/cart', { cart: { products: [], total: 0 } });
        }

        const total = cart.products.reduce((acc, item) => acc + item.id_prod.price * item.quantity, 0);
        cart.total = total;

        logger.info(`Carrito renderizado para el usuario: ${email}`);
        res.status(200).render('templates/cart', { cart });
    } catch (error) {
        logger.error('Error al obtener el carrito:', error);
        res.status(500).send('Error interno del servidor');
    }
};

export const checkout = async (req, res) => {
    try {
        const { cid } = req.params;
        const cart = await cartModel.findById(cid).populate('products.id_prod');

        if (!cart || cart.products.length === 0) {
            logger.warning(`Checkout fallido: carrito vacío o no encontrado (${cid})`);
            return res.status(400).send("No hay productos en el carrito o el carrito no existe.");
        }

        const token = req.cookies.token;
        const decodedToken = jwt.verify(token, PRIVATE_KEY);

        const purchaseTime = new Date().toLocaleString();
        
        const productList = cart.products.map(p => `${p.quantity} x ${p.id_prod.title}`).join('\n');
        const totalAmount = cart.products.reduce((acc, prod) => acc + (prod.quantity * prod.id_prod.price), 0);

        const email = decodedToken.user.email;
        const subject = 'Confirmación de tu compra';
        const text = `Gracias por tu compra!\n\nHas comprado:\n\n${productList}\n\nTotal: $${totalAmount}\n\nFecha y hora de compra: ${purchaseTime}`;

        await sendEmail(email, subject, text);

        await cartModel.findByIdAndDelete(cid);
        const newCart = new cartModel({ user: decodedToken.user._id, products: [] });
        await newCart.save();

        logger.info(`Checkout completado para el usuario: ${email}, carrito eliminado (${cid})`);
        res.status(200).render('templates/checkout', { products: productList, purchaseTime, totalAmount });
    } catch (error) {
        logger.error('Error en el checkout:', error);
        res.status(500).send('Error interno del servidor');
    }
};