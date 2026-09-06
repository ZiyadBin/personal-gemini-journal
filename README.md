ReflectAI — AI Journal & Reflection Assistant

Write. Reflect. Grow.

ReflectAI is a private, AI-powered journaling and reflection application that combines personal writing, memories, photos, locations, and Gemini-powered conversations into one connected experience.

Instead of simply storing journal entries, ReflectAI helps users write about their experiences, reflect on them, discover patterns across their journal, and turn meaningful moments into visual memories.

🚀 Live Application

Live Demo:
https://reflectai-app.ai.studio/

Cloud Run Deployment:
https://reflectai-717152489335.us-west1.run.app

✨ Key Features

✍️ Write & Reflect

Create private journal entries and capture thoughts, experiences, and memories in a simple journaling interface.

🤖 Gemini Reflection Companion

Continue a meaningful conversation around a journal entry using Gemini. Users can ask questions, explore their thoughts, and gain a different perspective.

✨ AI Insights

Generate structured AI-powered insights from an individual reflection, including themes, emotions, observations, and perspectives.

🔎 Ask ReflectAI

Ask questions across your own saved reflections to discover recurring themes, patterns, and insights over time.

📸 Add Photos

Attach photos directly to journal entries to preserve the visual side of a memory.

📍 Remember the Place

Add a meaningful location to a reflection and connect an experience with where it happened.

🖼️ Share the Memories

Turn journal content and photos into visual memory cards displayed through a carousel. Users can revisit, download, and share their memories.

📱 Responsive & Installable

ReflectAI works across desktop, tablet, and mobile devices and supports an installable PWA experience.

🔐 Private by Design

Journal entries, interactions, and photos are scoped to the authenticated Firebase user. Users cannot access another user's private journal data.

🏗️ Architecture & Technology Stack

Component

Technology

Purpose

Frontend

React 19 + Vite + Tailwind CSS

Journaling interface, dashboard, history, AI interactions

Backend

Node.js + Express

Server-side API layer and Gemini request handling

Authentication

Firebase Authentication

Google Sign-In and user identity

Database

Cloud Firestore

Private journal entries, interactions, and metadata

File Storage

Firebase Cloud Storage

User-scoped journal photos

AI

Google Gemini via @google/genai

Reflection conversations and AI insights

Deployment

Google Cloud Run

Production application hosting

Secrets

Google Cloud Secret Manager / Environment Variables

Secure Gemini API credential management

Development

Google AI Studio

Application development and Gemini integration

🔄 Application Flow

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

🔐 Security & Data Isolation

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

☁️ Firestore Security Rules

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

🖼️ Firebase Cloud Storage Security Rules

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

⚙️ Configuration & Reproduction

1. Prerequisites

Install:

Node.js

npm

Firebase CLI

Google Cloud CLI

Authenticate with Google Cloud:

gcloud auth login

Set your project:

gcloud config set project YOUR_PROJECT_ID

2. Enable Required Google Cloud APIs

gcloud services enable   run.googleapis.com   secretmanager.googleapis.com   firestore.googleapis.com   identitytoolkit.googleapis.com

3. Clone the Repository

git clone https://github.com/ZiyadBin/personal-gemini-journal.git
cd personal-gemini-journal

4. Install Dependencies

npm install

5. Configure Firebase

Create/configure a Firebase project with:

Firebase Authentication

Google Sign-In provider

Cloud Firestore

Firebase Cloud Storage

Configure the Firebase web application credentials used by the frontend.

Enable Google Sign-In under:

Firebase Console
→ Authentication
→ Sign-in providers
→ Google

🔑 Gemini API Configuration

The Gemini API key must not be placed directly into frontend code.

For local development, create a .env file:

GEMINI_API_KEY="YOUR_GEMINI_API_KEY"

The .env file should remain local and must not be committed to GitHub.

The repository includes an .env.example file containing placeholders.

🛡️ Production Secret Management

For production deployment, store the Gemini API key in Google Cloud Secret Manager.

Create the secret:

