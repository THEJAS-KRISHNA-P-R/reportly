import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://reportly.ai';
  
  const routes = [
    '',
    '/features',
    '/how-it-works',
    '/problem',
    '/pricing',
    '/about',
    '/auth/login'
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '' ? 'weekly' : 'monthly',
    priority: route === '' ? 1.0 : route === '/auth/login' ? 0.5 : 0.8,
  }));
}
