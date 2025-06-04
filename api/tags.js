// api/tags.js
import { V2 as cloudinary } from 'cloudinary';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');

    const { title } = req.query;  // exemple : "titre:CrownMaster"
    if (!title) {
        return res.status(400).json({ error: 'Missing title parameter' });
    }

    try {
        // Récupère toutes les ressources qui ont le tag “title”
        const byTitle = await cloudinary.api.resources_by_tag(title, {
            max_results: 500,
            tags: true
        });

        // Extraire tous les tags “chapX” de ces ressources
        const chapSet = new Set();
        byTitle.resources.forEach(r => {
            r.tags.forEach(t => {
                if (t.startsWith('chap')) chapSet.add(t);
            });
        });

        // Convertir en tableau trié numériquement (“chap1”, “chap2”, …)
        const chapList = Array.from(chapSet).sort((a, b) => {
            const na = parseInt(a.replace(/^chap/, ''), 10);
            const nb = parseInt(b.replace(/^chap/, ''), 10);
            return na - nb;
        });

        res.status(200).json(chapList);
    } catch (err) {
        console.error('Error in /api/tags:', err);
        res.status(500).json({ error: err.message });
    }
}
