// public/firebase-messaging-sw.js

// We use the 'compat' versions of Firebase for the service worker
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

const firebaseConfig = {
    apiKey: "AIzaSyCJGqW6781mz3KTwILFhOzatkiNNxavcjw",
    authDomain: "mumbai-weather-app.firebaseapp.com",
    projectId: "mumbai-weather-app",
    storageBucket: "mumbai-weather-app.firebasestorage.app",
    messagingSenderId: "345320590893",
    appId: "1:345320590893:web:765c47d5cd6ab402c232a4"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);

    // Customize notification here
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: '/img/heavy-rain.png',
        badge: '/img/heavy-rain.png',
        data: payload.data,
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle clicking the notification when app is closed
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const clickUrl = event.notification.data?.url || '/';
    event.waitUntil(
        clients.openWindow(clickUrl)
    );
});