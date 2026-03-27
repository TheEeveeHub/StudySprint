const path = require('path');
const express = require('express');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const methodOverride = require('method-override');
const helmet = require('helmet');

const { initializeDatabase } = require('./db');
const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');
const { attachUserToLocals } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3000;

initializeDatabase();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(helmet({
	contentSecurityPolicy: false
}));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
	store: new SQLiteStore({
		db: 'sessions.sqlite',
		dir: path.join(__dirname, 'data')
	}),
	secret: process.env.SESSION_SECRET || 'change-this-secret-in-production',
	resave: false,
	saveUninitialized: false,
	cookie: {
		httpOnly: true,
		sameSite: 'lax',
		secure: process.env.NODE_ENV === 'production',
		maxAge: 1000 * 60 * 60 * 24
	}
}));

app.use(attachUserToLocals);

app.get('/', (req, res) => {
	if (req.session.user) {
		return res.redirect('/dashboard');
	}
	res.redirect('/login');
});

app.use('/', authRoutes);
app.use('/', taskRoutes);

app.use((req, res) => {
	res.status(404).render('404', {
		title: 'Page Not Found'
	});
});

app.use((error, req, res, next) => {
	console.error(error);
	res.status(500).render('500', {
		title: 'Server Error'
	});
});

app.listen(PORT, () => {
	console.log(`StudySprint is running on http://localhost:${PORT}`);
});
