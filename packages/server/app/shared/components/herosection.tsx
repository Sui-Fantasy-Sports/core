import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { useState } from "react";
import { X } from "lucide-react"; // For the close icon
import Navbar from "../../shared/components/Navbar";
import HowToPlay from "../../shared/components/HowToPlay";

const Home = () => {
  const navigate = useNavigate();
  const currentAccount = useCurrentAccount();
  const [showWarning, setShowWarning] = useState(true); // State to manage warning visibility

  const handleParticipate = () => {
    if (!currentAccount) {
      alert("Please connect your wallet first!");
      return;
    }
    navigate("/tournaments");
  };

  return (
    <div className="bg-black text-white min-h-screen">
      {/* Navbar - Fixed at the top */}
      <Navbar />

      {/* Testnet Warning Banner - Sticky Below Navbar */}
      <AnimatePresence>
        {showWarning && (
          <motion.div
            className="sticky top-[64px] z-40 bg-white/5 border-b border-neutral-800 text-center px-4 py-2 sm:py-3 flex items-center justify-center gap-2"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            role="alert"
            aria-live="polite"
          >
            <span className="text-yellow-400 text-xs sm:text-sm flex items-center gap-1">
              ⚠ Please use the <strong>testnet</strong> version of the wallet for full functionality.
            </span>
            <button
              onClick={() => setShowWarning(false)}
              className="text-gray-400 hover:text-white transition-colors"
              aria-label="Dismiss testnet warning"
            >
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <div className="flex items-center justify-center min-h-screen bg-black p-2 sm:p-4 md:p-6 lg:p-8 xl:p-10 2xl:p-12">
        <div
          className="relative w-full max-w-[90%] sm:max-w-[85%] md:max-w-5xl lg:max-w-6xl xl:max-w-7xl 2xl:max-w-[90%] 3xl:max-w-[1920px] h-auto min-h-[400px] sm:min-h-[500px] md:min-h-[550px] lg:min-h-[600px] xl:min-h-[650px] 2xl:min-h-[800px] bg-cover bg-center rounded-lg border border-neutral-800 text-white"
          style={{ backgroundImage: "url('/landingbg.png')" }} // Ensure '/landingbg.png' exists in public directory
        >
          <div className="absolute inset-0 p-3 sm:p-6 md:p-8 lg:p-10 xl:p-12 2xl:p-16 rounded-lg shadow-lg text-gray-400 backdrop-blur-[4px] bg-white/5">
            <div className="absolute bottom-3 sm:bottom-4 md:bottom-6 lg:bottom-8 xl:bottom-10 2xl:bottom-12 left-3 sm:left-4 md:left-6 lg:left-8 xl:left-10 2xl:left-12 flex flex-col items-start max-w-full">
              {/* Animated Sentences */}
              <motion.h1
                className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl 2xl:text-8xl 3xl:text-9xl font-bold tracking-tight leading-tight"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.8 }}
              >
                YOUR <span className="text-white">BET.</span>
              </motion.h1>

              <motion.h1
                className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl 2xl:text-8xl 3xl:text-9xl font-bold tracking-tight leading-tight mt-1 sm:mt-2 lg:mt-3 2xl:mt-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1, duration: 0.8 }}
              >
                YOUR <span className="text-white">GAME.</span>
              </motion.h1>

              <motion.h1
                className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl 2xl:text-8xl 3xl:text-9xl font-bold tracking-tight leading-tight mt-1 sm:mt-2 lg:mt-3 2xl:mt-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.8, duration: 0.8 }}
              >
                YOUR <span className="text-white">VICTORY.</span>
              </motion.h1>

              {/* Description */}
              <motion.p
                className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl 2xl:text-2xl 3xl:text-3xl text-gray-300 mt-3 sm:mt-4 md:mt-5 lg:mt-6 xl:mt-7 2xl:mt-8 max-w-[90%] sm:max-w-md lg:max-w-lg xl:max-w-xl 2xl:max-w-2xl"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2.6, duration: 0.6 }}
              >
                Tokenize your player picks, invest using SUI, and earn as real-time performance drives your token value!
              </motion.p>

              {/* Participate Button */}
              <button
                className="glow-border font-semibold mt-4 sm:mt-6 lg:mt-8 2xl:mt-10 px-6 sm:px-8 lg:px-10 2xl:px-12 py-1.5 sm:py-2 lg:py-3 2xl:py-4 rounded-md text-red-800 bg-white hover:bg-gray-300 transition text-sm sm:text-base lg:text-lg 2xl:text-xl 3xl:text-2xl disabled:opacity-60 disabled:cursor-not-allowed"
                onClick={handleParticipate}
                disabled={!currentAccount}
                aria-disabled={!currentAccount}
              >
                Participate
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* HowToPlay Section */}
      <div className="bg-black text-white">
        <HowToPlay />
      </div>
    </div>
  );
};

export default Home;