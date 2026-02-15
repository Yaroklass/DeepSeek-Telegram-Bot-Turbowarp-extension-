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
                    },
                    {
                        opcode: "jsonGet",
                        blockType: Scratch.BlockType.REPORTER,
                        text: "JSON get [PATH] from [JSON]",
                        arguments: {
                            PATH: { type: Scratch.ArgumentType.STRING },
                            JSON: { type: Scratch.ArgumentType.STRING }
                        }
                    },
                    {
                        opcode: "jsonHas",
                        blockType: Scratch.BlockType.BOOLEAN,
                        text: "JSON has [PATH] in [JSON]",
                        arguments: {
                            PATH: { type: Scratch.ArgumentType.STRING },
                            JSON: { type: Scratch.ArgumentType.STRING }
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
            const r = await fetch(`https://api.telegram.org/bot${this.tg}/getUpdates`);
            return await r.text();
        }

        async sendMessage(args) {
            await fetch(`https://api.telegram.org/bot${this.tg}/sendMessage`, {
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
            const info = await fetch(
                `https://api.telegram.org/bot${this.tg}/getFile?file_id=${args.FILEID}`
            );
            const json = await info.json();
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

        jsonGet(args) {
            try {
                const obj = JSON.parse(args.JSON);
                return args.PATH.split(".").reduce((o, k) => (o ? o[k] : ""), obj) ?? "";
            } catch {
                return "";
            }
        }

        jsonHas(args) {
            try {
                const obj = JSON.parse(args.JSON);
                return args.PATH.split(".").every(k => (obj = obj?.[k]) !== undefined);
            } catch {
                return false;
            }
        }
    }

    Scratch.extensions.register(new DeepSeekTelegram());
})(Scratch);
