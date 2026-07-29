# StudyBuddy OS

> A privacy-first, mobile-native Student Operating System. Your academic progress lives entirely in your browser's local storage — no servers, no accounts, no data tracking.

---

## Features

- **100% Private** — all data stays in your browser's local storage, nothing is ever sent anywhere
- **No Accounts, No Sign-Up** — open it and start using it
- **Mobile-Native Feel** — add it to your Home Screen for a full app-like experience
- **Lightweight** — runs from a single local Python server, no dependencies to install

---

## Requirements

- Python 3.7 or later
- A modern browser (Safari, Chrome, Firefox, Edge)

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/JOHNBLAK/StudyBuddy-OS.git
cd StudyBuddy-OS
```

### 2. Start the local server

Pick the instructions for your platform below. The app runs on **port 7000**.

#### 🐧 Linux

```bash
python3 start.py
```

If Python isn't installed:

```bash
sudo apt update && sudo apt install python3 -y
python3 start.py
```

#### 🍎 macOS

```bash
python3 start.py
```

macOS usually ships with Python 3. If the command isn't found:

```bash
brew install python3
python3 start.py
```

#### 📱 Termux (Android)

```bash
pkg update && pkg upgrade -y
pkg install python git -y
git clone https://github.com/JOHNBLAK/StudyBuddy-OS.git
cd StudyBuddy-OS
python start.py
```

### 3. Open StudyBuddy OS

Once the server is running, open your browser and go to:

```
http://localhost:7000
```

### 4. Stop the server

Press `Ctrl + C` in the terminal window running the server.

---

## Alternative: Built-in Python HTTP Server

If you ever want to serve the app without `start.py`, Python's built-in module works too:

```bash
python3 -m http.server 7000
```

Then visit `http://localhost:7000` the same way.

---

## Add to Home Screen (Mobile)

For the full native-app experience on your phone:

1. Open `http://localhost:7000` in your mobile browser
2. Tap **Share** → **Add to Home Screen**
3. Launch StudyBuddy OS from your home screen like any other app

---

## Privacy

StudyBuddy OS does not use a backend database or external API. All progress, notes, and tracking data are stored locally on your device via browser `localStorage`. Clearing your browser data will reset the app.

---

## License

This project is open source.
