(function(Scratch) {
    let TELEGRAM_TOKEN = "";
    let DEEPSEEK_API_KEY = "";
    let LAST_UPDATE_ID = 0;

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

        async getUpdates() {
            if (!TELEGRAM_TOKEN) return "";
            const res = await fetch("http://localhost:3000/telegram/getUpdates", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    token: TELEGRAM_TOKEN,
                    offset: LAST_UPDATE_ID + 1
                })
            });
            const data = await res.json();
            if (!data.ok || !data.result || !data.result.length) return "";
            const last = data.result[data.result.length - 1];
            LAST_UPDATE_ID = last.update_id;
            this._lastMessage = last;
            return JSON.stringify(data.result);
        }

        getLastMessageText() {
            if (!this._lastMessage) return "";
            if (!this._lastMessage.message || !this._lastMessage.message.text) return "";
            return this._lastMessage.message.text;
        }

        getLastChatId() {
            if (!this._lastMessage) return "";
            if (!this._lastMessage.message || !this._lastMessage.message.chat || !this._lastMessage.message.chat.id) return "";
            return String(this._lastMessage.message.chat.id);
        }

        async sendDeepSeekReply(args) {
            if (!DEEPSEEK_API_KEY || !TELEGRAM_TOKEN) return;
            const prompt = args.MSG;
            const chatId = args.CHAT;

            const dsRes = await fetch("http://localhost:3000/deepseek/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    apiKey: DEEPSEEK_API_KEY,
                    prompt
                })
            });

            const dsData = await dsRes.json();
            if (!dsData.choices || !dsData.choices.length) return;
            const answer = dsData.choices[0].message.content;

            await fetch("http://localhost:3000/telegram/sendMessage", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    token: TELEGRAM_TOKEN,
                    chat_id: chatId,
                    text: answer
                })
            });
        }

        async sendPlainMessage(args) {
            if (!TELEGRAM_TOKEN) return;
            const msg = args.MSG;
            const chatId = args.CHAT;

            await fetch("http://localhost:3000/telegram/sendMessage", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    token: TELEGRAM_TOKEN,
                    chat_id: chatId,
                    text: msg
                })
            });
        }
    }

    Scratch.extensions.register(new DeepSeekTelegram());
})(Scratch);
