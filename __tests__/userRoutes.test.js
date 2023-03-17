process.env.NODE_ENV = 'test';
// const bcrypt = require("bcrypt");
const request = require("supertest");
const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require('../config')
const app = require("../app");
const db = require("../db");
// const Message = require("../models/messages");
const User = require("../models/user")
const Message = require("../models/message")

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
    test("GET / with valid user token", async () => {
        const response = await request(app)
            .get('/users/')
            .send({ _token: User1Token });
        expect(response.statusCode).toBe(200)
        expect(response.body).toEqual(expect.objectContaining({ users: expect.any(Array) }))
    })
    test("GET / cannot get all users unless you are signed in", async () => {
        const response = await request(app)
            .get('/users/')
            .send({});
        expect(response.statusCode).toBe(401)
        expect(response.body).toEqual(expect.objectContaining({ message: "Unauthorized" }))
    })
    test("GET /:username with valid token", async () => {
        const response = await request(app)
            .get(`/users/${USER1.username}`)
            .send({ _token: User1Token });
        expect(response.statusCode).toBe(200)
        expect(response.body.user).toEqual(expect.objectContaining({ username: USER1.username }))
    });
    test("GET /:username with invalid username", async () => {
        const response = await request(app)
            .get(`/users/${USER1.first_name}`)
            .send({ _token: User1Token });
        expect(response.statusCode).toBe(400)
        expect(response.body).toEqual(expect.objectContaining({ message: `User ${USER1.first_name} Found` }))
    });




    test("GET /:username/to Returns messages sent to me", async () => {
        const message = await Message.create({ from_username: USER2.username, to_username: USER1.username, body: "This is a test message" });


        const response = await request(app).get(`/users/${USER1.username}/to`).send({ _token: User1Token });
        expect(response.statusCode).toBe(200)
        expect(response.body).toEqual(expect.objectContaining({ messages: expect.any(Array) }))
    })
    test("GET /:username/from Returns messages from me", async () => {
        const message = await Message.create({ from_username: USER2.username, to_username: USER1.username, body: "This is a test message" });


        const response = await request(app).get(`/users/${USER1.username}/from`).send({ _token: User1Token });
        expect(response.statusCode).toBe(200)
        expect(response.body).toEqual(expect.objectContaining({ messages: "You haven't sent any messages" }))
    })



    test("GET /:username/from Returns messages sent from me", async () => {
        const message = await Message.create({ from_username: USER2.username, to_username: USER1.username, body: "This is a test message" });
        const response = await request(app).get(`/users/${USER2.username}/from`).send({ _token: User2Token });
        expect(response.statusCode).toBe(200)
        expect(response.body).toEqual(expect.objectContaining({ messages: expect.any(Array) }))
    })
    test("GET /:username/from Returns messages sent to me", async () => {
        const message = await Message.create({ from_username: USER2.username, to_username: USER1.username, body: "This is a test message" });
        const response = await request(app).get(`/users/${USER2.username}/to`).send({ _token: User2Token });
        expect(response.statusCode).toBe(200)
        expect(response.body).toEqual(expect.objectContaining({ messages: "No Messages" }))
    })



    test("GET /:WRONGuser/to ensureCorrectUser will block this", async () => {
        const response = await request(app).get(`/users/${USER2.username}/to`).send({ _token: User1Token });
        expect(response.statusCode).toBe(401);
        expect(response.body).toEqual(expect.objectContaining({ message: "Unauthorized" }))
    })
    test("GET /:WRONGuser/from  ensureCorrectUser will block this", async () => {
        const response = await request(app).get(`/users/${USER2.username}/from`).send({ _token: User1Token });
        expect(response.statusCode).toBe(401);
        expect(response.body).toEqual(expect.objectContaining({ message: "Unauthorized" }))
    })
})
afterAll(async function () {
    await db.end();
});