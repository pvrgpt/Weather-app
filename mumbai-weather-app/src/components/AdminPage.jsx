// src/components/AdminPage.jsx
import React, { useState, useEffect } from 'react';
import { db, auth, storage } from '../firebase';
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useBackground } from '../contexts/BackgroundContext';

// --- Cloudinary Configuration ---
const CLOUDINARY_CLOUD_NAME = "dlfxg7hy9";
const CLOUDINARY_UPLOAD_PRESET = "mumbai_weather_forecasts";
const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

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
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            setAdminUser(userCredential.user);
            // No need to set sessionStorage item, Firebase auth state persists
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
            // Handle logout error if needed
        }
    };


    const handleImageChange = (e) => {
        if (e.target.files[0]) {
            setImageFile(e.target.files[0]);
            setUploadProgress(0); // Reset progress when new file is selected
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
        if (!adminUser) { // Should not happen if UI is correct, but good check
            setForecastMessage('You are not logged in as admin.');
            return;
        }
        setIsSubmittingForecast(true);
        setForecastMessage('');

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
                setImageFile(null); // Clear the file
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
                adminUid: adminUser.uid // Optional: store which admin posted
            });
            setForecastMessage('Forecast submitted successfully!');
            setForecastText('');
            setImageFile(null);
            if (document.getElementById('imageUploadAdmin')) { // Ensure unique ID if you have another image upload
                document.getElementById('imageUploadAdmin').value = '';
            }
        } catch (error) {
            console.error("Error adding forecast: ", error);
            // Check if it's a permissions error from Firestore rules
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

    // Handler for changing the effect type
    const handleEffectChange = (e) => {
        setCurrentEffect(e.target.value);
    };

    if (loadingAuth) {
        return <div className="text-center p-10">Loading admin panel...</div>;
    }

    if (!adminUser) {
        return (
            <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow">
                <h2 className="text-2xl font-bold text-center mb-6 text-gray-700">Admin Login</h2>
                <form onSubmit={handleAdminLogin} className="space-y-4">
                    <div>
                        <label htmlFor="emailAdmin" className="block text-sm font-medium text-gray-700">Email</label>
                        <input
                            type="email"
                            id="emailAdmin"
                            value={email || ""}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>
                    <div>
                        <label htmlFor="passwordAdmin" className="block text-sm font-medium text-gray-700">Password</label>
                        <input
                            type="password"
                            id="passwordAdmin"
                            name="passwordAdmin"
                            value={password || ""}
                            autoComplete="new-password"
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        Login
                    </button>
                    {authError && <p className="text-red-500 text-sm mt-2 text-center">{authError}</p>}
                </form>
            </div>
        );
    }

    // Admin is logged in, show forecast form
    return (
        <div className="p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-xl mx-auto space-y-8">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-700">Admin Panel - Post Forecast</h2>
                <button onClick={handleAdminLogout} className="text-sm text-indigo-600 hover:text-indigo-800">
                    Logout ({adminUser.email})
                </button>
            </div>
            <form onSubmit={handleForecastSubmit} className="space-y-4">
                <div>
                    <label htmlFor="forecastTextAdmin" className="block text-sm font-medium text-gray-700">
                        Forecast Text
                    </label>
                    <textarea
                        id="forecastTextAdmin" value={forecastText} onChange={(e) => setForecastText(e.target.value)}
                        rows="4" required
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                </div>
                <div>
                    <label htmlFor="imageUploadAdmin" className="block text-sm font-medium text-gray-700">
                        Optional Image (e.g., radar)
                    </label>
                    <input
                        type="file" id="imageUploadAdmin" accept="image/*" onChange={handleImageChange}
                        className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                    />
                    {imageFile && uploadProgress > 0 && uploadProgress < 100 && (
                        <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                            <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${uploadProgress}%` }}></div>
                        </div>
                    )}
                </div>
                <button
                    type="submit" disabled={isSubmittingForecast}
                    className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                >
                    {isSubmittingForecast ? (forecastMessage.startsWith('Uploading image...') ? 'Uploading Image...' : 'Submitting...') : 'Submit Forecast'}
                </button>
                {forecastMessage && <p className={`text-sm mt-2 text-center ${forecastMessage.includes('successfully') ? 'text-green-600' : forecastMessage.includes('failed') ? 'text-red-600' : 'text-gray-700'}`}>{forecastMessage}</p>}
            </form>
            {/* --- NEW: Background Effects Control Section --- */}
            <div className="pt-6 border-t border-slate-200 dark:border-slate-700">
                <h3 className="text-xl font-semibold text-sky-600 dark:text-sky-400 mb-4">Dynamic Background Effects</h3>
                <div className="space-y-4">
                    {/* Toggle Switch for Enabling/Disabling */}
                    <div className="flex items-center justify-between">
                        <span className="text-slate-700 dark:text-slate-300">Enable Effects:</span>
                        <button
                            onClick={handleToggleEffects}
                            className={`${effectsEnabled ? 'bg-sky-600' : 'bg-slate-300 dark:bg-slate-600'
                                } relative inline-flex items-center h-6 rounded-full w-11 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800`}
                        >
                            <span className="sr-only">Enable effects</span>
                            <span
                                className={`${effectsEnabled ? 'translate-x-6' : 'translate-x-1'
                                    } inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-200 ease-in-out`}
                            />
                        </button>
                    </div>

                    {/* Select Dropdown for Effect Type */}
                    {effectsEnabled && ( // Only show if effects are enabled
                        <div>
                            <label htmlFor="effectType" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Select Effect:
                            </label>
                            <select
                                id="effectType"
                                value={currentEffect}
                                onChange={handleEffectChange}
                                className="block w-full px-4 py-3 text-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                            >
                                <option value="None">None</option>
                                <option value="Rain">Rain</option>
                                <option value="Cloudy">Cloudy</option>
                                <option value="Rain and Cloudy">Rain and Cloudy</option>
                                <option value="Sunny">Sunny</option>
                                <option value="Sun & Partly Cloudy">Sun & Partly Cloudy</option>
                            </select>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
export default AdminPage;