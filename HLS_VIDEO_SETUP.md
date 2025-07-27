# HLS Video Player Setup Guide

## 🎬 Professional YouTube-like Video Player with HLS Support

This guide covers setting up a professional video player with HLS (HTTP Live Streaming) support, adaptive bitrate streaming, and responsive design.

## 📦 Dependencies Installed

```bash
npm install videojs-contrib-hls videojs-contrib-quality-levels videojs-http-source-selector
```

## 🚀 Features Implemented

### ✅ Core Features
- **Responsive 16:9 aspect ratio** - Maintains perfect proportions across all devices
- **HLS (.m3u8) support** - Adaptive bitrate streaming like YouTube
- **Quality selection** - Automatic and manual quality switching
- **Professional controls** - Play/pause, volume, time, fullscreen, playback rate
- **Buffering optimization** - Efficient preloading and buffering
- **Mobile responsive** - Optimized for all screen sizes

### ✅ Advanced Features
- **Adaptive streaming** - Automatically switches quality based on bandwidth
- **Quality levels** - Support for multiple resolutions (1080p, 720p, 480p, etc.)
- **Custom styling** - YouTube-like appearance with red accent colors
- **Event handling** - Comprehensive event callbacks for analytics
- **Error handling** - Graceful error recovery and user feedback

## 🎥 HLS Video Setup

### 1. Video Encoding with FFmpeg

#### Basic HLS Encoding
```bash
# Single quality HLS
ffmpeg -i input.mp4 -c:v libx264 -c:a aac -hls_time 6 -hls_list_size 0 -hls_segment_filename "segment_%03d.ts" playlist.m3u8
```

#### Multi-Quality HLS (Adaptive Streaming)
```bash
# Create multiple quality levels
ffmpeg -i input.mp4 \
  -filter_complex "[0:v]split=3[v1][v2][v3]; \
  [v1]scale=w=1920:h=1080[v1out]; \
  [v2]scale=w=1280:h=720[v2out]; \
  [v3]scale=w=854:h=480[v3out]" \
  -map "[v1out]" -map 0:a -c:v libx264 -c:a aac -b:v 5000k -b:a 128k -hls_time 6 -hls_list_size 0 -hls_segment_filename "1080p/segment_%03d.ts" 1080p/playlist.m3u8 \
  -map "[v2out]" -map 0:a -c:v libx264 -c:a aac -b:v 2800k -b:a 128k -hls_time 6 -hls_list_size 0 -hls_segment_filename "720p/segment_%03d.ts" 720p/playlist.m3u8 \
  -map "[v3out]" -map 0:a -c:v libx264 -c:a aac -b:v 1400k -b:a 128k -hls_time 6 -hls_list_size 0 -hls_segment_filename "480p/segment_%03d.ts" 480p/playlist.m3u8
```

#### Master Playlist Creation
```bash
# Create master playlist that references all quality levels
cat > master.m3u8 << EOF
#EXTM3U
#EXT-X-VERSION:3

#EXT-X-STREAM-INF:BANDWIDTH=5128000,RESOLUTION=1920x1080
1080p/playlist.m3u8

#EXT-X-STREAM-INF:BANDWIDTH=2928000,RESOLUTION=1280x720
720p/playlist.m3u8

#EXT-X-STREAM-INF:BANDWIDTH=1528000,RESOLUTION=854x480
480p/playlist.m3u8
EOF
```

### 2. Recommended FFmpeg Settings

#### High Quality Settings
```bash
ffmpeg -i input.mp4 \
  -c:v libx264 \
  -preset slow \
  -crf 18 \
  -c:a aac \
  -b:a 128k \
  -hls_time 6 \
  -hls_list_size 0 \
  -hls_segment_filename "segment_%03d.ts" \
  -f hls \
  playlist.m3u8
```

