// api/tags.js
const cloudinary = require('cloudinary').v2;

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');

    const { title } = req.query; // ex. "titre:CrownMaster"
    if (!title) {
        return res.status(400).json({ error: 'Missing title parameter' });
    }

    try {
        // Récupère toutes les ressources portant ce tag "title"
        const byTitle = await cloudinary.api.resources_by_tag(title, {
            max_results: 500,
            tags: true
        });

        // Extrait tous les chap-tags (qui commencent par "chap")
        const chapSet = new Set();
        byTitle.resources.forEach(r => {
            r.tags.forEach(t => {
                if (t.startsWith('chap')) chapSet.add(t);
            });
        });

        // Trie numérique ("chap1","chap2",…)
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
};
