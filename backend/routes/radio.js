const express = require('express');
const router = express.Router();
const db = require('../db');
const jwt = require('jsonwebtoken');

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

function isValidUrl(value){
  try{ const u = new URL(value); return !!(u.protocol && u.host); }catch(_){ return false; }
}

// GET /api/radio - list active stations
router.get('/', async (req,res)=>{
  try{
    const r = await db.query('SELECT id, name, logo_url, stream_url, is_active, created_at FROM radio_stations WHERE is_active = TRUE ORDER BY created_at DESC');
    res.json({ data: r.rows });
  }catch(e){ res.status(500).json({ message:'Server error' }); }
});

// POST /api/radio - create station (admin only)
router.post('/', authenticateJWT, requireAdmin, async (req,res)=>{
  try{
    const { name, logo_url, stream_url, is_active } = req.body;
    if (!name || typeof name !== 'string' || name.trim().length===0) return res.status(400).json({ message:'name required' });
    if (!stream_url || !isValidUrl(stream_url)) return res.status(400).json({ message:'valid stream_url required' });
    if (logo_url && !isValidUrl(logo_url)) return res.status(400).json({ message:'logo_url must be a valid URL' });

    const r = await db.query('INSERT INTO radio_stations (name, logo_url, stream_url, is_active) VALUES ($1,$2,$3,$4) RETURNING id, name, logo_url, stream_url, is_active, created_at', [name.trim(), logo_url||null, stream_url, is_active!==undefined? !!is_active : true]);
    res.status(201).json({ data: r.rows[0] });
  }catch(e){ res.status(500).json({ message:'Server error', error: e.message }); }
});

// DELETE /api/radio/:id - soft delete (set is_active=false)
router.delete('/:id', authenticateJWT, requireAdmin, async (req,res)=>{
  try{
    const r = await db.query('UPDATE radio_stations SET is_active = FALSE WHERE id=$1 AND is_active = TRUE RETURNING id',[req.params.id]);
    if (r.rowCount===0) return res.status(404).json({ message:'Station not found' });
    res.json({ ok: true });
  }catch(e){ res.status(500).json({ message:'Server error' }); }
});

module.exports = router;
