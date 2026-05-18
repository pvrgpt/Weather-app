import React from 'react';

// IMPORTANT: Ensure you have placed these 3 images in your src/assets folder!
import cloud1 from '/img/cloudsnew1.png';
import cloud2 from '/img/cloudsnew2.png';
import cloud3 from '/img/cloud3bg.png';

const RealisticClouds = () => {

    const cloudConfig = [
        // Background layer (Slow, small, slightly blurred)
        { id: 1, src: cloud1, top: '5%', width: 'w-[45vw]', duration: '140s', delay: '-20s', opacity: 0.6, blur: 'blur-[2px]' },
        { id: 2, src: cloud2, top: '15%', width: 'w-[55vw]', duration: '150s', delay: '-90s', opacity: 0.5, blur: 'blur-[2px]' },

        // Midground layer (Medium speed, normal opacity)
        { id: 3, src: cloud3, top: '25%', width: 'w-[70vw]', duration: '100s', delay: '-10s', opacity: 0.85, blur: 'blur-none' },
        { id: 4, src: cloud1, top: '40%', width: 'w-[60vw]', duration: '110s', delay: '-60s', opacity: 0.8, blur: 'blur-none' },

        // Foreground layer (Fastest, largest, fully opaque, overlapping the UI slightly)
        { id: 5, src: cloud2, top: '50%', width: 'w-[100vw]', duration: '70s', delay: '-30s', opacity: 0.95, blur: 'blur-none' },
        { id: 6, src: cloud3, top: '10%', width: 'w-[110vw]', duration: '85s', delay: '-70s', opacity: 1, blur: 'blur-none' },
    ];

    return (
        <>
            <style>
                {`
          @keyframes float-cloud {
            0% { transform: translate3d(-120vw, 0, 0); }
            100% { transform: translate3d(120vw, 0, 0); }
          }
          .animate-cloud {
            position: absolute;
            will-change: transform; /* Hardware acceleration for smooth movement */
            animation: float-cloud linear infinite;
          }
        `}
            </style>

            {/* The Sky Gradient (Matched to your first daytime screenshot) */}
            <div className="fixed inset-0 z-[-2] bg-gradient-to-b from-[#3A7BD5] via-[#5A9BE0] to-[#86BBEB]" />

            {/* Cloud Wrapper */}
            <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
                {cloudConfig.map((cloud) => (
                    <div
                        key={cloud.id}
                        className={`animate-cloud ${cloud.blur}`}
                        style={{
                            top: cloud.top,
                            width: cloud.width,
                            animationDuration: cloud.duration,
                            animationDelay: cloud.delay,
                            opacity: cloud.opacity,
                        }}
                    >
                        {/* The cloud image */}
                        <img
                            src={cloud.src}
                            alt="weather cloud"
                            className="w-full h-auto object-contain drop-shadow-lg"
                        />
                    </div>
                ))}
            </div>
        </>
    );
};

export default RealisticClouds;