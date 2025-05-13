import { motion } from "framer-motion";
import Navbar from "./Navbar";
import HowToPlay from "./HowToPlay"; // Assuming this component exists
import { useCurrentAccount } from "@mysten/dapp-kit"; // For wallet connection
import {Link} from "react-router-dom"; // For navigation

export default function LandingPage() {
  const currentAccount = useCurrentAccount();
  const handleParticipate = () => {
    // Add your logic for the Participate button here
    if (currentAccount) {
      console.log("Participating with account:", currentAccount.address);
      // Example: Navigate to a contest page or trigger participation logic
    }
  };

  return (
    <div className="bg-black text-white min-h-screen">
      {/* Navbar - Fixed at the top */}
      <Navbar />

      {/* Hero Section */}
      <div className="flex items-center justify-center min-h-screen bg-black p-2 sm:p-4 md:p-6 lg:p-8">
        <div
          className="relative w-full max-w-[90%] sm:max-w-[85%] md:max-w-5xl lg:max-w-6xl xl:max-w-7xl h-auto min-h-[400px] sm:min-h-[500px] md:h-[550px] lg:h-[600px] bg-cover bg-center rounded-lg border border-red-900 text-white"
          style={{ backgroundImage: "url('/landingbg.png')" }}
        >
          <div className="absolute inset-0 p-3 sm:p-6 md:p-8 lg:p-10 rounded-lg shadow-lg  text-gray-400 backdrop-blur-[4px] bg-white/5">
            <div className="absolute bottom-3 sm:bottom-4 md:bottom-6 left-3 sm:left-4 md:left-6 flex flex-col items-start max-w-full">
              {/* Animated Sentences */}
              <motion.h1
                className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight leading-tight"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.8 }}
              >
                YOUR <span className="text-white">BET.</span>
              </motion.h1>

              <motion.h1
                className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight leading-tight mt-1 sm:mt-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1, duration: 0.8 }}
              >
                YOUR <span className="text-white">GAME.</span>
              </motion.h1>

              <motion.h1
                className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight leading-tight mt-1 sm:mt-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.8, duration: 0.8 }}
              >
                YOUR <span className="text-white">VICTORY.</span>
              </motion.h1>

              {/* Description */}
              <motion.p
                className="text-xs sm:text-sm md:text-base lg:text-lg text-gray-300 mt-3 sm:mt-4 md:mt-5 max-w-[90%] sm:max-w-md"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2.6, duration: 0.6 }}
              >
                Tokenize your player picks, invest using SUI, and earn as real-time performance drives your token value!
              </motion.p>

              {/* Participate Button */}
              <Link to="/contest">
              <button
                className={`glow-border font-semibold mt-4 sm:mt-6 px-6 sm:px-8 py-1.5 sm:py-2 rounded-md text-red-800 bg-white hover:bg-gray-300 transition text-sm sm:text-base
                ${!currentAccount ? "cursor-not-allowed opacity-60" : ""}`}
                onClick={handleParticipate}
                disabled={!currentAccount}
              >
                Participate
              </button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* HowToPlay Section */}
      <div className="bg-black text-white px-4 sm:px-6 md:px-8 lg:px-10 py-8 sm:py-12">
        <HowToPlay />
      </div>
    </div>
  );
}