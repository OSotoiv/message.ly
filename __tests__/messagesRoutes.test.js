process.env.NODE_ENV = 'test';
// const bcrypt = require("bcrypt");
const request = require("supertest");
const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require('../config')
const app = require("../app");
const db = require("../db");
// const Message = require("../models/messages");
const User = require("../models/user")

const PASSWORD = "SECRETpassword";
let hashedPassword;
let USER1;
let User1Token;
let USER2;
let User2Token;
let messageID;


describe('Test Message Routes', () => {
    beforeAll(async () => {//setup one new user
        await db.query("DELETE FROM messages");
        await db.query("DELETE FROM users");
        USER1 = await User.register({ username: 'testUser1', password: PASSWORD, first_name: "User1", last_name: "One", phone: "+14150000000" });
        USER2 = await User.register({ username: 'testUser2', password: PASSWORD, first_name: "User2", last_name: "Two", phone: "+14150000000" });
        User1Token = jwt.sign({ username: USER1.username }, SECRET_KEY);
        User2Token = jwt.sign({ username: USER2.username }, SECRET_KEY);
        let inner = 'im in the beforeAll function'
    });
    test("return logged in token", async () => {
        const response = await request(app)
            .post(`/auth/login`)
            .send({ username: USER1.username, password: PASSWORD });
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual(expect.objectContaining({ token: expect.any(String) }))
    })
    test("POST /", async () => {//create new message
        const response = await request(app)
            .post("/messages/")
            .send({ _token: User1Token, to_username: USER2.username, msg: 'this is a test' });
        messageID = response.body.message.id;
        expect(response.statusCode).toBe(201);
        expect(response.body.message).toEqual(expect.objectContaining({
            id: expect.any(Number),
            from_username: 'testUser1',
            to_username: 'testUser2',
            body: 'this is a test',
            sent_at: expect.any(Date)
        }))
        test("GET /:id as the from_username", async () => {
            const response = await request(app)
                .get(`/auth/${messageID}`)
                .send({ _token: User1Token });
            expect(response.statusCode).toBe(200);
            console.log(request.body)
        })
    })
})
afterAll(async function () {
    await db.end();
});