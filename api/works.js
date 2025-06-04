// api/works.js
const cloudinary = require('cloudinary').v2;

// Configuration Cloudinary via env vars
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

module.exports = async (req, res) => {
    // Autorise tous les domaines (CORS)
    res.setHeader('Access-Control-Allow-Origin', '*');

    try {
        // Récupère jusqu’à 500 ressources, avec leurs tags
        const all = await cloudinary.api.resources({ max_results: 500, tags: true });
        const worksMap = {};

        all.resources.forEach(r => {
            // Cherche le tag "titre:XXX" dans chaque ressource
            const titreTag = r.tags.find(t => t.startsWith('titre:'));
            if (!titreTag) return;

            const isCover = r.tags.includes('cover');
            // Si pas encore enregistré ou si c'est une cover, on (ré)assigne
            if (!worksMap[titreTag] || isCover) {
                worksMap[titreTag] = {
                    tag: titreTag,                         // ex. "titre:CrownMaster"
                    title: titreTag.replace(/^titre:/, ''),  // ex. "CrownMaster"
                    coverUrl: r.secure_url                      // URL de la cover
                };
            }
        });

        res.status(200).json(Object.values(worksMap));
    } catch (err) {
        console.error('Error in /api/works:', err);
        res.status(500).json({ error: err.message });
    }
};
