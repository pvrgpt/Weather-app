import React, { useState, useEffect } from 'react';
import { messaging, db } from '../firebase';
import { getToken, onMessage } from 'firebase/messaging';
import { doc, setDoc } from 'firebase/firestore'; // Changed imports here!
import { FiBell } from 'react-icons/fi';

const VAPID_KEY = "BP6CcordpR5H-QI5fgwjo-YDGZR85ZOyrdGvLu1TezFSh9hTy-IQ2omX_PjO_sJ8v3-FTj35PxmYhAZyhuaDxBQ"; // <-- Paste your key here again

const NotificationManager = () => {
    const [permission, setPermission] = useState('default');
    const [loading, setLoading] = useState(false);

    // FIXED: No longer tries to "read" the database. Just writes/updates securely.
    const saveTokenToDatabase = async () => {
        try {
            const token = await getToken(messaging, { vapidKey: VAPID_KEY });
            if (token) {
                // We use the actual token string as the Document ID!
                const tokenRef = doc(db, 'fcmTokens', token);

                // setDoc with { merge: true } creates it if new, or just updates it if it exists
                await setDoc(tokenRef, {
                    token: token,
                    updatedAt: new Date(),
                    deviceType: navigator.userAgent
                }, { merge: true });

                console.log('Token saved securely to Firestore.');
            }
        } catch (error) {
            console.error('Error saving token:', error);
        }
    };

    useEffect(() => {
        if ('Notification' in window) {
            setPermission(Notification.permission);

            // If permission was already granted previously, silently ensure token is saved
            if (Notification.permission === 'granted') {
                saveTokenToDatabase();
            }
        }

        // Listen for messages while the app is OPEN
        const unsubscribe = onMessage(messaging, (payload) => {
            console.log('Message received in foreground: ', payload);
            alert(`New Weather Update: ${payload.notification.title}\n${payload.notification.body}`);
        });

        return () => unsubscribe();
    }, []);

    const requestPermission = async () => {
        setLoading(true);
        try {
            const currentPermission = await Notification.requestPermission();
            setPermission(currentPermission);

            if (currentPermission === 'granted') {
                await saveTokenToDatabase();
            }
        } catch (error) {
            console.error('Notification permission error:', error);
        } finally {
            setLoading(false);
        }
    };

    if (permission === 'granted' || permission === 'denied') return null;

    return (
        <div className="flex justify-center mb-6">
            <button
                onClick={requestPermission}
                disabled={loading}
                className="flex items-center gap-2 px-5 py-3 bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-400/30 backdrop-blur-md rounded-full shadow-lg transition-all duration-300 text-indigo-200 font-medium active:scale-95"
            >
                {loading ? (
                    <svg className="animate-spin h-5 w-5 text-indigo-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                ) : (
                    <FiBell className="w-5 h-5" />
                )}
                Enable Weather Alerts
            </button>
        </div>
    );
};

export default NotificationManager;