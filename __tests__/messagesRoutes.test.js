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
let USER3;
let User3Token;
let messageID;


describe('Test Message Routes', () => {
    beforeAll(async () => {//setup new users
        await db.query("DELETE FROM messages");
        await db.query("DELETE FROM users");
        USER1 = await User.register({ username: 'testUser1', password: PASSWORD, first_name: "User1", last_name: "One", phone: "+14150000000" });
        USER2 = await User.register({ username: 'testUser2', password: PASSWORD, first_name: "User2", last_name: "Two", phone: "+14150000000" });
        USER3 = await User.register({ username: 'testUser3', password: PASSWORD, first_name: "User3", last_name: "Three", phone: "+14150000000" });
        User1Token = jwt.sign({ username: USER1.username }, SECRET_KEY);
        User2Token = jwt.sign({ username: USER2.username }, SECRET_KEY);
        User3Token = jwt.sign({ username: USER3.username }, SECRET_KEY);
        let inner = 'im in the beforeAll function'
    });
    test("return logged in token", async () => {
        const response = await request(app)
            .post(`/auth/login`)
            .send({ username: USER1.username, password: PASSWORD });
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual(expect.objectContaining({ token: expect.any(String) }))
    });
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
            sent_at: expect.any(String)
        }))
    });
    test("GET /:id as the from_username", async () => {
        const response = await request(app)
            .get(`/messages/${messageID}`).send({ _token: User1Token });
        expect(response.statusCode).toBe(200);
        expect(response.body.message).toEqual(expect.objectContaining({
            id: expect.any(Number),
            from_user: {
                username: 'testUser1',
                first_name: 'User1',
                last_name: 'One',
                phone: '+14150000000'
            },
            to_user: {
                username: 'testUser2',
                first_name: 'User2',
                last_name: 'Two',
                phone: '+14150000000'
            },
            body: 'this is a test',
            sent_at: expect.any(String),
            read_at: null

        }))

    });
    test("GET /:id as the to_username", async () => {
        const response = await request(app)
            .get(`/messages/${messageID}`).send({ _token: User2Token });
        expect(response.statusCode).toBe(200);
        expect(response.body.message).toEqual(expect.objectContaining({
            id: expect.any(Number),
            from_user: {
                username: 'testUser1',
                first_name: 'User1',
                last_name: 'One',
                phone: '+14150000000'
            },
            to_user: {
                username: 'testUser2',
                first_name: 'User2',
                last_name: 'Two',
                phone: '+14150000000'
            },
            body: 'this is a test',
            sent_at: expect.any(String),
            read_at: null

        }))
    });
    test("GET /:id Wrong User", async () => {
        //ONLY to_user and from_user can get the Message
        const response = await request(app)
            .get(`/messages/${messageID}`).send({ _token: User3Token });
        expect(response.statusCode).toBe(401);
        console.log(response.body)
        expect(response.body).toEqual(expect.objectContaining({ message: "Unauthorized" }))
    });
    test("POST /:id/read as to_username", async () => {
        //ONLY to_user can mark as read
        const response = await request(app)
            .post(`/messages/${messageID}/read`)
            .send({ _token: User2Token });
        expect(response.statusCode).toBe(200);
        expect(response.body.message).toEqual(expect.objectContaining({
            read_at: expect.any(String)

        }))

    });
    test("POST /:id/read as from_username", async () => {
        //ONLY to_user can mark as read
        const response = await request(app)
            .post(`/messages/${messageID}/read`)
            .send({ _token: User1Token });
        expect(response.statusCode).toBe(404);
        expect(response.body).toEqual(expect.objectContaining({
            message: `No such message: ${messageID}`
        }))
        //NOTE this will return a message not found error if you are the wrong user 
        //trying to update the message as read.
    });
})
afterAll(async function () {
    await db.end();
});