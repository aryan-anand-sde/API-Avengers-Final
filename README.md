# 🧪 Alchemist's Grimoire

## [API Avengers (Team: 734)](#our-team)

A magical web application for medicine scheduling and wellness tracking, designed to ensure performers never miss a vital dose of their elixirs.  
This project was created for **[WEBSTER 2025](https://computercodingclub.in/codesangam)**.

## 📖 Table of Contents

- [About The Project](#about-the-project)
- [✨Features](#features)
- [🛠️Built With](#built-with)
- [🚀Getting Started](#getting-started)
- [⚙️Usage](#usage)
- [🤝Our Team](#our-team)
- [📷Screenshots](#screenshots)

## About The Project

In the bustling world of the circus, performers rely on vital potions and elixirs to stay safe and strong. However, keeping track of complex dosage schedules is a challenge, and missing a dose can put their health and the entire show at risk.

**Alchemist's Grimoire** is a magical tool built to solve this problem. It provides a simple, friendly system that helps users manage their medication schedules, receive timely reminders from the "Circus Crier," and visualize their adherence over time on the "Wellness Rate" dashboard.

## Features

### Core Features

- **Medicine Scheduling**: Easily create, edit, and delete medication schedules, specifying the pill name, dosage, time, and frequency.
- **Reminder System**: Receive timely "Circus Crier" reminders via Email & Whatsapp notifications to never miss a dose.
- **Dose Logging**: A simple interface to log whether a dose was taken or missed, helping users keep an accurate record.
- **Intuitive Dashboard**: A user-friendly dashboard provides a clear view of all upcoming and past reminders at a glance.
- **Wellness Tracking**: Visualize your health journey with the "Wellness Rate" dashboard, featuring graphs and charts on adherence rates and trends over time.

## Built With

This project leverages modern technologies to deliver a reliable and magical user experience.

### Backend

- **Node.js** : As the JavaScript runtime environment for our server.
- **Express.js** : A minimal and flexible Node.js web application framework for building our RESTful APIs.
- **MongoDB** : A NoSQL database to store user profiles, medication schedules, and wellness logs.
- **Mongoose** : An elegant MongoDB object modeling library for Node.js, used to define schemas and interact with our database.
- **Nodemailer** : The module for our Node.js application to send emails for the "Circus Crier" reminders.

### Frontend

- **HTML** : For the structure and content of the web application.
- **CSS** : For styling and creating a visually appealing, responsive layout.
- **JavaScript** : For handling user interactions, DOM manipulation, and frontend logic.
- **Chart.js** : For rendering beautiful and responsive charts on the Wellness dashboard.

### External APIs & Services

- **SendGrid API** : Used for delivering reliable and high-deliverability email notifications.
- **Google Calendar API** : Powers the integration with Google Calendar for seamless schedule syncing.

## Getting Started

To get a local copy up and running, make sure you have **Node.js and npm** installed on your system:

### Installation

1.  **Clone the repository :**
    ```sh
    git clone https://github.com/Manas-Agnihotri-MNNIT/API--Avengers.git
    ```
2.  **Navigate to the backend directory and build the project :**
    ```sh
    cd /backend
    npm install
    ```
3.  **Navigate to the frontend directory and install dependencies :**
    ```sh
    cd ../frontend
    npm install
    ```
4.  **Configure Environment Variables:**
    Create a `.env` file and add your API keys for SendGrid and Google Calendar API.
    ```
    SENDGRID_API_KEY='YOUR_API_KEY'
    GOOGLE_CLIENT_ID='YOUR_CLIENT_ID'
    GOOGLE_CLIENT_SECRET='YOUR_CLIENT_SECRET'
    ```
5.  **Run the application:**
    - Start the backend server from your IDE or using the command line: `nodemon server.js`

## Usage

The application provides a seamless flow for managing medication:

1.  **Onboarding**: A new user signs up for a secure account.
2.  **Schedule Setup**: The user adds their medications, specifying details like name, dosage, frequency, time, and Email for reminder.
3.  **Dashboard**: Upon logging in, the user sees a clean dashboard with upcoming and past reminders.
4.  **Notifications**: At the scheduled time, Email & Whatsapp notification is sent.
5.  **Logging**: The user logs the dose as taken or missed.
6.  **Tracking**: Progress and adherence can be viewed on the "Wellness Rate" dashboard at any time.

## Our Team

This project was magically conjured by the **API Avengers** (Team ID: 734).

| Member Name     | GitHub Profile                                           |
| --------------- | -------------------------------------------------------- |
| Aryan Anand     | [visit GitHub](https://github.com/aryan-anand-sde)       |
| Ramling Hule    | [visit GitHub](https://github.com/Ramling-hule)          |
| Manas Agnihotri | [visit GitHub](https://github.com/Manas-Agnihotri-MNNIT) |

# Screenshots

> Home Page :
> ![](/assets/Home%201.png)

> Home Page :
> ![](/assets/Home%202.png)

> Sign Up Page :
> ![](/assets/SignUp.png)

> Sign In Page :
> ![](/assets/SignIn.png)

> Login Successful Page :
> ![](/assets/Login%20Succesful.png)

> Dashboard Page :
> ![](/assets/Dashboard%20add.png)

> Dashboard Page :
> ![](/assets/Dashboard%20show.png)

> Medications Page :
> ![](/assets/Medications.png)

# Event Tag :

> > > ![CodeSangam 2025](/assets/title%20image.png)

---

---

---
