# 🎬 Movie Web

A modern movie streaming web application built with React, Node.js, and PostgreSQL. Features include user authentication, movie uploads, reviews, and a responsive design.

## ✨ Features

- 🎥 **Movie Streaming**: Upload and stream movies with a custom video player
- 👤 **User Authentication**: Secure login/register system with JWT tokens
- 👨‍💼 **Admin Panel**: Manage movies, users, and reviews
- ⭐ **Review System**: Rate and comment on movies
- 🔍 **Search & Filter**: Find movies by title, genre, year, and rating
- 📱 **Responsive Design**: Works on desktop, tablet, and mobile
- 🌙 **Dark/Light Theme**: Toggle between themes
- 🎨 **Modern UI**: Beautiful, intuitive interface

## 🛠️ Tech Stack

### Frontend
- **React 19** - UI framework
- **React Router** - Client-side routing
- **Video.js** - Video player
- **Axios** - HTTP client
- **CSS3** - Styling with custom properties

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **PostgreSQL** - Database
- **JWT** - Authentication
- **Multer** - File uploads
- **bcryptjs** - Password hashing

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ and npm
- PostgreSQL database

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/yourusername/movie-web.git
   cd movie-web
   ```

2. **Install dependencies**:
   ```bash
   npm run install-all
   ```

3. **Set up environment variables**:
   
   Create `backend/.env`:
   ```env
   DATABASE_URL=postgresql://username:password@localhost:5432/movie_web
   JWT_SECRET=your_jwt_secret_key_here
   NODE_ENV=development
   ```

4. **Initialize the database**:
   ```bash
   node backend/init-postgres.js
   ```

5. **Start the development server**:
   ```bash
   npm run dev
   ```

6. **Open your browser**:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## 📁 Project Structure

```
movie-web/
├── backend/                 # Backend server
│   ├── routes/             # API routes
│   ├── public/             # Static files (movies, posters)
│   ├── app.js              # Express app configuration
│   ├── db.js               # Database connection
│   └── init-postgres.js    # Database initialization
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── context/        # React context
│   │   ├── services/       # API services
│   │   └── utils/          # Utility functions
│   └── public/             # Static assets
├── package.json            # Root package.json
└── README.md              # This file
```

## 🔧 API Endpoints

### Authentication
- `POST /api/users/register` - Register new user
- `POST /api/users/login` - User login

### Movies
- `GET /api/movies` - Get all movies (with search/filter)
- `GET /api/movies/:id` - Get movie details
- `POST /api/movies` - Create movie (admin only)
- `PUT /api/movies/:id` - Update movie (admin only)
- `DELETE /api/movies/:id` - Delete movie (admin only)
- `POST /api/movies/:id/poster` - Upload poster (admin only)
- `POST /api/movies/:id/movie` - Upload movie file (admin only)

### Reviews
- `GET /api/reviews/movie/:id` - Get reviews for movie
- `POST /api/reviews` - Add review
- `PUT /api/reviews/:id/approve` - Approve review (admin only)
- `DELETE /api/reviews/:id` - Delete review (admin only)

## 🎯 Usage

### For Users
1. **Register/Login** to your account
2. **Browse movies** on the home page
3. **Search and filter** movies by various criteria
4. **Watch movies** by clicking on them
5. **Rate and review** movies you've watched

### For Admins
1. **Login** with admin credentials
2. **Access admin panel** from the navbar
3. **Upload movies** with posters and video files
4. **Manage users** and their permissions
5. **Moderate reviews** by approving or deleting them

## 🚀 Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

### Quick Deploy Options:
- **Heroku**: One-click deployment with PostgreSQL addon
- **Vercel + Railway**: Separate frontend and backend deployment
- **DigitalOcean**: Full-stack deployment with managed database

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- CORS protection
- File upload validation
- SQL injection prevention
- XSS protection

## 📱 Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Video.js](https://videojs.com/) for the video player
- [Font Awesome](https://fontawesome.com/) for icons
- [PostgreSQL](https://www.postgresql.org/) for the database
- [React](https://reactjs.org/) for the frontend framework

## 📞 Support

If you encounter any issues or have questions:

1. Check the [Issues](../../issues) page
2. Create a new issue with detailed information
3. Contact the maintainers

---

**Made with ❤️ by [Your Name]** 