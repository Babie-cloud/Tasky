const swaggerJsdoc = require('swagger-jsdoc');

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Tasky API',
    version: '1.0.0',
    description:
      "Documentation officielle de l'API REST Tasky — gestion de tableaux Kanban, tâches, catégories et facturation.",
    contact: { name: 'Équipe Tasky', url: 'https://github.com/Babie-cloud/Tasky' },
  },
  servers: [
    { url: 'http://localhost:3000', description: 'Développement local' },
    {
      url: 'https://peppy-sunburst-59adb5.netlify.app',
      description: 'Production (Netlify Functions)',
    },
  ],
  tags: [
    { name: 'Auth', description: 'Inscription, connexion, OAuth, mot de passe' },
    { name: 'Users', description: 'Profil utilisateur' },
    { name: 'Boards', description: 'Tableaux Kanban et membres' },
    { name: 'Lists', description: 'Colonnes de statut (À faire, En cours…)' },
    { name: 'Tasks', description: 'Tâches et déplacement Kanban' },
    { name: 'Categories', description: 'Catégories / labels de travail' },
    { name: 'Billing', description: 'Abonnements Stripe' },
    { name: 'Health', description: 'État du service' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Token JWT obtenu via `/api/auth/login` ou `/api/auth/register`.',
      },
    },
  },
};

const swaggerOptions = {
  definition: swaggerDefinition,
  apis: ['./routes/*.js', './components/*.js'],
};

function buildSwaggerSpec() {
  return swaggerJsdoc(swaggerOptions);
}

module.exports = { swaggerDefinition, swaggerOptions, buildSwaggerSpec };