gcloud secrets create GEMINI_API_KEY   --replication-policy="automatic"

Add the API key:

echo -n "YOUR_GEMINI_API_KEY" |   gcloud secrets versions add GEMINI_API_KEY   --data-file=-

Grant Cloud Run permission to access the secret:

PROJECT_NUMBER=$(gcloud projects describe   $(gcloud config get-value project)   --format='value(projectNumber)')

gcloud secrets add-iam-policy-binding GEMINI_API_KEY   --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"   --role="roles/secretmanager.secretAccessor"

💻 Local Development

Start the application:

npm run dev

The development server runs on:

http://localhost:3000

Verify the project:

npm run lint
npm run build

☁️ Google Cloud Run Deployment

ReflectAI is deployed as a containerized application on Google Cloud Run.

Build and deploy:

gcloud run deploy reflectai   --source .   --region us-west1   --platform managed   --allow-unauthenticated   --set-secrets GEMINI_API_KEY=GEMINI_API_KEY:latest   --port 3000

Current deployment:

Service: reflectai
Region: us-west1

🏷️ Challenge Verification Label

The Cloud Run service includes the required challenge verification label:

dev-tutorial=cloud-run-ai-challenge

It can be applied with:

gcloud run services update reflectai   --update-labels=dev-tutorial=cloud-run-ai-challenge   --region=us-west1

This label is required for automated verification of the Cloud Run deployment.

🤖 Gemini & AI Features

ReflectAI uses Google's Gemini models through the @google/genai SDK.

Gemini powers:

Reflection Companion

Provides contextual responses based on the user's current journal conversation.

AI Insights

Analyzes an individual journal reflection and produces structured insights.

Ask ReflectAI

Allows authenticated users to ask questions across their own saved reflections.

User data is scoped before being supplied to AI processing. ReflectAI does not intentionally send another user's private journal data to Gemini.

🧠 AI Model Resilience

The backend includes a fallback strategy for model availability and transient API failures.

The application can fall back between configured Gemini models when supported errors such as:

503 UNAVAILABLE
429 RESOURCE_EXHAUSTED

occur.

This helps maintain application availability during temporary model or quota issues.

🧪 Reproducing the Application

A new developer can reproduce the application by following these steps:

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

🌟 What Makes ReflectAI Different

The original journal experience provides the foundation for ReflectAI, but the project extends it into a broader reflection and memory platform.

The major custom additions include:

AI Reflection Companion

Structured AI Insights

Ask ReflectAI across personal journal history

Photo memories

Location-aware reflections

Visual memory carousel

Downloadable memory cards

Responsive PWA experience

User-scoped Firebase Cloud Storage

Server-side Gemini credential protection

AI model fallback handling

The goal is to make journaling more than simply recording what happened — ReflectAI helps users revisit, understand, and discover meaning in their experiences.

🛠️ Google AI Studio & Google Cloud

ReflectAI was developed using Google AI Studio for building and integrating the Gemini-powered experience.

The application combines:

Google Gemini

Firebase Authentication

Cloud Firestore

Firebase Cloud Storage

Google Cloud Run

Google Cloud Secret Manager

📹 Project Demonstration

A video walkthrough demonstrates the complete ReflectAI experience, including:

Google Sign-In

Creating a journal

Gemini AI Companion

AI Insights

Adding photos and locations

Dashboard and journal history

Ask ReflectAI

Memory carousel and sharing

Responsive/mobile journaling

Production application experience

Live Application:
https://reflectai-app.ai.studio/

📌 Challenge Submission

Project: ReflectAI
Tagline: Write. Reflect. Grow.
Platform: Google Gen AI Academy APAC Edition — Cohort 3
Deployment: Google Cloud Run
AI: Google Gemini
Authentication: Firebase Authentication
Database: Cloud Firestore
Storage: Firebase Cloud Storage

Challenge Label:

dev-tutorial=cloud-run-ai-challenge

Hashtag:

#AccelerateAIwithCloudRun

📄 License

This project was created as part of the Google Gen AI Academy APAC Edition — Cohort 3 ideathon.
