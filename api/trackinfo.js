const axios = require('axios');
const cheerio = require('cheerio');

function extractTrackId(url) {
    const pattern = /spotify\.com\/track\/([a-zA-Z0-9]+)/;
    const match = url.match(pattern);
    return match ? match[1] : null;
}

function extractTitleArtistArtwork(html) {
    const titleMatch = html.match(/<p class="rb_title">([^<]+)\s*<span>\(([^)]+)\)<\/span><\/p>/);
    const artworkMatch = html.match(/<img class="rb_icon" src="([^"]+)" alt="[^"]*">/);

    const title = titleMatch ? titleMatch[1].trim() : null;
    const artist = titleMatch ? titleMatch[2].trim() : null;
    const artworkUrl = artworkMatch ? artworkMatch[1].trim() : null;

    return { title, artist, artworkUrl };
}

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    try {
        const { url } = req.body;
        const trackId = extractTrackId(url);

        if (!trackId) {
            return res.status(400).json({
                success: false,
                message: "URL Spotify tidak valid",
                title: null,
                artist: null,
                artworkUrl: null,
                downloadLink: null
            });
        }

        const headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36"
        };

        const response = await axios.post(
            "https://spotifydownloader.pro",
            new URLSearchParams({ url }),
            { headers, timeout: 30000 }
        );

        const { title, artist, artworkUrl } = extractTitleArtistArtwork(response.data);
        const $ = cheerio.load(response.data);
        const downloadLink = $('.rb_btn').attr('href');

        if (!downloadLink) {
            return res.status(404).json({
                success: false,
                message: "Link download tidak ditemukan",
                title,
                artist,
                artworkUrl,
                downloadLink: null
            });
        }

        return res.status(200).json({
            success: true,
            message: "Informasi berhasil diambil",
            title,
            artist,
            artworkUrl,
            downloadLink
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: `Kesalahan: ${error.message}`,
            title: null,
            artist: null,
            artworkUrl: null,
            downloadLink: null
        });
    }
};
