/** User class for message.ly */

// const { DB_URI } = require("../config");
const db = require("../db");
const ExpressError = require("../expressError");
const bcrypt = require("bcrypt");
const { BCRYPT_WORK_FACTOR } = require('../config')


/** User of the site. */

class User {
  constructor({ username, password, first_name, last_name, phone, join_at, last_login_at }) {
    this.username = username,
      this.password = password,
      this.first_name = first_name,
      this.last_name = last_name,
      this.phone = phone,
      this.join_at = join_at,
      this.last_login_at = last_login_at
  }
  static async register({ username, password, first_name, last_name, phone }) {
    // register new user -- returns new User
    const user = new User({ username, password, first_name, last_name, phone });
    const hashPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);
    const results = await db.query(`INSERT INTO users (username, password, first_name, last_name, phone, join_at)
      VALUES($1, $2, $3, $4, $5, NOW()) RETURNING *;`, [username, hashPassword, first_name, last_name, phone]);
    if (results.rows[0]) {
      return user;
    }
    throw new ExpressError('Failed to save user to database', 500)
  }

  /** Authenticate: is this username/password valid? Returns boolean. */
  static async authenticate(username, password) {
    const result = await db.query(`SELECT username,password FROM users WHERE username = $1;`, [username]);
    const user = result.rows[0];
    if (user && await bcrypt.compare(password, user.password)) {
      return true;
    }
    return false;
    //the test want me to return a falsy value
    // throw new ExpressError("Invalid user/password", 400);
  }

  /** Update last_login_at for user */

  static async updateLoginTimestamp(username) {
    await db.query('UPDATE users SET last_login_at = NOW() WHERE username = $1;', [username])
  }

  /** All: basic info on all users:
   * [{username, first_name, last_name, phone}, ...] */

  static async all() {
    const results = await db.query('SELECT username, first_name, last_name, phone FROM users;');
    if (results.rows[0]) {
      return results.rows.map(obj => new User(obj));
    }
    throw new ExpressError("No users Found", 400);
  }

  /** Get: get user by username
   *
   * returns {username,
   *          first_name,
   *          last_name,
   *          phone,
   *          join_at,
   *          last_login_at } */

  static async get(username) {
    const results = await db.query(`SELECT 
      username, first_name, last_name, phone, join_at, last_login_at
      FROM users
      WHERE username = $1;`, [username]);
    if (results.rows[0]) {
      return results.rows[0];
    }
    throw new ExpressError(`User ${username} Found`, 400);
  }

  /** Return messages from this user.
   *
   * [{id, to_user, body, sent_at, read_at}]
   *
   * where to_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesFrom(username) {
    const results = await db.query(`SELECT
    m.id, m.body, m.sent_at, m.read_at,
    json_build_object('username', u.username,
    'first_name', u.first_name,
    'last_name', u.last_name,
    'phone', u.phone) AS to_user
    FROM messages m
    JOIN users u ON m.to_username = u.username
    WHERE m.from_username = $1;`, [username]);
    if (results.rows[0]) {
      return results.rows
    }
    return "You haven't sent any messages"
  }

  /** Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesTo(username) {
    const results = await db.query(`SELECT
    m.id, m.body, m.sent_at, m.read_at,
    json_build_object('username', u.username,
    'first_name', u.first_name,
    'last_name', u.last_name,
    'phone', u.phone) AS from_user
    FROM messages m
    JOIN users u ON m.from_username = u.username
    WHERE m.to_username = $1;`, [username]);
    if (results.rows[0]) {
      return results.rows
    }
    return 'No Messages'
  }
}


module.exports = User;

// static async messagesTo(username) {
//   const results = await db.query(`SELECT
//   m.id, m.body, m.sent_at, m.read_at,
//   json_build_object('username', u.username,
//   'first_name', u.first_name,
//   'last_name', u.last_name,
//   'phone', u.phone,
//   'join_at', u.join_at,
//   'last_login_at', u.last_login_at) AS sent_from
//   FROM messages m
//   JOIN users u ON m.from_username = u.username
//   WHERE m.to_username = $1;`, [username]);
//   if (results.rows[0]) {
//     return results.rows
//   }
//   return 'No Messages'
// }
