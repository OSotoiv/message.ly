const { Router } = require('express');
const router = new Router();
const Message = require('../models/message')
const { ensureLoggedIn, ensureCorrectUser } = require('../middleware/auth')
router.use(ensureLoggedIn);
//NOT all routes need to have logged in use

/** GET /:id - get detail of message.
 *
 * => {message: {id,
 *               body,
 *               sent_at,
 *               read_at,
 *               from_user: {username, first_name, last_name, phone},
 *               to_user: {username, first_name, last_name, phone}}
 *
 * Make sure that the currently-logged-in users is either the to or from user.
 *
 **/
router.get('/:id', async (req, res, next) => {
    try {
        const message = await Message.get(req.params.id, req.user.username);
        return res.json({ message })
    } catch (e) {
        next(e)
    }
})



/** POST / - post message.
 *
 * {to_username, body} =>
 *   {message: {id, from_username, to_username, body, sent_at}}
 *
 **/
router.post('/', async (req, res, next) => {
    try {
        const from_username = req.user.username;
        const { to_username, msg: body } = req.body;
        const message = await Message.create({ from_username, to_username, body });
        return res.status(201).json({ message })
    } catch (e) {
        next(e)
    }
})

/** POST/:id/read - mark message as read:
 *
 *  => {message: {id, read_at}}
 *
 * Make sure that the only the intended recipient can mark as read.
 *
 **/
router.post('/:id/read', async (req, res, next) => {
    try {
        const { id } = req.params;
        const to_username = req.user.username;
        const message = await Message.markRead({ id, to_username });
        return res.json({ message });
    } catch (e) {
        next(e)
    }
})
module.exports = router;
