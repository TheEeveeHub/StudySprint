# StudySprint

StudySprint is a simple micro-SaaS study planner built with Node.js, Express, SQLite, HTML, CSS, and JavaScript.
It includes user authentication, a dashboard, task management, filters, progress tracking, and logout support.

## Features

- User registration and login
- Secure password hashing with bcrypt
- Express sessions for login state
- SQLite database
- Create, edit, delete, and complete study tasks
- Filter tasks by all, completed, or pending
- Dashboard progress summary
- Input validation and error handling
- Clean and beginner-friendly file structure
- Simple modern UI
- Basic security helpers with Helmet and rate limiting

## Tech Stack

- Node.js
- Express
- SQLite3
- EJS templates
- HTML
- CSS
- Vanilla JavaScript

## Folder Structure

```text
studysprint/
├── data/
│   ├── studysprint.sqlite
│   └── sessions.sqlite
├── middleware/
│   └── auth.js
├── public/
│   ├── css/
│   │   └── styles.css
│   └── js/
│       └── dashboard.js
├── routes/
│   ├── auth.js
│   └── tasks.js
├── views/
│   ├── partials/
│   │   ├── footer.ejs
│   │   └── header.ejs
│   ├── 404.ejs
│   ├── 500.ejs
│   ├── dashboard.ejs
│   ├── edit-task.ejs
│   ├── login.ejs
│   └── register.ejs
├── db.js
├── package.json
├── README.md
└── server.js
```

## Setup Steps

1. Download or clone the project.
2. Open the project folder in your terminal.
3. Install dependencies:

```bash
npm install
```

4. Start the app:

```bash
npm start
```

5. Open your browser and go to:

```text
http://localhost:3000
```

## Optional Environment Variables

You can create a `.env` file or set environment variables in your terminal.
For a student project, the app also works without this because it includes a default fallback.

```text
SESSION_SECRET=your-long-random-secret
NODE_ENV=development
PORT=3000
```

## Default Behavior

- The SQLite database file is created automatically inside the `data` folder.
- Sessions are also stored in SQLite.
- Unauthenticated users are redirected to the login page.
- Logged-in users are redirected to the dashboard.

## Security Notes

This project includes a good student-project security baseline:

- Passwords are hashed with bcrypt
- Sessions use `httpOnly` cookies
- Helmet adds secure HTTP headers
- Rate limiting is applied to auth routes
- SQL queries use placeholders to help prevent SQL injection
- Users can only access their own tasks

## Ideas for Future Improvements

- Add password reset
- Add email verification
- Add dark mode
- Add task categories or tags
- Add study streak tracking
- Add deployment with Render or Railway

## License

MIT
