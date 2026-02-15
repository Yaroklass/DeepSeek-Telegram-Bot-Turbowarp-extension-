import time
import os

BASE = os.path.dirname(os.path.abspath(__file__))
CMD = os.path.join(BASE, "command.txt")
RESP = os.path.join(BASE, "response.txt")

def wait_for_command():
    while True:
        if os.path.exists(CMD):
            with open(CMD, "r", encoding="utf-8") as f:
                data = f.read().strip()
            os.remove(CMD)
            return data
        time.sleep(0.05)

def write_response(text):
    with open(RESP, "w", encoding="utf-8") as f:
        f.write(text)

if __name__ == "__main__":
    print("server.py running...")
    while True:
        cmd = wait_for_command()
        # server.py просто передаёт команду connect.pyw
        with open("bridge.txt", "w", encoding="utf-8") as f:
            f.write(cmd)
