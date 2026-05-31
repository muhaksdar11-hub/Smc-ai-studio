import admin from "firebase-admin";
import { Signal } from "../../shared/types.js";

let db: admin.firestore.Firestore | null = null;

export function getFirestoreDb(): admin.firestore.Firestore {
  if (db) return db;

  if (!admin.apps.length) {
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
       admin.initializeApp({
         credential: admin.credential.applicationDefault(),
         projectId: process.env.FIREBASE_PROJECT_ID
       });
       console.log("Firebase initialized via GOOGLE_APPLICATION_CREDENTIALS");
    } else {
       console.warn("Firebase not configured properly, running in memory-mode only.");
       // Throw error in production, but we keep running backend if possible
       // to avoid full crashes before the user can provide keys
    }
  }

  if (admin.apps.length > 0) {
     db = admin.firestore();
     return db;
  }
  
  throw new Error("Firestore DB not available.");
}

export async function saveSignal(signal: Signal) {
  try {
    const database = getFirestoreDb();
    const docRef = database.collection("signals").doc();
    signal.id = docRef.id;
    await docRef.set(signal);
    console.log(`Saved signal ${signal.id} to Firestore`);
  } catch (error: any) {
    console.error("Failed to save signal to Firestore:", error.message);
  }
}

export async function fetchLatestSignal(): Promise<Signal | null> {
  try {
    const database = getFirestoreDb();
    const snapshot = await database.collection("signals")
      .orderBy("created_at", "desc")
      .limit(1)
      .get();
      
    if (snapshot.empty) return null;
    return snapshot.docs[0].data() as Signal;
  } catch (error: any) {
    console.warn("Failed to fetch latest signal:", error.message);
    return null;
  }
}

export async function checkSystemStatus(): Promise<boolean> {
  try {
    const database = getFirestoreDb();
    await database.collection("system").doc("connection_test").set({
       status: "ok",
       last_check: new Date().toISOString()
    });
    return true;
  } catch (err: any) {
    return false;
  }
}
