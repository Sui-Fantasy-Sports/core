// client/src/components/HeroSection.tsx
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useCurrentAccount } from "@mysten/dapp-kit";
import Navbar from "./Navbar"; // Adjust path based on your folder structure
import HowToPlay from "../components/HowToPlay"; // Adjust path based on your folder structure
const HeroSection = () => {
  const navigate = useNavigate();
  const currentAccount = useCurrentAccount();

  const handleParticipate = () => {
    if (!currentAccount) {
      alert("Please connect your wallet first!");
      return;
    }
    navigate("/contest");
  };

  return (
    <div className="bg-black text-white min-h-screen">
      <Navbar /> {/* Add Navbar here, fixed at the top */}
      <div className="flex items-center justify-center min-h-screen bg-black p-4 sm:p-6">
      <div className="relative w-full max-w-7xl h-auto sm:h-[600px] bg-cover bg-center rounded-lg border border-red-900 text-white"
        style={{ backgroundImage: "url('/landingbg.png')" }}
      >
        <div className="absolute inset-0 p-4 sm:p-10 rounded-lg shadow-lg border border-red-900 text-white backdrop-blur-[4px] bg-white/5">
          <div className="absolute bottom-4 sm:bottom-6 left-4 sm:left-6 flex flex-col items-start max-w-full">
            {/* Animated Sentences */}
            <motion.h1
              className="text-4xl sm:text-6xl md:text-7xl font-bold"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
            >
              YOUR <span className="text-gray-400">BET.</span>
            </motion.h1>

            <motion.h1
              className="text-4xl sm:text-6xl md:text-7xl font-bold mt-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1, duration: 0.8 }}
            >
              YOUR <span className="text-gray-400">GAME.</span>
            </motion.h1>

            <motion.h1
              className="text-4xl sm:text-6xl md:text-7xl font-bold mt-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.8, duration: 0.8 }}
            >
              YOUR <span className="text-gray-400">VICTORY.</span>
            </motion.h1>

            {/* Description */}
            <motion.p
              className="text-sm sm:text-base text-gray-300 mt-4 max-w-md"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2.6, duration: 0.6 }}
            >
              Tokenize your player picks, invest using SUI, and earn as real-time performance drives your token value!
            </motion.p>

            <button
                className={`mt-6 px-6 py-2 rounded-md bg-gradient-to-r from-[#8b0000] to-[#250000] hover:bg-red-500 transition
                ${!currentAccount ? "opacity-50 cursor-not-allowed" : ""}`}
                onClick={handleParticipate}
                disabled={!currentAccount}
              >
              Participate
            </button>
          </div>
        </div>
      </div>
    </div>
      <div className="bg-black text-white">
        <HowToPlay />
      </div>  
    </div>
  );
};

export default HeroSection;