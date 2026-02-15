(function (Scratch) {
    class DeepSeekTelegram {
        constructor() {
            this.tg = "";
            this.ds = "";
        }

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
                        text: "get Telegram updates (JSON)"
                    },
                    {
                        opcode: "sendMessage",
                        blockType: Scratch.BlockType.COMMAND,
                        text: "send message [MSG] to chat [CHAT]",
                        arguments: {
                            MSG: { type: Scratch.ArgumentType.STRING },
                            CHAT: { type: Scratch.ArgumentType.STRING }
                        }
                    },
                    {
                        opcode: "deepseekReply",
                        blockType: Scratch.BlockType.REPORTER,
                        text: "DeepSeek reply to [MSG]",
                        arguments: {
                            MSG: { type: Scratch.ArgumentType.STRING }
                        }
                    },
                    {
                        opcode: "getPhotoBase64",
                        blockType: Scratch.BlockType.REPORTER,
                        text: "download Telegram photo [FILEID]",
                        arguments: {
                            FILEID: { type: Scratch.ArgumentType.STRING }
                        }
                    }
                ]
            };
        }

        setTokens(args) {
            this.tg = args.TG;
            this.ds = args.DS;
        }

        async getUpdates() {
            const url = `https://api.telegram.org/bot${this.tg}/getUpdates`;
            const r = await fetch(url);
            return await r.text();
        }

        async sendMessage(args) {
            const url = `https://api.telegram.org/bot${this.tg}/sendMessage`;
            await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: `chat_id=${args.CHAT}&text=${encodeURIComponent(args.MSG)}`
            });
        }

        async deepseekReply(args) {
            const r = await fetch("https://api.deepseek.com/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${this.ds}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    model: "deepseek-chat",
                    messages: [{ role: "user", content: args.MSG }]
                })
            });
            return await r.text();
        }

        async getPhotoBase64(args) {
            const fileInfo = await fetch(
                `https://api.telegram.org/bot${this.tg}/getFile?file_id=${args.FILEID}`
            );
            const json = await fileInfo.json();
            const path = json.result.file_path;

            const file = await fetch(
                `https://api.telegram.org/file/bot${this.tg}/${path}`
            );
            const blob = await file.blob();

            return await new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.readAsDataURL(blob);
            });
        }
    }

    Scratch.extensions.register(new DeepSeekTelegram());
})(Scratch);
