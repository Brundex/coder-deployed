import express from 'express'
import mongoose from 'mongoose'
import MongoStore from 'connect-mongo'
import { engine } from 'express-handlebars'
import cookieParser from 'cookie-parser'
import { __dirname } from './path.js'
import indexRouter from './routes/indexRouter.js'
import { logger, addLogger } from './utils/logger.js'
import swaggerJSDoc from 'swagger-jsdoc'
import swaggerUiExpress from 'swagger-ui-express'

//Configuraciones o declaraciones
const app = express()
const PORT = 8000

app.use(addLogger);

//Connection DB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1); // Termina el proceso si no se puede conectar
  }
};

connectDB();

//API Docs
const swaggerOptions = {
    definition: {
        openapi: '3.1.0',
        info: {
            title: 'Documentacion de eCommerce',
            description: 'Documentación'
        }
    },
    apis: [`${__dirname}/docs/**/*.yaml`]
}

const specs = swaggerJSDoc(swaggerOptions)
//Middlewares

app.use('/apidocs', swaggerUiExpress.serve, swaggerUiExpress.setup(specs))
app.use(express.json())
app.engine('handlebars', engine({
    runtimeOptions: {
        allowProtoPropertiesByDefault: true,
        allowProtoMethodsByDefault: true,
    }
}));
app.set('view engine', 'handlebars')
app.set('views', __dirname + '/views')

app.use(express.urlencoded({ extended: true }));
app.use(cookieParser())
app.use(indexRouter)

//Server
const server = app.listen(PORT, () => {
    console.log(`Server on port ${PORT}`)
})

