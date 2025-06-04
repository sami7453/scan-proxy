// api/list.js
const cloudinary = require('cloudinary').v2;

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');

    const { title, chap } = req.query;
    if (!title || !chap) {
        return res.status(400).json({ error: 'Missing title or chap parameter' });
    }

    try {
        // Récupère toutes les ressources pour ce titre
        const byTitle = await cloudinary.api.resources_by_tag(title, {
            max_results: 500,
            tags: true
        });

        // Ne garde que celles qui ont le tag "chap"
        const imgs = byTitle.resources
            .filter(r => r.tags.includes(chap))
            .map(r => ({ id: r.public_id, url: r.secure_url }))
            .sort((a, b) => {
                // Tri numérique sur la fin de public_id (ex. "01","02",…)
                const na = parseInt(a.id.split('/').pop(), 10);
                const nb = parseInt(b.id.split('/').pop(), 10);
                return na - nb;
            });

        res.status(200).json(imgs);
    } catch (err) {
        console.error('Error in /api/list:', err);
        res.status(500).json({ error: err.message });
    }
};
