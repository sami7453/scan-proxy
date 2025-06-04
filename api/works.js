// api/works.js
import { V2 as cloudinary } from 'cloudinary';

// Configure Cloudinary à partir des variables d'environnement Vercel
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

export default async function handler(req, res) {
    // Permettre les appels CORS depuis ton front
    res.setHeader('Access-Control-Allow-Origin', '*');

    try {
        // Récupère jusqu’à 500 ressources (avec tags)
        const all = await cloudinary.api.resources({ max_results: 500, tags: true });
        const worksMap = {};

        // Parcours toutes les ressources pour trouver les tags “titre:XXX” et “cover”
        all.resources.forEach(r => {
            // Si l’image a un tag qui commence par “titre:”
            const titreTag = r.tags.find(t => t.startsWith('titre:'));
            if (!titreTag) return;

            // Si c’est une “cover”, on la privilégie. Sinon, on prend la première trouvée.
            const isCover = r.tags.includes('cover');
            if (!worksMap[titreTag] || isCover) {
                worksMap[titreTag] = {
                    tag: titreTag,                      // e.g. "titre:CrownMaster"
                    title: titreTag.replace(/^titre:/, ''),// e.g. "CrownMaster"
                    coverUrl: r.secure_url                   // URL de la cover
                };
            }
        });

        // renvoyer un tableau d’objets { tag, title, coverUrl }
        res.status(200).json(Object.values(worksMap));
    } catch (err) {
        console.error('Error in /api/works:', err);
        res.status(500).json({ error: err.message });
    }
}
