const express = require('express');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');

const { db } = require('../db');
const { requireGuest } = require('../middleware/auth');

const router = express.Router();

const authLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 20,
	standardHeaders: true,
	legacyHeaders: false,
	message: 'Too many login attempts. Please try again later.'
});

const registerValidation = [
	body('name')
		.trim()
		.notEmpty().withMessage('Name is required.')
		.isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters.'),
	body('email')
		.trim()
		.notEmpty().withMessage('Email is required.')
		.isEmail().withMessage('Please enter a valid email address.')
		.normalizeEmail(),
	body('password')
		.notEmpty().withMessage('Password is required.')
		.isLength({ min: 6 }).withMessage('Password must be at least 6 characters long.'),
	body('confirmPassword')
		.notEmpty().withMessage('Please confirm your password.')
		.custom((value, { req }) => value === req.body.password)
		.withMessage('Passwords do not match.')
];

const loginValidation = [
	body('email')
		.trim()
		.notEmpty().withMessage('Email is required.')
		.isEmail().withMessage('Please enter a valid email address.')
		.normalizeEmail(),
	body('password')
		.notEmpty().withMessage('Password is required.')
];

router.get('/register', requireGuest, (req, res) => {
	res.render('register', {
		title: 'Register'
	});
});

router.post('/register', requireGuest, authLimiter, registerValidation, (req, res) => {
	const errors = validationResult(req);
	const { name, email, password } = req.body;

	if (!errors.isEmpty()) {
		req.session.validationErrors = errors.array();
		req.session.oldInput = { name, email };
		return res.redirect('/register');
	}

	db.get('SELECT id FROM users WHERE email = ?', [email], async (selectError, existingUser) => {
		if (selectError) {
			return res.status(500).render('500', { title: 'Server Error' });
		}

		if (existingUser) {
			req.session.error = 'An account with that email already exists.';
			req.session.oldInput = { name, email };
			return res.redirect('/register');
		}

		try {
			const hashedPassword = await bcrypt.hash(password, 12);

			db.run(
				'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
				[name, email, hashedPassword],
				function(insertError) {
					if (insertError) {
						return res.status(500).render('500', { title: 'Server Error' });
					}

					req.session.success = 'Registration successful. Please log in.';
					res.redirect('/login');
				}
			);
		} catch (hashError) {
			return res.status(500).render('500', { title: 'Server Error' });
		}
	});
});

router.get('/login', requireGuest, (req, res) => {
	res.render('login', {
		title: 'Login'
	});
});

router.post('/login', requireGuest, authLimiter, loginValidation, (req, res) => {
	const errors = validationResult(req);
	const { email, password } = req.body;

	if (!errors.isEmpty()) {
		req.session.validationErrors = errors.array();
		req.session.oldInput = { email };
		return res.redirect('/login');
	}

	db.get('SELECT * FROM users WHERE email = ?', [email], async (selectError, user) => {
		if (selectError) {
			return res.status(500).render('500', { title: 'Server Error' });
		}

		if (!user) {
			req.session.error = 'Invalid email or password.';
			req.session.oldInput = { email };
			return res.redirect('/login');
		}

		const isMatch = await bcrypt.compare(password, user.password);
		if (!isMatch) {
			req.session.error = 'Invalid email or password.';
			req.session.oldInput = { email };
			return res.redirect('/login');
		}

		req.session.user = {
			id: user.id,
			name: user.name,
			email: user.email
		};

		req.session.success = 'Welcome back!';
		res.redirect('/dashboard');
	});
});

router.post('/logout', (req, res) => {
	req.session.destroy(() => {
		res.clearCookie('connect.sid');
		res.redirect('/login');
	});
});

module.exports = router;
