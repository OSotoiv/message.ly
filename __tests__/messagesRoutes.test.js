process.env.NODE_ENV = 'test';
const bcrypt = require("bcrypt");
const request = require("supertest");
const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require('../config')
const app = require("../app");
const db = require("../db");
// const Message = require("../models/messages");
const User = require("../models/user")

let testUserToken;
const PASSWORD = "SECRETpassword";
let hashedPassword;
let USER1;



describe('POST /login', () => {
    beforeAll(async () => {//setup one new user
        await db.query("DELETE FROM messages");
        await db.query("DELETE FROM users");
        USER1 = await User.register({ username: 'user1', password: PASSWORD, first_name: "User", last_name: "One", phone: "+14150000000" });
        // testUserToken = jwt.sign({ username: USER1.username }, SECRET_KEY);
        let inner = 'im in the beforeAll function'
    });
    test("return logged in token", async () => {
        const response = await request(app)
            .post(`/auth/login`)
            .send({ username: USER1.username, password: PASSWORD });
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual(expect.objectContaining({ token: expect.any(String) }))
    })
})
afterAll(async function () {
    await db.end();
});