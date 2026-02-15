import os
import time
import requests

BASE = os.path.dirname(os.path.abspath(__file__))
BRIDGE = os.path.join(BASE, "bridge.txt")
RESP = os.path.join(BASE, "response.txt")

TG_TOKEN = ""
DS_KEY = ""

def send_tg_message(chat, text):
    url = f"https://api.telegram.org/bot{TG_TOKEN}/sendMessage"
    try:
        r = requests.post(url, data={"chat_id": chat, "text": text})
        return r.text
    except:
        return "TG_ERROR"

def get_updates():
    url = f"https://api.telegram.org/bot{TG_TOKEN}/getUpdates"
    try:
        r = requests.get(url)
        return r.text
    except:
        return "TG_ERROR"

def deepseek(prompt):
    url = "https://api.deepseek.com/chat/completions"
    headers = {"Authorization": f"Bearer {DS_KEY}", "Content-Type": "application/json"}
    data = {"model": "deepseek-chat", "messages": [{"role": "user", "content": prompt}]}
    try:
        r = requests.post(url, json=data, headers=headers)
        return r.text
    except:
        return "DS_ERROR"

def write_response(text):
    with open(RESP, "w", encoding="utf-8") as f:
        f.write(text)

def wait_bridge():
    while True:
        if os.path.exists(BRIDGE):
            with open(BRIDGE, "r", encoding="utf-8") as f:
                data = f.read().strip()
            os.remove(BRIDGE)
            return data
        time.sleep(0.05)

if __name__ == "__main__":
    while True:
        cmd = wait_bridge()
        parts = cmd.split("|")

        if parts[0] == "SET_TOKENS":
            TG_TOKEN = parts[1]
            DS_KEY = parts[2]
            write_response("OK")

        elif parts[0] == "GET_UPDATES":
            write_response(get_updates())

        elif parts[0] == "SEND_MESSAGE":
            chat = parts[1]
            msg = parts[2]
            write_response(send_tg_message(chat, msg))

        elif parts[0] == "DEEPSEEK":
            prompt = parts[1]
            write_response(deepseek(prompt))

