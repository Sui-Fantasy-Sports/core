import { useState } from "react";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { ConnectModal } from "@mysten/dapp-kit";

const Navbar = () => {
  const currentAccount = useCurrentAccount();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleButtonClick = () => {
    if (!currentAccount) {
      setIsModalOpen(true); // Open modal only if not connected
    }
  };

  return (
    <nav className="fixed top-0 left-1/2 transform -translate-x-1/2 w-full flex justify-center items-center p-4 bg-black bg-opacity-80 backdrop-blur-lg text-white z-50">
      <div className="flex space-x-6">
        <a href="#" className="hover:text-gray-400 transition">Home</a>
        <a href="#" className="hover:text-gray-400 transition">Tournaments</a>
        <a href="#" className="hover:text-gray-400 transition">MyEarnings</a>
      </div>
      <button
        className="absolute right-6 bg-gradient-to-r from-[#8b0000] to-[#250000] px-4 py-2 rounded-md hover:bg-red-500 transition disabled:opacity-50"
        onClick={handleButtonClick}
        disabled={!!currentAccount && !currentAccount.address} // Disable during connecting if needed
      >
        {currentAccount
          ? `${currentAccount.address.slice(0, 6)}...${currentAccount.address.slice(-4)}`
          : "Connect Wallet"}
      </button>
      <ConnectModal
        trigger={<button className="hidden">Open Modal</button>} // Hidden trigger for compliance
        open={isModalOpen}
        onOpenChange={(isOpen) => setIsModalOpen(isOpen)}
      />
    </nav>
  );
};

export default Navbar;