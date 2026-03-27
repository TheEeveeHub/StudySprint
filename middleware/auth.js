function requireAuth(req, res, next) {
	if (!req.session.user) {
		return res.redirect('/login');
	}
	next();
}

function requireGuest(req, res, next) {
	if (req.session.user) {
		return res.redirect('/dashboard');
	}
	next();
}

function attachUserToLocals(req, res, next) {
	res.locals.currentUser = req.session.user || null;
	res.locals.success = req.session.success || null;
	res.locals.error = req.session.error || null;
	res.locals.validationErrors = req.session.validationErrors || [];
	res.locals.oldInput = req.session.oldInput || {};

	delete req.session.success;
	delete req.session.error;
	delete req.session.validationErrors;
	delete req.session.oldInput;

	next();
}

module.exports = {
	requireAuth,
	requireGuest,
	attachUserToLocals
};
