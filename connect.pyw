import os
import time
import requests
from urllib.parse import unquote

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
COMMAND_FILE = os.path.join(BASE_DIR, "command.txt")
RESPONSE_FILE = os.path.join(BASE_DIR, "response.txt")

TELEGRAM_API_BASE = "https://api.telegram.org/bot"
DEEPSEEK_API_URL = "https://api.deepseek.com/chat/completions"

def parse_command(line):
    parts = line.strip().split("|")
    if not parts:
        return None, {}
    cmd_type = parts[0]
    args = {}
    for p in parts[1:]:
        if "=" in p:
            k, v = p.split("=", 1)
            args[k] = unquote(v)
    return cmd_type, args

def handle_get_updates(token, offset):
    url = f"{TELEGRAM_API_BASE}{token}/getUpdates"
    try:
        r = requests.get(url, params={"offset": int(offset)}, timeout=10)
        return r.text
    except Exception:
        return '{"ok":false,"result":[]}'

def handle_send_message(token, chat_id, text):
    url = f"{TELEGRAM_API_BASE}{token}/sendMessage"
    try:
        r = requests.post(url, data={"chat_id": chat_id, "text": text}, timeout=10)
        return r.text
    except Exception:
        return '{"ok":false}'

def handle_deepseek_chat(api_key, prompt, chat_id):
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": "deepseek-chat",
        "messages": [
            {"role": "user", "content": prompt}
        ]
    }
    try:
        r = requests.post(DEEPSEEK_API_URL, json=payload, headers=headers, timeout=30)
        return r.text
    except Exception:
        return '{"error":"deepseek_failed"}'

def main_loop():
    while True:
        if os.path.exists(COMMAND_FILE):
            try:
                with open(COMMAND_FILE, "r", encoding="utf-8") as f:
                    line = f.read()
                if line.strip():
                    cmd_type, args = parse_command(line)
                    result = ""
                    if cmd_type == "GET_UPDATES":
                        result = handle_get_updates(args.get("token", ""), args.get("offset", "0"))
                    elif cmd_type == "SEND_MESSAGE":
                        result = handle_send_message(args.get("token", ""), args.get("chat_id", ""), args.get("text", ""))
                    elif cmd_type == "DEEPSEEK_CHAT":
                        result = handle_deepseek_chat(args.get("api_key", ""), args.get("prompt", ""), args.get("chat_id", ""))
                    with open(RESPONSE_FILE, "w", encoding="utf-8") as rf:
                        rf.write(result)
                # очищаем команду
                os.remove(COMMAND_FILE)
            except Exception:
                try:
                    if os.path.exists(COMMAND_FILE):
                        os.remove(COMMAND_FILE)
                except Exception:
                    pass
        time.sleep(0.05)

if __name__ == "__main__":
    main_loop()
