require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { v2: cloudinary } = require('cloudinary');

const app = express();
app.use(cors());

// Configuration depuis .env
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// 1) GET /api/works → liste des œuvres (tag titre:XXX + tag cover)
app.get('/api/works', async (req, res) => {
    try {
        // Récupère toutes les ressources (max 500) avec leurs tags
        const all = await cloudinary.api.resources({ max_results: 500, tags: true });
        const worksMap = {};

        all.resources.forEach(r => {
            // Si l'image porte un tag titre:XXX
            const titreTag = r.tags.find(t => t.startsWith('titre:'));
            if (!titreTag) return;

            // Si c'est une cover, on l'utilise ou on l'écrase
            const isCover = r.tags.includes('cover');
            if (!worksMap[titreTag] || isCover) {
                worksMap[titreTag] = {
                    tag: titreTag,                      // ex: "titre:CrownMaster"
                    title: titreTag.replace(/^titre:/, ''),// ex: "CrownMaster"
                    coverUrl: r.secure_url                   // url de la cover (ou d'une ressource par défaut)
                };
            }
        });

        res.json(Object.values(worksMap));
    } catch (err) {
        console.error('Error in /api/works:', err);
        res.status(500).json({ error: err.message });
    }
});

// 2) GET /api/tags?title=titre:XXX → liste des chapitres (chap1, chap2…) pour cette œuvre
app.get('/api/tags', async (req, res) => {
    try {
        const { title } = req.query;
        if (!title) return res.status(400).json({ error: 'Missing title parameter' });

        // Récupère toutes les ressources taguées title
        const byTitle = await cloudinary.api.resources_by_tag(title, { max_results: 500, tags: true });
        const chapSet = new Set();

        byTitle.resources.forEach(r => {
            r.tags.forEach(t => {
                if (t.startsWith('chap')) chapSet.add(t);
            });
        });

        // Trie numérique (chap1, chap2…)
        const chapList = Array.from(chapSet).sort((a, b) => {
            const na = parseInt(a.replace(/^chap/, ''), 10);
            const nb = parseInt(b.replace(/^chap/, ''), 10);
            return na - nb;
        });

        res.json(chapList);
    } catch (err) {
        console.error('Error in /api/tags:', err);
        res.status(500).json({ error: err.message });
    }
});

// 3) GET /api/list?title=titre:XXX&chap=chapY → images pour titre+chap, triées
app.get('/api/list', async (req, res) => {
    try {
        const { title, chap } = req.query;
        if (!title || !chap) return res.status(400).json({ error: 'Missing title or chap parameter' });

        // Récupère toutes les ressources pour la title
        const byTitle = await cloudinary.api.resources_by_tag(title, { max_results: 500, tags: true });

        // Filtre celles qui ont le chap demandé
        const imgs = byTitle.resources
            .filter(r => r.tags.includes(chap))
            .map(r => ({ id: r.public_id, url: r.secure_url }))
            // Trie numérique sur la fin de public_id (01,02…)
            .sort((a, b) => {
                const na = parseInt(a.id.split('/').pop(), 10);
                const nb = parseInt(b.id.split('/').pop(), 10);
                return na - nb;
            });

        res.json(imgs);
    } catch (err) {
        console.error('Error in /api/list:', err);
        res.status(500).json({ error: err.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server listening on http://localhost:${PORT}`));
