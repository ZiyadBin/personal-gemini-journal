# 📰 ReflectAI — AI Journal & Reflection Assistant

<p align="center">
  <strong>Write. Reflect. Grow.</strong>
</p>

<p align="center">
  A private AI-powered space to capture thoughts, preserve memories, and discover new perspectives.
</p>

<p align="center">
  <a href="https://reflectai-app.ai.studio/">✨ Live Demo</a>
  ·
  <a href="https://github.com/ZiyadBin/personal-gemini-journal">💻 Source Code</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white" alt="React 19">
  <img src="https://img.shields.io/badge/Gemini-AI-4285F4?logo=google&logoColor=white" alt="Gemini AI">
  <img src="https://img.shields.io/badge/Firebase-Auth%20%7C%20Firestore%20%7C%20Storage-FFCA28?logo=firebase&logoColor=black" alt="Firebase">
  <img src="https://img.shields.io/badge/Cloud%20Run-Deployed-4285F4?logo=googlecloud&logoColor=white" alt="Google Cloud Run">
</p>

ReflectAI is a private, AI-powered journaling and reflection application that combines personal writing, memories, photos, locations, and Gemini-powered conversations into one connected experience.

Instead of simply storing journal entries, ReflectAI helps users write about their experiences, reflect on them, discover patterns across their journal, and turn meaningful moments into visual memories.

## 🚀 Live Application

Live Demo:
https://reflectai-app.ai.studio/

Cloud Run Deployment:
https://reflectai-717152489335.us-west1.run.app

## 💫 Key Features

### ✍️ Write & Reflect

Create private journal entries and capture thoughts, experiences, and memories in a simple journaling interface.

### 🤖 Gemini Reflection Companion

Continue a meaningful conversation around a journal entry using Gemini. Users can ask questions, explore their thoughts, and gain a different perspective.

### ✨ AI Insights

Generate structured AI-powered insights from an individual reflection, including themes, emotions, observations, and perspectives.

### 🔎 Ask ReflectAI

Ask questions across your own saved reflections to discover recurring themes, patterns, and insights over time.

### 📸 Add Photos

Attach photos directly to journal entries to preserve the visual side of a memory.

### 📍 Remember the Place

Add a meaningful location to a reflection and connect an experience with where it happened.

### 🖼️ Share the Memories

Turn journal content and photos into visual memory cards displayed through a carousel. Users can revisit, download, and share their memories.

### 📱 Responsive & Installable

ReflectAI works across desktop, tablet, and mobile devices and supports an installable PWA experience.

### 🔐 Private by Design

Journal entries, interactions, and photos are scoped to the authenticated Firebase user. Users cannot access another user's private journal data.

## 🔄 Application Flow

User
 │
 ▼
ReflectAI Web Application
 │
 ├── Firebase Authentication
 │       └── Google Sign-In
 │
 ├── Cloud Firestore
 │       └── Private journal data
 │
 ├── Firebase Cloud Storage
 │       └── Private journal photos
 │
 ▼
Express Backend
 │
 └── Gemini API
        ├── Reflection Companion
        ├── AI Insights
        └── Ask ReflectAI

The Gemini API key is handled server-side and is not exposed to the browser.

## 🔐 Security & Data Isolation

ReflectAI uses authenticated, user-scoped access for personal journal data.

Each user's data is stored under their Firebase Authentication UID:

users/{userId}/
    reflections/{reflectionId}
    interactions/{interactionId}
    reflections/{reflectionId}/photos/{photoId}

Firestore security rules verify that the authenticated user's UID matches the requested userId.

Photos are stored in Firebase Cloud Storage using the same user-scoped structure.

The application does not query all users' private journal data and filter it on the client.

Gemini requests are handled through the server-side backend so the Gemini API credential is not exposed in frontend code.

## ☁️ Firestore Security Rules

Create a firestore.rules file:

rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    match /users/{userId} {
      allow read, write: if request.auth != null
                         && request.auth.uid == userId;

      match /reflections/{reflectionId} {
        allow read, write: if request.auth != null
                           && request.auth.uid == userId;

        match /photos/{photoId} {
          allow read, write: if request.auth != null
                             && request.auth.uid == userId;
        }
      }

      match /interactions/{interactionId} {
        allow read, write: if request.auth != null
                           && request.auth.uid == userId;
      }
    }
  }
}

Deploy the rules:

firebase deploy --only firestore:rules

## 🖼️ Firebase Cloud Storage Security Rules

Create a storage.rules file:

rules_version = '2';

service firebase.storage {
  match /b/{bucket}/o {

    match /{allPaths=**} {
      allow read, write: if false;
    }

    match /users/{userId}/reflections/{reflectionId}/photos/{photoId} {

      allow read: if request.auth != null
                  && request.auth.uid == userId;

      allow write: if request.auth != null
                   && request.auth.uid == userId
                   && request.resource.size < 15 * 1024 * 1024
                   && request.resource.contentType.matches('image/.*');

      allow delete: if request.auth != null
                    && request.auth.uid == userId;
    }
  }
}

Deploy:

firebase deploy --only storage

## 🧪 Reproducing the Application

A developer can reproduce the application by following these steps:

1. Clone the repository
        ↓
2. Install dependencies
        ↓
3. Create/configure Firebase project
        ↓
4. Enable Google Authentication
        ↓
5. Configure Firestore
        ↓
6. Configure Cloud Storage
        ↓
7. Deploy Firestore + Storage security rules
        ↓
8. Configure GEMINI_API_KEY
        ↓
9. Run npm run dev
        ↓
10. Run lint/build checks
        ↓
11. Configure Secret Manager for production
        ↓
12. Deploy to Cloud Run

## 🤖 Gemini & AI Features

ReflectAI uses Google's Gemini models through the @google/genai SDK.

Gemini powers:

Reflection Companion

Provides contextual responses based on the user's current journal conversation.

AI Insights

Analyzes an individual journal reflection and produces structured insights.

Ask ReflectAI

Allows authenticated users to ask questions across their own saved reflections.

User data is scoped before being supplied to AI processing. ReflectAI does not intentionally send another user's private journal data to Gemini.

## 🌱 The Idea

ReflectAI is built around a simple thought:

Journaling shouldn't end when you finish writing.

It can help you revisit a moment, understand what you felt, notice patterns over time, and preserve the memories that matter.

<p align="center">
  <strong>ReflectAI · Your thoughts. A new perspective.</strong><br>
  <sub>Built for the Google Gen AI Academy APAC Edition — Cohort 3</sub>
</p>

📄 License

This project was created as part of the Google Gen AI Academy APAC Edition — Cohort 3 ideathon.
