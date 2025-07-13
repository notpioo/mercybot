// Dashboard middleware functions
function requireAuth(req, res, next) {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    next();
}

function requireOwner(req, res, next) {
    if (!req.session.user || req.session.user.role !== 'owner') {
        return res.status(403).send('Access denied. Owner role required.');
    }
    next();
}

module.exports = {
    requireAuth,
    requireOwner
};