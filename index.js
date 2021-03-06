const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const mongoose = require("mongoose");
const userRouter = require("./routers/userRoutes.js");
const messageRouter = require("./routers/messageRoutes");
const app = express();
const socket = require("socket.io");
require("dotenv").config();
mongoose
    .connect(process.env.MONGO_URL, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(() => {
        console.log("DB Connection Successfull");
    })
    .catch((err) => {
        console.log(err.message);
    });

const configOrigin = {
    origin: "*",
    optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
};
app.use(cors(configOrigin));
app.options("*", cors(configOrigin));
// app.use(function (req, res, next) {
//     res.header("Access-Control-Allow-Origin", "*");
//     res.header("Access-Control-Allow-Methods", "*");
//     res.header("Access-Control-Allow-Headers", "Content-Type");
//     next();
// });
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(bodyParser.json());
app.use("/api/auth", cors(configOrigin), userRouter);
app.use("/api/messages", messageRouter);

const server = app.listen(process.env.PORT, () => {
    console.log(`Server Started on Port ${process.env.PORT}`);
});

const io = socket(server, {
    cors: {
        origin: "https://singular-sundae-fa54f8.netlify.app",
        credentials: true,
    },
});

global.onlineUsers = new Map();
io.on("connection", (socket) => {
    global.chatSocket = socket;
    socket.on("add-user", (userId) => {
        onlineUsers.set(userId, socket.id);
    });

    socket.on("send-msg", (data) => {
        const sendUserSocket = onlineUsers.get(data.to);
        if (sendUserSocket) {
            socket.to(sendUserSocket).emit("msg-recieve", data.msg);
        }
    });
});
