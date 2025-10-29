const express = require('express');
const router = express.Router();
const db = require('../db');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const { r2Client } = require('../config/cloudflare-r2');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { GetObjectCommand, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');

// Auth helpers
function authenticateJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) return res.sendStatus(403);
      req.user = user; next();
    });
  } else { res.sendStatus(401); }
}
async function requireAdmin(req, res, next) {
  if (req.user && req.user.id) {
    try {
      const result = await db.query('SELECT is_admin FROM users WHERE id = $1', [req.user.id]);
      if (result.rows.length > 0 && result.rows[0].is_admin) return next();
      return res.status(403).json({ message: 'Admin access required' });
    } catch (e) { return res.status(500).json({ message: 'Server error' }); }
  } else { return res.status(401).json({ message: 'Unauthorized' }); }
}

// Upload config
const memoryStorage = multer.memoryStorage();
const audioUpload = multer({
  storage: memoryStorage,
  limits: { fileSize: 200 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['audio/mpeg','audio/mp4','audio/aac','audio/ogg','audio/webm','audio/wav','audio/x-wav'];
    if (allowed.includes(file.mimetype)) cb(null, true); else cb(new Error('Invalid audio type'));
  }
});
const imageUpload = multer({
  storage: memoryStorage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null,true); else cb(new Error('Invalid image type'));
  }
});

// R2 helpers
async function r2Put(file, key){
  await r2Client.send(new PutObjectCommand({
    Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
    ACL: 'public-read'
  }));
  return `${process.env.CLOUDFLARE_R2_PUBLIC_URL}/${key}`;
}
async function r2Signed(key, ttl=3600){
  return await getSignedUrl(r2Client, new GetObjectCommand({ Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME, Key: key }), { expiresIn: ttl });
}

// SQL helpers
const Q = {
  listArtists: 'SELECT id, name, slug, image_url, created_at FROM artists ORDER BY created_at DESC LIMIT $1 OFFSET $2',
  getArtist: 'SELECT id, name, slug, image_url, created_at FROM artists WHERE id = $1',
  artistPlaylists: 'SELECT id, name, description FROM playlists WHERE artist_id = $1 ORDER BY created_at DESC',
  getPlaylist: 'SELECT id, artist_id, name, description FROM playlists WHERE id = $1',
  playlistTracks: `SELECT t.id, t.title, t.duration_seconds, t.mime_type, t.file_path, t.release_date
                   FROM playlist_tracks pt JOIN tracks t ON pt.track_id = t.id WHERE pt.playlist_id = $1 ORDER BY pt.position ASC, pt.created_at ASC`,
};

// Public endpoints
router.get('/artists', async (req,res)=>{
  try{
    const limit = Math.min(parseInt(req.query.limit||'20'),50);
    const offset = Math.max(parseInt(req.query.offset||'0'),0);
    const r = await db.query(Q.listArtists,[limit,offset]);
    res.json({ data: r.rows, paging: { limit, offset }});
  }catch(e){ res.status(500).json({ message:'Server error' }); }
});
router.get('/artists/:id', async (req,res)=>{
  try{
    const a = await db.query(Q.getArtist,[req.params.id]);
    if(a.rows.length===0) return res.status(404).json({message:'Artist not found'});
    const p = await db.query(Q.artistPlaylists,[req.params.id]);
    res.json({ data: a.rows[0], playlists: p.rows });
  }catch(e){ res.status(500).json({ message:'Server error' }); }
});
router.get('/playlists/:id', async (req,res)=>{
  try{
    const pl = await db.query(Q.getPlaylist,[req.params.id]);
    if(pl.rows.length===0) return res.status(404).json({message:'Playlist not found'});
    const t = await db.query(Q.playlistTracks,[req.params.id]);
    // attach signed urls
    const items = await Promise.all(t.rows.map(async row=>{
      const key = row.file_path; // stored key without bucket prefix
      const url = await r2Signed(key, 3600);
      return { ...row, stream_url: url };
    }));
    res.json({ data: pl.rows[0], tracks: items });
  }catch(e){ res.status(500).json({ message:'Server error' }); }
});
router.get('/tracks/:id', async (req,res)=>{
  try{
    const t = await db.query('SELECT id, artist_id, title, duration_seconds, file_path, mime_type, size_bytes, release_date FROM tracks WHERE id=$1',[req.params.id]);
    if (t.rows.length===0) return res.status(404).json({message:'Track not found'});
    const key = t.rows[0].file_path; const url = await r2Signed(key, 3600);
    res.json({ data: { ...t.rows[0], stream_url: url } });
  }catch(e){ res.status(500).json({ message:'Server error' }); }
});

