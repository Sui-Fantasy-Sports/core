import { useState } from "react";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { ConnectModal } from "@mysten/dapp-kit";
import { Link } from "react-router-dom";

const Navbar = () => {
  const currentAccount = useCurrentAccount();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showDevnetNotice, setShowDevnetNotice] = useState(false);

  const handleButtonClick = () => {
    if (!currentAccount) {
      setIsModalOpen(true); // Open connect modal
      setShowDevnetNotice(true); // Show devnet notice
    }
  };

  return (
    <>
      {/* Devnet Notice */}
      {showDevnetNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-transparent">
          <div className="bg-black text-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4 text-center border border-[#8b0000]">
            <h2 className="text-lg font-semibold mb-2">⚠ Devnet Warning</h2>
            <p className="text-sm mb-4">
              This application is deployed on <strong>Devnet</strong>. All assets and tokens are for testing purposes only.
            </p>
            <button
              onClick={() => setShowDevnetNotice(false)}
              className="mt-2 bg-black text-yellow-200 px-4 py-2 rounded hover:bg-gray-900 transition"
            >
              OK, Got it!
            </button>
          </div>
        </div>
      )}

      {/* Navbar */}
      <nav className="fixed top-0 left-1/2 transform -translate-x-1/2 w-full flex justify-between items-center px-8 py-1 bg-black bg-opacity-80 backdrop-blur-lg text-white z-50">
        <div className="flex items-center">
          <img
            src="/white_logo.png"
            alt="Logo"
            className="h-8 sm:h-12 md:h-16"
          />
        </div>

        {/* Navigation Links */}
        <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center gap-4">
          <Link to="/" className="hover:text-gray-400 transition">Home</Link>
          <Link to="/tournaments" className="hover:text-gray-400 transition">Tournaments</Link>
        </div>

        {/* Wallet Button */}
        <button
          className="bg-[#8b0000] px-4 py-2 rounded-md hover:bg-red-500 transition disabled:opacity-50"
          onClick={handleButtonClick}
          disabled={!!currentAccount}
        >
          {currentAccount
            ? `${currentAccount.address.slice(0, 6)}...${currentAccount.address.slice(-4)}`
            : "Connect Wallet"}
        </button>

        <ConnectModal
          trigger={<button className="hidden">Open Modal</button>}
          open={isModalOpen}
          onOpenChange={(isOpen) => setIsModalOpen(isOpen)}
        />
      </nav>
    </>
  );
};

export default Navbar;