const Messages = require("../models/messageModel");

module.exports.getMessages = async (req, res, next) => {
    try {
        /*from : id của người gửi , to id của người nhận*/
        const { from, to } = req.body;
        /* users là một array lưu id của nhiều người */
        const messages = await Messages.find({
            users: {
                $all: [from, to],
            },
        }).sort({ updatedAt: 1 });
        /* Map qua mảng trên message và trả về fromSelf: ì của người gửi và nội dung */
        const projectedMessages = messages.map((msg) => {
            return {
                fromSelf: msg.sender.toString() === from,
                message: msg.message.text,
            };
        });
        res.json(projectedMessages);
    } catch (ex) {
        next(ex);
    }
};

module.exports.addMessage = async (req, res, next) => {
    try {
        const { from, to, message } = req.body;
        const data = await Messages.create({
            message: { text: message },
            users: [from, to],
            sender: from,
        });

        if (data) return res.json({ msg: "Message added successfully." });
        else return res.json({ msg: "Failed to add message to the database" });
    } catch (ex) {
        next(ex);
    }
};
