const express = require('express');
const router = express.Router();
const db = require('../db');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const { r2Client } = require('../config/cloudflare-r2');
const ORACLE_WRITE_BASE = process.env.ORACLE_MUSIC_WRITE_BASE_URL || process.env.ORACLE_MUSIC_BASE_URL; // write PAR base
const ORACLE_READ_BASE = process.env.ORACLE_MUSIC_READ_BASE_URL || process.env.ORACLE_MUSIC_BASE_URL;  // read PAR base (or public URL)
const ORACLE_PREFIX = process.env.ORACLE_MUSIC_PREFIX || 'music/'; // enforced upload prefix
// Note: We use Oracle Pre-Authenticated Requests (PAR) so the frontend can PUT directly to Object Storage.
// The backend constructs keys under a controlled prefix and returns a scoped URL; backend never proxies the file bytes.
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { GetObjectCommand, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const https = require('https');
const { URL } = require('url');

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

// Utility
function _slugify(s){
  return (s||'').toString().toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');
}
function _safeFile(name){
  return (name||'').toString().replace(/[^a-zA-Z0-9_.-]+/g,'_');
}
function _parseOracleBase(baseUrl){
  try{
    const u = new URL(baseUrl);
    const parts = u.pathname.split('/').filter(Boolean);
    // expect: ['p','<token>','n','<ns>','b','<bucket>','o']
    const nIdx = parts.indexOf('n'); const bIdx = parts.indexOf('b');
    const ns = nIdx>=0? parts[nIdx+1] : undefined;
    const bucket = bIdx>=0? parts[bIdx+1] : undefined;
    const endsWithO = parts[parts.length-1]==='o';
    return { host: u.host, ns, bucket, endsWithO };
  }catch(_){ return {}; }
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
      const key = row.file_path;
      // If Oracle base configured, stream directly from Oracle PAR base
const url = ORACLE_READ_BASE ? `${ORACLE_READ_BASE}${key}` : await r2Signed(key, 3600);
      return { ...row, stream_url: url };
    }));
    res.json({ data: pl.rows[0], tracks: items });
  }catch(e){ res.status(500).json({ message:'Server error' }); }
});
router.get('/tracks/:id', async (req,res)=>{
  try{
    const t = await db.query('SELECT id, artist_id, title, duration_seconds, file_path, mime_type, size_bytes, release_date FROM tracks WHERE id=$1',[req.params.id]);
    if (t.rows.length===0) return res.status(404).json({message:'Track not found'});
    const key = t.rows[0].file_path; 
const url = ORACLE_READ_BASE ? `${ORACLE_READ_BASE}${key}` : await r2Signed(key, 3600);
    res.json({ data: { ...t.rows[0], stream_url: url } });
  }catch(e){ res.status(500).json({ message:'Server error' }); }
});

// Admin endpoints
// Generate Oracle pre-authenticated upload URL (frontend will PUT directly)
router.post('/oracle/presign', authenticateJWT, requireAdmin, async (req,res)=>{
  try{
    if (!ORACLE_WRITE_BASE) return res.status(500).json({ message:'ORACLE_MUSIC_WRITE_BASE_URL not configured' });
    const { type, artistId, artistSlug, filename } = req.body;
    if (!filename) return res.status(400).json({ message:'filename required' });
    const slug = _slugify(artistSlug || artistId || 'artist');
    const safe = _safeFile(filename);
    // Constrain uploads to music/<artist>/ paths only
    let key;
if (type === 'artist_image') {
      key = `${ORACLE_PREFIX}${slug}/artist_${Date.now()}.jpg`;
    } else {
      key = `${ORACLE_PREFIX}${slug}/tracks/${Date.now()}_${safe}`;
    }
    const upload_url = `${ORACLE_WRITE_BASE}${key}`; // PAR base permits PUT
    const public_url = ORACLE_READ_BASE ? `${ORACLE_READ_BASE}${key}` : null;
res.json({ upload_url, public_url, file_path: key, enforced_prefix: `${ORACLE_PREFIX}${slug}/` });
  }catch(e){ res.status(500).json({ message:'Server error', error: e.message }); }
});