#### Optimized for Web
```bash
ffmpeg -i input.mp4 \
  -c:v libx264 \
  -preset fast \
  -crf 23 \
  -maxrate 5000k \
  -bufsize 10000k \
  -c:a aac \
  -b:a 128k \
  -hls_time 4 \
  -hls_list_size 0 \
  -hls_segment_filename "segment_%03d.ts" \
  -f hls \
  playlist.m3u8
```

## 🌐 Hosting Recommendations

### 1. Cloudflare Stream (Recommended)
- **CDN**: Global edge network
- **HLS Support**: Native HLS streaming
- **Pricing**: Pay per minute of video
- **Features**: Automatic transcoding, adaptive streaming

```javascript
// Cloudflare Stream URL format
const streamUrl = "https://videodelivery.net/{VIDEO_ID}/manifest/video.m3u8";
```

### 2. Mux
- **Professional**: Enterprise-grade video platform
- **HLS Support**: Full HLS and DASH support
- **Analytics**: Detailed viewing analytics
- **Pricing**: Pay per minute

### 3. Bunny.net
- **Affordable**: Cost-effective video streaming
- **HLS Support**: Native HLS support
- **Global CDN**: Fast worldwide delivery
- **Pricing**: Pay per GB transferred

### 4. AWS MediaConvert + CloudFront
- **Enterprise**: Full control over encoding
- **Scalable**: Handles large video libraries
- **Cost**: Pay for encoding + CDN
- **Complexity**: Requires more setup

## 📁 File Structure for HLS

```
public/
├── videos/
│   ├── movie1/
│   │   ├── master.m3u8
│   │   ├── 1080p/
│   │   │   ├── playlist.m3u8
│   │   │   ├── segment_000.ts
│   │   │   ├── segment_001.ts
│   │   │   └── ...
│   │   ├── 720p/
│   │   │   ├── playlist.m3u8
│   │   │   ├── segment_000.ts
│   │   │   └── ...
│   │   └── 480p/
│   │       ├── playlist.m3u8
│   │       ├── segment_000.ts
│   │       └── ...
│   └── movie2/
│       └── ...
```

## 🔧 Backend Configuration

### 1. Update Movie Model
```sql
-- Add HLS support to movies table
ALTER TABLE movies ADD COLUMN hls_master_url TEXT;
ALTER TABLE movies ADD COLUMN video_type VARCHAR(20) DEFAULT 'mp4';
```

### 2. Backend Route Update
```javascript
// routes/movies.js
router.post('/', authenticateJWT, requireAdmin, async (req, res) => {
  try {
    const { title, description, release_year, genre, hls_master_url, video_type } = req.body;
    
    const result = await pool.query(
      'INSERT INTO movies (title, description, release_year, genre, hls_master_url, video_type) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [title, description, release_year, genre, hls_master_url, video_type || 'mp4']
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### 3. Frontend API Update
```javascript
// services/api.js
export const createMovie = async (movieData) => {
  const response = await api.post('/movies', movieData);
  return response.data;
};

// Support both MP4 and HLS
export const getVideoUrl = (movie) => {
  if (movie.hls_master_url) {
    return movie.hls_master_url; // HLS master playlist
  }
  return getFileUrl(movie.movie_file_url); // MP4 file
};
```

## 🎨 Customization Options

### 1. Player Configuration
```javascript
const playerConfig = {
  controls: true,
  responsive: true,
  fluid: true,
  aspectRatio: '16:9',
  preload: 'metadata',
  playbackRates: [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2],
  html5: {
    hls: {
      enableLowInitialPlaylist: true,
      smoothQualityChange: true,
      overrideNative: true
    }
  }
};
```

### 2. Quality Selection
```javascript
// Manual quality selection
player.qualityLevels().on('addqualitylevel', (event) => {
  const qualityLevel = event.qualityLevel;
  console.log(`Quality: ${qualityLevel.width}x${qualityLevel.height} (${qualityLevel.bitrate}kbps)`);
});

