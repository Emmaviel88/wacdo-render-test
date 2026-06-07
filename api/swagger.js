const swaggerUi = require('swagger-ui-express');
const swaggerJsDoc = require('swagger-jsdoc');
const path = require('path');

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "API de gestion d'un Fast-food",
      version: "1.0.1",
      description: "Documentation de l'API permettant de gérer les employés, les produits et les commandes"
    },

    servers: [
      {
        url: "http://localhost:5000",
        description: "Development"
      },
      {
        url: "https://wacdo-render-test.onrender.com",
        description: "Production"
      },
      {
        url: "https://wacdo-lovat.vercel.app",
        description: "Production"
      },
    ],

    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },

    security: [
      {
        bearerAuth: []
      }
    ]
  },

  apis: [path.join(__dirname, 'routes', '*.js')]
};

const swaggerSpec = swaggerJsDoc(options);

const setupSwagger = (app) => {

  app.get('/swagger.json', (req, res) => {
    res.json(swaggerSpec);
  });

  // app.use(
  //   '/api-docs',
  //   swaggerUi.serveFiles(swaggerSpec),
  //   swaggerUi.setup(swaggerSpec)
  // );
  //   app.use(
  //   '/api-docs',
  //   swaggerUi.serve,
  //   swaggerUi.setup(swaggerSpec)
  // );
  app.use(
    '/api-docs',
    swaggerUi.serveFiles(swaggerSpec),
    swaggerUi.setup(swaggerSpec)
  );
};

module.exports = setupSwagger;