// Diagnostics: attempt a small PUT to Oracle and report status/headers
router.post('/oracle/diagnostics', authenticateJWT, requireAdmin, async (req,res)=>{
  try{
    if (!ORACLE_WRITE_BASE) return res.status(500).json({ message:'ORACLE_MUSIC_WRITE_BASE_URL not configured' });
const key = `${ORACLE_PREFIX}diagnostics/ping_${Date.now()}.txt`;
    const urlStr = `${ORACLE_WRITE_BASE}${key}`;
    const parsed = _parseOracleBase(ORACLE_WRITE_BASE||'');
    const u = new URL(urlStr);
    const body = 'ping';

    const putResult = await new Promise((resolve)=>{
      const reqOpt = { method: 'PUT', hostname: u.hostname, path: u.pathname + u.search, headers: { 'Content-Type':'text/plain', 'Content-Length': Buffer.byteLength(body) } };
      const r = https.request(reqOpt, (resp)=>{
        let data=''; resp.on('data',d=> data+=d); resp.on('end', ()=> resolve({ status: resp.statusCode, headers: resp.headers, body: data }));
      });
      r.on('error', (e)=> resolve({ error: e.message }));
      r.write(body); r.end();
    });

    let diagnosis = 'unknown';
    if (putResult.error) diagnosis = `network_error: ${putResult.error}`;
    else if (putResult.status>=200 && putResult.status<300) diagnosis = 'ok';
    else if (putResult.status===403) diagnosis = 'forbidden (PAR expired or invalid)';
    else if (putResult.status===405) diagnosis = 'method_not_allowed (PAR lacks write permissions)';
    else if (putResult.status===400) diagnosis = 'bad_request (URL or headers)';

    return res.json({
      key,
      upload_url: urlStr,
      parsed_base: parsed,
      result: putResult,
      diagnosis
    });
  }catch(e){
    res.status(500).json({ message:'diagnostic_error', error: e.message });
  }
});

// Create artist metadata (image already uploaded by frontend via Oracle PAR and passed as image_path)
router.post('/artists', authenticateJWT, requireAdmin, async (req,res)=>{
  try{
    // Accept JSON body: { name, slug, image_path? }
    const { name, slug, image_path } = req.body;
    let imageUrl = null;
    if (image_path) {
      imageUrl = ORACLE_READ_BASE ? `${ORACLE_READ_BASE}${image_path}` : image_path;
    }
    const r = await db.query('INSERT INTO artists (name, slug, image_url) VALUES ($1,$2,$3) RETURNING *',[name, slug, imageUrl]);
    res.status(201).json({ data: r.rows[0] });
  }catch(e){ res.status(400).json({ message: e.message || 'invalid image type' }); }
});
router.post('/artists/:id/playlists', authenticateJWT, requireAdmin, async (req,res)=>{
  try{
    const { name, description } = req.body;
    const r = await db.query('INSERT INTO playlists (artist_id, name, description) VALUES ($1,$2,$3) RETURNING *',[req.params.id, name, description]);
    res.status(201).json({ data: r.rows[0] });
  }catch(e){ res.status(500).json({ message:'Server error' }); }
});
// Metadata finalize endpoint for direct Oracle uploads
router.post('/artists/:id/tracks-meta', authenticateJWT, requireAdmin, async (req,res)=>{
  try{
    let { tracks, playlistId, createPlaylistName } = req.body;
    if (!Array.isArray(tracks) || tracks.length===0) return res.status(400).json({ message:'tracks required' });
    // ensure playlist if requested
    if (!playlistId && createPlaylistName){
      const pr = await db.query('INSERT INTO playlists (artist_id, name) VALUES ($1,$2) RETURNING id',[req.params.id, createPlaylistName]);
      playlistId = pr.rows[0].id;
    }
    const out = [];
    for (let i=0;i<tracks.length;i++){
      const t = tracks[i];
      const r = await db.query(`INSERT INTO tracks (artist_id, title, duration_seconds, file_url, file_path, mime_type, size_bytes, release_date, created_by)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
        [req.params.id, t.title, t.duration_seconds||0, ORACLE_READ_BASE? `${ORACLE_READ_BASE}${t.file_path}` : t.file_url, t.file_path, t.mime_type, t.size_bytes||0, t.release_date||null, req.user.id]);
      const track = r.rows[0];
      if (playlistId){
        await db.query('INSERT INTO playlist_tracks (playlist_id, track_id, position) VALUES ($1,$2,$3)',[playlistId, track.id, i+1]);
      }
      out.push(track);
    }
    res.status(201).json({ data: out, playlist_id: playlistId });
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