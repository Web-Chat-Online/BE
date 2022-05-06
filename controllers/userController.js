const User = require("../models/userModel");
const brcypt = require("bcrypt");
const jwt = require("jsonwebtoken");
function generateAuthToken(user) {
    return jwt.sign(
        {
            id: user.id,
            role: user.role,
        },
        process.env.JWT_TOKEN,
        { expiresIn: "365d" }
    );
}
module.exports.register = async (req, res, next) => {
    try {
        const { username, email, password } = req.body;
        const usernameCheck = await User.findOne({ username });
        if (usernameCheck)
            return res.json({
                message: "Username already used",
                status: false,
            });
        const emailCheck = await User.findOne({ email });
        if (emailCheck)
            return res.json({ message: "Email already used", status: false });
        const hashedPassword = await brcypt.hash(password, 10);
        const user = await User.create({
            email,
            username,
            password: hashedPassword,
        });
        delete user.password;
        return res.json({ status: true, user });
    } catch (error) {
        next();
    }
};

module.exports.login = async (req, res, next) => {
    try {
        const { username, password } = req.body;
        const users = await User.findOne({ username });
        if (!users)
            return res.json({
                message: "Incorrect username or password.",
                status: false,
            });
        const isPasswordValid = await brcypt.compare(password, users.password);
        if (!isPasswordValid)
            return res.json({
                message: "Incorrect username or password.",
                status: false,
            });
        const accessToken = generateAuthToken(users);
        const user = await User.findByIdAndUpdate(
            { _id: users.id },
            { token: accessToken },
            { new: true }
        ).select([
            "email",
            "username",
            "avatarImage",
            "_id",
            "token",
            "role",
            "isAvatarImageSet",
        ]);
        return res.json({ status: true, user });
    } catch (error) {
        next();
    }
};

module.exports.setAvatar = async (req, res, next) => {
    try {
        const userId = req.params.id;
        const avatarImage = req.body.image;
        const userData = await User.findByIdAndUpdate(userId, {
            isAvatarImageSet: true,
            avatarImage,
        });
        return res.json({
            isSet: userData.isAvatarImageSet,
            image: userData.avatarImage,
        });
    } catch (error) {
        next(error);
    }
};

module.exports.getAllUsers = async (req, res, next) => {
    try {
        const users = await User.find({ _id: { $ne: req.params.id } }).select([
            "email",
            "username",
            "avatarImage",
            "_id",
        ]);
        return res.json(users);
    } catch (error) {
        next(error);
    }
};
