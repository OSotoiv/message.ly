const { Router, request } = require('express');
const router = new Router();
const User = require('../models/user')
const { ensureLoggedIn, ensureCorrectUser } = require('../middleware/auth')
router.use(ensureLoggedIn);//sets the req.user if token is provided
//NOT all routes need to have logged in use

/** GET / - get list of users.
 *
 * => {users: [{username, first_name, last_name, phone}, ...]}
*
**/
router.get('/', async (req, res, next) => {
    try {
        const users = await User.all();
        return res.json({ users })
    } catch (e) {
        return next(e);
    }
})


/** GET /:username - get detail of users.
 *
 * => {user: {username, first_name, last_name, phone, join_at, last_login_at}}
 *
 **/
router.get('/:username', async (req, res, next) => {
    try {
        const user = await User.get(req.params.username);
        return res.json({ user })
    } catch (e) {
        return next(e);
    }
})

/** GET /:username/to - get messages to user
 * messages TOME!
 * => {messages: [{id,
 *                 body,
 *                 sent_at,
 *                 read_at,
 *                 from_user: {username, first_name, last_name, phone}}, ...]}
 *
 **/
router.get('/:username/to', ensureCorrectUser, async (req, res, next) => {
    try {
        const me = req.user.username;
        const messages = await User.messagesTo(me);
        return res.json({ messages })
    } catch (e) {
        next(e)
    }
})


/** GET /:username/from - get messages from user
 *
 * => {messages: [{id,
 *                 body,
 *                 sent_at,
 *                 read_at,
 *                 to_user: {username, first_name, last_name, phone}}, ...]}
 *
 **/
router.get('/:username/from', ensureCorrectUser, async (req, res, next) => {
    try {
        const me = req.user.username;
        const messages = await User.messagesFrom(me);
        return res.json({ messages })
    } catch (e) {
        next(e)
    }
})
module.exports = router;