// Admin endpoints
router.post('/artists', authenticateJWT, requireAdmin, (req,res)=>{
  imageUpload.single('image')(req,res, async(err)=>{
    try{
      if (err) return res.status(400).json({ message: err.message });
      const { name, slug } = req.body;
      let imageUrl = req.body.image_url;
      if (req.file){
        const key = `music/artists/${Date.now()}_${req.file.originalname}`;
        imageUrl = await r2Put(req.file, key);
      }
      const r = await db.query('INSERT INTO artists (name, slug, image_url) VALUES ($1,$2,$3) RETURNING *',[name, slug, imageUrl]);
      res.status(201).json({ data: r.rows[0] });
    }catch(e){ res.status(500).json({ message:'Server error' }); }
  });
});
router.post('/artists/:id/playlists', authenticateJWT, requireAdmin, async (req,res)=>{
  try{
    const { name, description } = req.body;
    const r = await db.query('INSERT INTO playlists (artist_id, name, description) VALUES ($1,$2,$3) RETURNING *',[req.params.id, name, description]);
    res.status(201).json({ data: r.rows[0] });
  }catch(e){ res.status(500).json({ message:'Server error' }); }
});
router.post('/artists/:id/tracks', authenticateJWT, requireAdmin, (req,res)=>{
  audioUpload.array('tracks')(req,res, async(err)=>{
    try{
      if (err) return res.status(400).json({ message: err.message });
      const { titles, durations, releaseDates, playlistId, createPlaylistName, explicit } = req.body;
      const files = req.files || [];
      // ensure playlist
      let pid = playlistId;
      if (!pid && createPlaylistName){
        const pr = await db.query('INSERT INTO playlists (artist_id, name) VALUES ($1,$2) RETURNING id',[req.params.id, createPlaylistName]);
        pid = pr.rows[0].id;
      }
      const results = [];
      for (let i=0;i<files.length;i++){
        const f = files[i];
        const key = `music/tracks/${req.params.id}/${Date.now()}_${i}_${f.originalname}`;
        await r2Put(f, key);
        const title = Array.isArray(titles)? titles[i] : (titles||f.originalname);
        const dur = Array.isArray(durations)? parseInt(durations[i]||'0'): parseInt(durations||'0');
        const r = await db.query(`INSERT INTO tracks (artist_id, title, duration_seconds, file_url, file_path, mime_type, size_bytes, release_date, created_by)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
          [req.params.id, title, dur, `${process.env.CLOUDFLARE_R2_PUBLIC_URL}/${key}`, key, f.mimetype, f.size, releaseDates||null, req.user.id]);
        const track = r.rows[0];
        if (pid){
          await db.query('INSERT INTO playlist_tracks (playlist_id, track_id, position) VALUES ($1,$2,$3)',[pid, track.id, i+1]);
        }
        results.push(track);
      }
      res.status(201).json({ data: results, playlist_id: pid });
    }catch(e){ res.status(500).json({ message:'Server error' }); }
  });
});
router.put('/playlists/:id/add-track', authenticateJWT, requireAdmin, async (req,res)=>{
  try{
    const { track_id, position } = req.body;
    await db.query('INSERT INTO playlist_tracks (playlist_id, track_id, position) VALUES ($1,$2,$3)',[req.params.id, track_id, position||0]);
    res.json({ ok: true });
  }catch(e){ res.status(500).json({ message:'Server error' }); }
});
router.delete('/tracks/:id', authenticateJWT, requireAdmin, async (req,res)=>{
  try{
    // soft delete: mark file_url null and remove from R2
    const t = await db.query('SELECT file_path FROM tracks WHERE id=$1',[req.params.id]);
    if (t.rows.length===0) return res.status(404).json({message:'Track not found'});
    const key = t.rows[0].file_path;
    try{ await r2Client.send(new DeleteObjectCommand({ Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME, Key: key })); }catch(_){ }
    await db.query('UPDATE tracks SET file_url = NULL WHERE id=$1',[req.params.id]);
    res.json({ ok: true });
  }catch(e){ res.status(500).json({ message:'Server error' }); }
});

module.exports = router;