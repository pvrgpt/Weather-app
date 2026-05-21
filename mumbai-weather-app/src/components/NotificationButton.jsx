import React, { useState, useEffect } from 'react';
import { FiBell } from 'react-icons/fi';

const NotificationButton = () => {
    const [showButton, setShowButton] = useState(false);
    const [oneSignalInstance, setOneSignalInstance] = useState(null);

    useEffect(() => {
        window.OneSignalDeferred = window.OneSignalDeferred || [];
        
        // Helper function to wait until OneSignal and its User sub-properties are initialized
        const checkOneSignalReady = () => {
            return new Promise((resolve) => {
                const interval = setInterval(() => {
                    const OneSignal = window.OneSignal;
                    if (OneSignal && OneSignal.User && OneSignal.User.pushSubscription) {
                        clearInterval(interval);
                        resolve(OneSignal);
                    }
                }, 100); // Check every 100ms
            });
        };

        window.OneSignalDeferred.push(async function () {
            try {
                const OneSignal = await checkOneSignalReady();
                setOneSignalInstance(OneSignal);

                const isOptedIn = OneSignal.User.pushSubscription.optedIn;
                console.log("⚡ OneSignal fully initialized. Is Opted In:", isOptedIn);
                console.log("Subscription ID:", OneSignal.User.pushSubscription.id);

                // Show the button if they are not subscribed
                if (!isOptedIn) {
                    setShowButton(true);
                }

                // Listen for subscription changes
                OneSignal.User.pushSubscription.addEventListener("change", (event) => {
                    console.log("Subscription changed:", event.current);
                    if (event.current?.token) {
                        console.log("✅ Successfully subscribed! ID:", event.current.id);
                        setShowButton(false);
                    }
                });

            } catch (error) {
                console.error("Error during OneSignal initialization:", error);
            }
        });
    }, []);

    const handleSubscribe = async () => {
        if (!oneSignalInstance) {
            console.warn("OneSignal is not ready yet.");
            return;
        }

        console.log("🔔 Button clicked! Requesting native permission...");
        try {
            await oneSignalInstance.Notifications.requestPermission();
        } catch (error) {
            console.error("Error requesting permission:", error);
        }
    };

    if (!showButton) return null;

    return (
        <div className="flex justify-center mb-6">
            <button
                onClick={handleSubscribe}
                className="flex items-center gap-2 px-6 py-3 bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400/40 backdrop-blur-md rounded-full shadow-[0_0_15px_rgba(14,165,233,0.2)] transition-all duration-300 text-sky-200 font-semibold active:scale-95"
            >
                <FiBell className="w-5 h-5 animate-bounce" />
                Get Live Weather Alerts
            </button>
        </div>
    );
};

export default NotificationButton;