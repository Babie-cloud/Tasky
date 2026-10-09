// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
	integrations: [
		starlight({
			title: 'Tasky Docs',
			description: 'Documentation officielle du frontend Angular et de l’API REST.',
			defaultLocale: 'root',
			logo: {
				light: './src/assets/logo-light.svg',
				dark: './src/assets/logo-dark.svg',
				replacesTitle: false,
				alt: 'Tasky',
			},
			customCss: ['./src/styles/custom.css'],
			social: [
				{
					icon: 'github',
					label: 'GitHub',
					href: 'https://github.com/Babie-cloud/Tasky',
				},
			],
			head: [
				{
					tag: 'link',
					attrs: {
						rel: 'stylesheet',
						href: 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap',
					},
				},
			],
			sidebar: [
				{
					label: 'Démarrer',
					items: [
						{ label: 'Introduction', slug: 'index' },
						{ label: 'Installation', slug: 'guides/installation' },
						{ label: 'Architecture', slug: 'guides/architecture' },
					],
				},
				{
					label: 'Frontend Angular',
					collapsed: false,
					items: [
						{ label: 'Vue d’ensemble', slug: 'frontend/overview' },
						{ label: 'Services & API client', slug: 'frontend/services' },
						{ label: 'Authentification', slug: 'frontend/auth' },
						{ label: 'Thème clair / sombre', slug: 'frontend/theming' },
					],
				},
				{
					label: 'Backend API',
					collapsed: false,
					items: [
						{ label: 'Vue d’ensemble', slug: 'backend/overview' },
						{ label: 'Authentification JWT', slug: 'backend/auth' },
						{ label: 'Boards, listes & tâches', slug: 'backend/kanban' },
						{ label: 'Rôles & permissions', slug: 'backend/roles' },
						{ label: 'Facturation Stripe', slug: 'backend/billing' },
						{ label: 'Référence OpenAPI (Redoc)', slug: 'backend/api-reference' },
					],
				},
				{
					label: 'Déploiement',
					items: [
						{ label: 'Netlify', slug: 'deployment/netlify' },
						{ label: 'Variables d’environnement', slug: 'deployment/environment' },
					],
				},
			],
		}),
	],
});
