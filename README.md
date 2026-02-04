![Work in Progress](https://media.giphy.com/media/ZVik7pBtu9dNS/giphy.gif)


```markdown
# 🏥 MediFlow AI - Telemedicine Scheduling Platform

**MediFlow AI** is a full-stack telemedicine application designed to streamline the appointment booking process between patients and doctors. It features a robust two-sided marketplace with real-time availability tracking, conflict detection, and role-based dashboards.

---

## 🚀 Features (Current MVP Status)

### 🧑‍🦱 **Patient Ecosystem**
* **Smart Booking System:** Interactive calendar with real-time slot availability.
* **Conflict Detection:** Booked slots automatically turn **RED** and become unclickable to prevent double-booking.
* **Dashboard:** View health stats, upcoming appointments, and appointment history.
* **Cancellation:** Ability to cancel appointments, immediately freeing up the slot for others.
* **Video Integration:** Auto-generated Google Meet links for every booking.

### 👨‍⚕️ **Doctor Ecosystem**
* **Dedicated Dashboard:** Secure login for medical professionals.
* **Live Schedule:** View all upcoming patient appointments in real-time.
* **Status Management:** Track pending and completed consultations.
* **Patient Insights:** View patient names and reasons for visits.

---

## 🛠️ Tech Stack

* **Frontend:** React (Vite), Tailwind CSS, Lucide React (Icons).
* **Backend:** Node.js, Express.js.
* **Database:** MongoDB Atlas (Cloud).
* **Authentication:** JWT (JSON Web Tokens) & Local Storage.

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
1.  **Node.js** (v18 or higher) - [Download Here](https://nodejs.org/)
2.  **Git** - [Download Here](https://git-scm.com/)
3.  **MongoDB Atlas URI** - You need a connection string from your MongoDB Cloud account.

---

## ⚙️ Installation & Setup Guide

Follow these steps exactly to run the project on **Mac** or **Windows**.

### **Step 1: Clone the Repository**
Open your Terminal (Mac) or Command Prompt/PowerShell (Windows) and run:

```bash
git clone <YOUR_GITHUB_REPO_URL_HERE>
cd mediflow-ai

```

---

### **Step 2: Backend Setup (Server)**

1. Navigate to the server folder:
```bash
cd server-node

```


2. Install dependencies:
```bash
npm install

```


3. **Configure Environment Variables:**
Create a new file named `.env` inside the `server-node` folder and paste the following:
```env
PORT=5001
MONGO_URI=your_mongodb_connection_string_here
JWT_SECRET=supersecretkey123

```


*(Replace `your_mongodb_connection_string_here` with your actual MongoDB URL).*
4. Start the Backend Server:
```bash
node server.js

```


*You should see: `✅ MongoDB Connected` and `🚀 Server running on port 5001*`

---

### **Step 3: Frontend Setup (Client)**

1. Open a **new** Terminal window (keep the backend running in the first one).
2. Navigate to the client folder:
```bash
cd client

```


3. Install dependencies:
```bash
npm install

```


4. Start the React Application:
```bash
npm run dev

```


*You should see a local URL, typically `http://localhost:5173`.*

---

## 🧪 How to Test the App

### **1. Patient Flow**

1. Open `http://localhost:5173` in your browser.
2. **Sign Up** as a new user (Role: Patient).
3. Go to the **Dashboard**.
4. Select a **Date** from the calendar.
5. **Book a Slot** (e.g., 10:00 AM).
* *Observation:* The slot is booked successfully.


6. Refresh the page and select the same date.
* *Observation:* The 10:00 AM button is now **RED** and disabled.



### **2. Doctor Flow**

1. Log out and **Sign Up** as a new user (Role: Doctor).
2. You will be redirected to the **Doctor Dashboard**.
3. Check "My Schedule".
* *Observation:* You should see the appointment created by the patient in step 1.



---

## 🐛 Troubleshooting

**1. "Slots are not turning red"**

* **Cause:** Old data in the database might have Timezone conflicts.
* **Fix:** Open MongoDB Compass, delete all documents in the `appointments` collection, and book a new slot. The system now uses strict String matching (`"YYYY-MM-DD"`) to prevent this.

**2. "Network Error" or "Connection Refused"**

* Ensure your Backend is running on port **5001**.
* Ensure your Frontend is trying to fetch from `http://localhost:5001`.

**3. "Login failed"**

* Check if your `MONGO_URI` in `.env` is correct.
* Ensure your IP address is whitelisted in MongoDB Atlas Network Access.

---

## 🔮 Future Roadmap (To-Do)

* [ ] **AI Analysis:** Integrate Gemini API to analyze uploaded lab reports.
* [ ] **Video Calls:** Embed Jitsi/WebRTC for in-app video calls.
* [ ] **Payments:** Stripe integration for paid consultations.

---

### 👨‍💻 Created by Solomon Pattapu

```

```
