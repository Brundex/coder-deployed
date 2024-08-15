import productModel from '../models/product.js'
import { logger } from "../utils/logger.js";

export const getProducts = async (req, res) => {
    try {
        //Para hacer un filtro en la vista en el futuro
        const { limit, page, filter, ord } = req.query;
        let metFilter;
        const pag = page !== undefined ? page : 1;
        const limi = limit !== undefined ? limit : 10;

        if (filter == "true" || filter == "false") {
            metFilter = "status";
        } else {
            if (filter !== undefined)
                metFilter = "category";
        }

        const query = metFilter != undefined ? { [metFilter]: filter } : {};
        const ordQuery = ord !== undefined ? { price: ord } : {};

        const prods = await productModel.paginate(query, { limit: limi, page: pag, sort: ordQuery });
        logger.info('Productos obtenidos para el usuario', { userId: req.user.user._id });
        res.status(200).render('templates/products', { products: prods.docs });

    } catch (error) {
        logger.error('Error obteniendo productos:', error);
        res.status(500).render('error', {
            error: error,
        });
    }
};
