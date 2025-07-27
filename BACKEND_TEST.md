# 🔧 Backend Test Guide

## 🎯 Test Your Backend

Visit these URLs to verify your backend is working:

### 1. Basic API Test
```
https://oceansmov-backend.onrender.com/api/test
```
**Expected:** JSON response with database and environment info

### 2. Root Endpoint
```
https://oceansmov-backend.onrender.com/
```
**Expected:** JSON with API information

### 3. Movies Endpoint
```
https://oceansmov-backend.onrender.com/api/movies
```
**Expected:** JSON array of movies (or empty array)

### 4. Genres Endpoint
```
https://oceansmov-backend.onrender.com/api/movies/genres
```
**Expected:** JSON array of genres

## 🚨 If Backend Tests Fail

If the backend URLs don't work, the issue is with:
- Database connection
- Environment variables in Render
- Backend deployment

## ✅ If Backend Tests Pass

If backend URLs work, the issue is with:
- Vercel environment variable not updated
- Frontend not redeployed after environment variable change

## 🔧 Quick Fix Steps

1. **Update Vercel Environment Variable**
2. **Redeploy Vercel project**
3. **Test frontend again**

The backend URL should be: `https://oceansmov-backend.onrender.com/api` 