// Set preferred quality
player.qualityLevels().on('change', (event) => {
  const qualityLevel = event.qualityLevel;
  if (qualityLevel) {
    console.log(`Switched to: ${qualityLevel.width}x${qualityLevel.height}`);
  }
});
```

## 📱 Mobile Optimization

### 1. Responsive Breakpoints
```css
/* Desktop */
@media (min-width: 1200px) {
  .video-player-container { max-width: 1200px; }
}

/* Tablet */
@media (max-width: 768px) {
  .video-player-container { margin: 0; border-radius: 0; }
}

/* Mobile */
@media (max-width: 480px) {
  .vjs-volume-panel { display: none; }
  .vjs-playback-rate { display: none; }
}
```

### 2. Touch Controls
```javascript
// Enable touch gestures
player.touchSupport = true;

// Custom touch controls
player.on('touchstart', (event) => {
  // Handle touch events
});
```

## 🔍 Performance Optimization

### 1. Preloading Strategy
```javascript
const preloadOptions = {
  preload: 'metadata', // Load only metadata initially
  preloadTextTracks: false,
  preloadAudioData: false
};
```

### 2. Buffering Configuration
```javascript
const bufferingConfig = {
  html5: {
    hls: {
      enableLowInitialPlaylist: true,
      smoothQualityChange: true,
      overrideNative: true,
      maxBufferLength: 30,
      maxMaxBufferLength: 60
    }
  }
};
```

### 3. Memory Management
```javascript
// Clean up player resources
useEffect(() => {
  return () => {
    if (playerRef.current) {
      playerRef.current.dispose();
      playerRef.current = null;
    }
  };
}, []);
```

## 🚀 Deployment Checklist

### ✅ Pre-deployment
- [ ] Test HLS streams on multiple devices
- [ ] Verify quality switching works
- [ ] Check mobile responsiveness
- [ ] Test with different network conditions
- [ ] Validate error handling

### ✅ Production Setup
- [ ] Configure CDN for HLS delivery
- [ ] Set up proper CORS headers
- [ ] Enable gzip compression for .m3u8 files
- [ ] Configure cache headers
- [ ] Set up monitoring and analytics

### ✅ Performance Monitoring
- [ ] Track video load times
- [ ] Monitor quality switching frequency
- [ ] Measure buffering events
- [ ] Track user engagement metrics
- [ ] Monitor CDN performance

## 🎯 Best Practices

### 1. Video Encoding
- Use consistent segment duration (4-6 seconds)
- Optimize bitrates for target audience
- Include multiple quality levels
- Test on various devices and networks

### 2. Delivery
- Use CDN for global distribution
- Enable HTTP/2 for better performance
- Set appropriate cache headers
- Monitor and optimize based on analytics

### 3. User Experience
- Provide quality selection options
- Show buffering indicators
- Handle errors gracefully
- Optimize for mobile viewing

## 🔧 Troubleshooting

### Common Issues

#### 1. HLS Not Loading
```javascript
// Check CORS headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});
```

#### 2. Quality Switching Not Working
```javascript
// Ensure quality levels plugin is loaded
import 'videojs-contrib-quality-levels';
import 'videojs-http-source-selector';
```

#### 3. Mobile Playback Issues
```javascript
// Check for mobile-specific settings
if (isMobile) {
  player.options_.html5.hls.overrideNative = false;
}
```

## 📊 Analytics Integration

### 1. Video Analytics
```javascript
const trackVideoEvent = (event, data) => {
  // Send to analytics service
  analytics.track('video_event', {
    event,
    video_id: movie.id,
    ...data
  });
};

// Track various events
player.on('play', () => trackVideoEvent('play'));
player.on('pause', () => trackVideoEvent('pause'));
player.on('ended', () => trackVideoEvent('complete'));
```

### 2. Quality Metrics
```javascript
player.qualityLevels().on('change', (event) => {
  const qualityLevel = event.qualityLevel;
  trackVideoEvent('quality_change', {
    width: qualityLevel.width,
    height: qualityLevel.height,
    bitrate: qualityLevel.bitrate
  });
});
```

This setup provides a professional, YouTube-like video player with full HLS support, adaptive streaming, and responsive design! 🎬✨ 