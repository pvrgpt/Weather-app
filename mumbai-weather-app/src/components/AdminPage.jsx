// src/components/AdminPage.jsx
import React, { useState, useEffect } from 'react';
import { db, auth, storage } from '../firebase';
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useBackground } from '../contexts/BackgroundContext';
import { motion } from 'framer-motion';

// --- Cloudinary Configuration ---
const CLOUDINARY_CLOUD_NAME = "dlfxg7hy9";
const CLOUDINARY_UPLOAD_PRESET = "mumbai_weather_forecasts";
const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

// Framer Motion Variants
const pageVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
};

// Reusable Glass Input Style
const glassInputStyle = "mt-1 block w-full px-4 py-3 text-sm text-white bg-white/5 backdrop-blur-md border border-white/10 rounded-xl shadow-inner placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500/50 focus:bg-white/10 transition-all duration-300";

function AdminPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState("");
    const [adminUser, setAdminUser] = useState(null);
    const [loadingAuth, setLoadingAuth] = useState(true);
    const [authError, setAuthError] = useState('');
    const { currentEffect, setCurrentEffect, effectsEnabled, setEffectsEnabled } = useBackground();

    const [forecastText, setForecastText] = useState('');
    const [imageFile, setImageFile] = useState(null);
    const [isSubmittingForecast, setIsSubmittingForecast] = useState(false);
    const [forecastMessage, setForecastMessage] = useState('');
    const [uploadProgress, setUploadProgress] = useState(0);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                try {
                    const idTokenResult = await user.getIdTokenResult(true);
                    if (idTokenResult.claims.admin || !user.isAnonymous) {
                        setAdminUser(user);
                    } else {
                        setAdminUser(null);
                        setAuthError('Access denied. You are not an admin.');
                        await signOut(auth);
                    }
                } catch (error) {
                    console.error("Error getting token claims:", error);
                    setAdminUser(null);
                    setAuthError('Error verifying admin status.');
                }
            } else {
                setAdminUser(null);
            }
            setLoadingAuth(false);
        });
        return () => unsubscribe();
    }, []);

    const handleAdminLogin = async (e) => {
        e.preventDefault();
        setAuthError('');
        try {
            await signInWithEmailAndPassword(auth, email, password);
            // setAdminUser is handled by onAuthStateChanged
        } catch (error) {
            console.error("Admin login error:", error);
            setAuthError(error.message.replace('Firebase: ', '').replace(/\(auth\/.*\)\.?/, '').trim() || 'Failed to login.');
        }
        setEmail('');
        setPassword('');
    };

    const handleAdminLogout = async () => {
        try {
            await signOut(auth);
            setAdminUser(null);
        } catch (error) {
            console.error("Admin logout error:", error);
        }
    };

    const handleImageChange = (e) => {
        if (e.target.files[0]) {
            setImageFile(e.target.files[0]);
            setUploadProgress(0);
        } else {
            setImageFile(null);
        }
    };

    const handleForecastSubmit = async (e) => {
        e.preventDefault();
        if (!forecastText.trim()) {
            setForecastMessage('Forecast text cannot be empty.');
            return;
        }
        if (!adminUser) {
            setForecastMessage('You are not logged in as admin.');
            return;
        }
        setIsSubmittingForecast(true);
        setForecastMessage('');

        let imageUrl = null; // FIXED: explicitly declare imageUrl

        if (imageFile) {
            setForecastMessage('Uploading image...');
            const formData = new FormData();
            formData.append('file', imageFile);
            formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

            try {
                const response = await fetch(CLOUDINARY_UPLOAD_URL, {
                    method: 'POST',
                    body: formData,
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(`Cloudinary upload failed: ${errorData.error.message}`);
                }

                const data = await response.json();
                imageUrl = data.secure_url;
                setUploadProgress(100);
                setForecastMessage('Image uploaded. Saving forecast...');
            } catch (error) {
                console.error("Error uploading image to Cloudinary: ", error);
                setForecastMessage(`Image upload failed: ${error.message}. Forecast not submitted.`);
                setIsSubmittingForecast(false);
                setImageFile(null);
                if (document.getElementById('imageUploadAdmin')) {
                    document.getElementById('imageUploadAdmin').value = '';
                }
                return;
            }
        }

        try {
            await addDoc(collection(db, 'forecasts'), {
                text: forecastText.trim(),
                imageUrl: imageUrl,
                timestamp: serverTimestamp(),
                adminUid: adminUser.uid
            });
            // --- NEW: ONE-SIGNAL PUSH NOTIFICATION TRIGGER ---
            try {
                const osResponse = await fetch('https://onesignal.com/api/v1/notifications', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json; charset=utf-8',
                        'Authorization': `os_v2_app_u3iktbhkzzekzocclbpqxbp27m6k6opv6gmueqfdtntb3b7pva6tj4t2l5rlhwnd5bqhhejckoh73xqmiqhqvqigxslj3m5nxyrsfdq`
                    },
                    body: JSON.stringify({
                        app_id: "a6d0a984-eace-48ac-b842-585f0b85fafb",
                        included_segments: ["Subscribed Users"],
                        headings: { en: "🌦️ Mumbai Weather Update" },
                        contents: {
                            en: forecastText.length > 80 ? forecastText.substring(0, 80) + "..." : forecastText
                        },
                        url: "https://mumbai-weather-app.web.app"
                    })
                });

                const osData = await osResponse.json();
                console.log("OneSignal API Reply: ", osData);

                // FIXED LOGGING: Check if there are errors from OneSignal
                if (osData.errors) {
                    console.error("⚠️ OneSignal rejected the push:", osData.errors);
                } else if (osData.recipients === 0) {
                    console.warn("⚠️ OneSignal accepted it, but delivered to 0 users.");
                } else {
                    console.log(`✅ Push notification sent successfully to ${osData.recipients} devices!`);
                }

            } catch (pushError) {
                console.error("Forecast saved, but push notification failed: ", pushError);
            }
            setForecastMessage('Forecast submitted successfully!');
            setForecastText('');
            setImageFile(null);
            setUploadProgress(0);
            if (document.getElementById('imageUploadAdmin')) {
                document.getElementById('imageUploadAdmin').value = '';
            }
        } catch (error) {
            console.error("Error adding forecast: ", error);
            if (error.code === 'permission-denied') {
                setForecastMessage('Permission denied. Ensure your admin account is correctly configured in Firestore rules.');
            } else {
                setForecastMessage('Failed to submit forecast. Please try again.');
            }
        } finally {
            setIsSubmittingForecast(false);
            if (!forecastMessage.toLowerCase().includes('failed')) {
                setTimeout(() => setForecastMessage(''), 4000);
            }
        }
    };
    const handleToggleEffects = () => {
        setEffectsEnabled(prev => !prev);
    };

    const handleEffectChange = (e) => {
        setCurrentEffect(e.target.value);
    }
    if (loadingAuth) {
        return (
            <div className="flex justify-center items-center h-64">
                <svg className="animate-spin h-10 w-10 text-sky-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            </div>
        );
    }

    if (!adminUser) {
        return (
            <motion.div variants={pageVariants} initial="hidden" animate="visible" className="max-w-md mx-auto mt-10 p-8 bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent pointer-events-none"></div>
                <h2 className="text-3xl font-semibold text-center mb-8 text-white tracking-tight drop-shadow-md">Admin Access</h2>
                <form onSubmit={handleAdminLogin} className="space-y-5 relative z-10">
                    <div>
                        <label htmlFor="emailAdmin" className="block text-sm font-medium text-slate-300 ml-1">Email address</label>
                        <input
                            type="email" id="emailAdmin" value={email || ""} onChange={(e) => setEmail(e.target.value)} required
                            className={glassInputStyle}
                            placeholder="admin@example.com"
                        />
                    </div>
                    <div>
                        <label htmlFor="passwordAdmin" className="block text-sm font-medium text-slate-300 ml-1">Password</label>
                        <input
                            type="password" id="passwordAdmin" value={password || ""} onChange={(e) => setPassword(e.target.value)} required autoComplete="new-password"
                            className={glassInputStyle}
                            placeholder="••••••••"
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full py-3.5 px-4 rounded-xl shadow-[0_0_20px_rgba(99,102,241,0.4)] text-sm font-semibold text-white bg-indigo-500/80 hover:bg-indigo-500 border border-indigo-400/50 transition-all duration-300 mt-4 active:scale-[0.98]"
                    >
                        Authenticate
                    </button>
                    {authError && (
                        <p className="text-red-300 bg-red-500/20 border border-red-500/30 py-2.5 px-4 rounded-xl text-sm mt-4 text-center backdrop-blur-md">
                            {authError}
                        </p>
                    )}
                </form>
            </motion.div>
        );
    }

    // Admin is logged in, show dashboard
    return (
        <motion.div variants={pageVariants} initial="hidden" animate="visible" className="p-6 md:p-10 bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl max-w-2xl mx-auto space-y-10 relative">

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-white/10">
                <h2 className="text-3xl font-semibold text-white tracking-tight drop-shadow-md">Command Center</h2>
                <button
                    onClick={handleAdminLogout}
                    className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-2"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                    Sign Out
                </button>
            </div>

            {/* Post Forecast Section */}
            <form onSubmit={handleForecastSubmit} className="space-y-6">
                <div>
                    <label htmlFor="forecastTextAdmin" className="block text-sm font-medium text-slate-300 mb-1.5 ml-1">
                        Meteorological Update
                    </label>
                    <textarea
                        id="forecastTextAdmin" value={forecastText} onChange={(e) => setForecastText(e.target.value)}
                        rows="5" required placeholder="Enter the latest weather details..."
                        className={`${glassInputStyle} resize-none min-h-[120px]`}
                    />
                </div>
                <div>
                    <label htmlFor="imageUploadAdmin" className="block text-sm font-medium text-slate-300 mb-1.5 ml-1">
                        Radar Image / Attachment
                    </label>
                    <input
                        type="file" id="imageUploadAdmin" accept="image/*" onChange={handleImageChange}
                        // Custom styled file input matching the glass UI
                        className="block w-full text-sm text-slate-300 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-white/10 file:text-white hover:file:bg-white/20 file:backdrop-blur-md file:border file:border-white/10 file:transition-colors file:cursor-pointer cursor-pointer bg-white/5 border border-white/10 rounded-xl"
                    />

                    {/* Glass Progress Bar */}
                    {imageFile && uploadProgress > 0 && uploadProgress < 100 && (
                        <div className="w-full bg-slate-800/50 rounded-full h-3 mt-4 border border-white/5 overflow-hidden">
                            <div className="bg-gradient-to-r from-sky-500 to-indigo-500 h-full rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                        </div>
                    )}
                </div>

                <button
                    type="submit" disabled={isSubmittingForecast}
                    className="w-full py-3.5 px-4 rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.3)] text-base font-semibold text-white bg-emerald-500/80 hover:bg-emerald-500 border border-emerald-400/50 transition-all duration-300 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                >
                    {isSubmittingForecast ? (
                        <>
                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            {forecastMessage.startsWith('Uploading image...') ? 'Uploading Image...' : 'Broadcasting...'}
                        </>
                    ) : 'Broadcast Forecast'}
                </button>

                {/* Status Message */}
                {forecastMessage && (
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`text-sm mt-4 text-center py-2.5 px-4 rounded-xl border backdrop-blur-md ${forecastMessage.includes('successfully') ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-200' :
                        forecastMessage.includes('failed') ? 'bg-red-500/20 border-red-500/30 text-red-200' :
                            'bg-sky-500/20 border-sky-500/30 text-sky-200'
                        }`}>
                        {forecastMessage}
                    </motion.p>
                )}
            </form>

            {/* --- Dynamic Background Effects Control Section --- */}
            <div className="pt-8 mt-8 border-t border-white/10">
                <h3 className="text-xl font-semibold text-sky-400 mb-6 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                    Live Canvas Controller
                </h3>

                <div className="space-y-6 bg-white/5 border border-white/10 p-5 rounded-2xl">
                    {/* Toggle Switch */}
                    <div className="flex items-center justify-between">
                        <span className="text-slate-300 font-medium">Render 3D Effects Globally</span>
                        <button
                            onClick={handleToggleEffects}
                            className={`${effectsEnabled ? 'bg-sky-500 shadow-[0_0_10px_rgba(14,165,233,0.5)]' : 'bg-slate-600'} relative inline-flex items-center h-7 rounded-full w-12 transition-all duration-300 ease-in-out focus:outline-none`}
                        >
                            <span className={`${effectsEnabled ? 'translate-x-6' : 'translate-x-1'} inline-block w-5 h-5 transform bg-white rounded-full transition-transform duration-300 ease-in-out shadow-md`} />
                        </button>
                    </div>

                    {/* Select Dropdown */}
                    {effectsEnabled && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="pt-2">
                            <label htmlFor="effectType" className="block text-sm font-medium text-slate-400 mb-2">
                                Active Weather Simulation:
                            </label>
                            <select
                                id="effectType"
                                value={currentEffect}
                                onChange={handleEffectChange}
                                className={`${glassInputStyle} appearance-none cursor-pointer text-base`}
                            >
                                <option value="None" className="bg-slate-800 text-white">None (Dark Slate)</option>
                                <option value="Rain" className="bg-slate-800 text-white">Light/Moderate Rain</option>
                                <option value="Thunderstorm" className="bg-slate-800 text-white">Heavy Thunderstorm</option>
                                <option value="Cloudy" className="bg-slate-800 text-white">Overcast / Cloudy</option>
                                <option value="Rain and Cloudy" className="bg-slate-800 text-white">Rain & Cloudy</option>
                                <option value="Sunny" className="bg-slate-800 text-white">Sunny (Clear Sky)</option>
                                <option value="Sun & Partly Cloudy" className="bg-slate-800 text-white">Partly Cloudy</option>
                            </select>
                        </motion.div>
                    )}
                </div>
            </div>
        </motion.div>
    );
}

export default AdminPage;