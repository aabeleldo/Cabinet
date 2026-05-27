# Smart Cabinet

A full-stack IoT system that tracks pantry inventory in real time using RFID and weight sensing. Built with an ESP32 microcontroller, a Node.js backend, a MongoDB database, and a React Native mobile app.

---

## Overview

Smart Cabinet identifies containers placed inside a cabinet using RFID tags and measures their contents by weight using a load cell. The data is sent over WiFi to a backend server, stored in MongoDB, and displayed in a mobile app. The app also matches current inventory against a recipe database to show what meals you can make right now.

---

## System Architecture

```
ESP32 (RFID + Load Cell)
        │
        │  HTTP POST (WiFi)
        ▼
Node.js Backend (Express + MongoDB)
        │
        │  REST API
        ▼
React Native App (Expo)
```

---

## Hardware

- ESP32 microcontroller
- MFRC522 RFID reader + RFID tags (one per container)
- HX711 load cell amplifier + load cell
- Local WiFi network

---

## Project Structure

```
cabinet/
├── esp32/               # PlatformIO firmware (C++)
│   └── src/main.cpp
├── cabinet-backend/     # Node.js + Express REST API
│   └── seed.js          # MongoDB recipe seeder
└── cabinet-app/         # React Native mobile app (Expo)
    └── app/(tabs)/
        ├── index.tsx    # Pantry screen
        └── recipes.tsx  # Recipe matching screen
```

---

## Features

- Real-time container weight tracking via load cell
- RFID-based container identification
- Automatic data sync every 5 seconds in the mobile app
- Name containers from the app by RFID tag
- Recipe matching — shows which recipes you can make based on what's in your cabinet
- Low stock indicator when a container drops below 100g

---


## Environment Variables

Each part of the project requires its own config file. See the `.example` files in each folder for the required variables.

| File | Location | Purpose |
|------|----------|---------|
| `secrets.h` | `esp32/src/` | WiFi credentials, server URL |
| `.env.local` | `cabinet-backend/` | MongoDB connection string |
| `.env.local` | `cabinet-app/` | Backend server URL |

---

## Built With

- **ESP32** — WiFi-enabled microcontroller
- **PlatformIO** — Embedded development platform
- **MFRC522v2** — RFID library
- **HX711** — Load cell library
- **Node.js + Express** — REST API backend
- **MongoDB Atlas** — Cloud database
- **React Native + Expo** — Cross-platform mobile app

---

## Author

**Aabel Eldo**
