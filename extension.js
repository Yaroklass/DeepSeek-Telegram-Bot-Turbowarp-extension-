(function (Scratch) {
    let TELEGRAM_TOKEN = "";
    let DEEPSEEK_API_KEY = "";
    let LAST_UPDATE_ID = 0;
    let LAST_MESSAGE = null;

    function post(url, body, callback) {
        Scratch.vm.runtime.ioDevices.network.request({
            url: url,
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        }, (res) => {
            if (!res || !res.text) return callback(null);
            try {
                callback(JSON.parse(res.text));
            } catch (e) {
                callback(null);
            }
        });
    }

    class DeepSeekTelegram {
        getInfo() {
            return {
                id: "deepseektelegram",
                name: "DeepSeek Telegram Bot",
                blocks: [
                    {
                        opcode: "setTokens",
                        blockType: Scratch.BlockType.COMMAND,
                        text: "set Telegram token [TG] and DeepSeek key [DS]",
                        arguments: {
                            TG: { type: Scratch.ArgumentType.STRING },
                            DS: { type: Scratch.ArgumentType.STRING }
                        }
                    },
                    {
                        opcode: "getUpdates",
                        blockType: Scratch.BlockType.REPORTER,
                        text: "get Telegram updates"
                    },
                    {
                        opcode: "getLastMessageText",
                        blockType: Scratch.BlockType.REPORTER,
                        text: "last message text"
                    },
                    {
                        opcode: "getLastChatId",
                        blockType: Scratch.BlockType.REPORTER,
                        text: "last chat id"
                    },
                    {
                        opcode: "sendDeepSeekReply",
                        blockType: Scratch.BlockType.COMMAND,
                        text: "reply with DeepSeek to [MSG] for chat [CHAT]",
                        arguments: {
                            MSG: { type: Scratch.ArgumentType.STRING },
                            CHAT: { type: Scratch.ArgumentType.STRING }
                        }
                    },
                    {
                        opcode: "sendPlainMessage",
                        blockType: Scratch.BlockType.COMMAND,
                        text: "send message [MSG] to chat [CHAT]",
                        arguments: {
                            MSG: { type: Scratch.ArgumentType.STRING },
                            CHAT: { type: Scratch.ArgumentType.STRING }
                        }
                    }
                ]
            };
        }

        setTokens(args) {
            TELEGRAM_TOKEN = args.TG;
            DEEPSEEK_API_KEY = args.DS;
        }

        getUpdates() {
            if (!TELEGRAM_TOKEN) return "";

            post("http://localhost:3000/telegram/getUpdates", {
                token: TELEGRAM_TOKEN,
                offset: LAST_UPDATE_ID + 1
            }, (data) => {
                if (!data || !data.ok || !data.result || !data.result.length) return;
                const last = data.result[data.result.length - 1];
                LAST_UPDATE_ID = last.update_id;
                LAST_MESSAGE = last;
            });

            return LAST_MESSAGE ? JSON.stringify(LAST_MESSAGE) : "";
        }

        getLastMessageText() {
            if (!LAST_MESSAGE) return "";
            if (!LAST_MESSAGE.message || !LAST_MESSAGE.message.text) return "";
            return LAST_MESSAGE.message.text;
        }

        getLastChatId() {
            if (!LAST_MESSAGE) return "";
            if (!LAST_MESSAGE.message || !LAST_MESSAGE.message.chat) return "";
            return String(LAST_MESSAGE.message.chat.id);
        }

        sendDeepSeekReply(args) {
            if (!DEEPSEEK_API_KEY || !TELEGRAM_TOKEN) return;

            const prompt = args.MSG;
            const chatId = args.CHAT;

            post("http://localhost:3000/deepseek/chat", {
                apiKey: DEEPSEEK_API_KEY,
                prompt: prompt
            }, (dsData) => {
                if (!dsData || !dsData.choices || !dsData.choices.length) return;
                const answer = dsData.choices[0].message.content;

                post("http://localhost:3000/telegram/sendMessage", {
                    token: TELEGRAM_TOKEN,
                    chat_id: chatId,
                    text: answer
                }, () => {});
            });
        }

        sendPlainMessage(args) {
            if (!TELEGRAM_TOKEN) return;

            post("http://localhost:3000/telegram/sendMessage", {
                token: TELEGRAM_TOKEN,
                chat_id: args.CHAT,
                text: args.MSG
            }, () => {});
        }
    }

    Scratch.extensions.register(new DeepSeekTelegram());
})(Scratch);
