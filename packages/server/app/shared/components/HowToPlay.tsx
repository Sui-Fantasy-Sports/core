import { Github, Youtube, Mail } from 'lucide-react';

const HowToPlay= () =>{
    return(
        <div>
            <div
                className="
                min-h-screen bg-black bg-no-repeat bg-center flex flex-col items-start"
                style={{ backgroundImage: "url('/stadium_black_bg.png')", backgroundSize: 'cover' }}
                >
                <h2 className="text-white text-center text-6xl w-full pt-28">
                    HOW TO PLAY
                </h2>
                <div className="flex-1 flex items-center justify-start">
                <div className="text-white text-center-left ml-40 max-w-[600px] mt-10">
                    <h3 className="text-4xl mb-4">Pick a Match. Set the Stage.</h3>
                    <p className="text-2xl">
                    Choose any live or upcoming cricket match to get in the game. The thrill begins with your selection!
                    </p>
                </div>
                </div>
            </div>
            
            <div
            className="bg-[url('/futcricteam_processed.png')] 
            min-h-screen bg-black bg-no-repeat bg-center flex items-center justify-end"
            style={{ backgroundSize: 'cover' }}>
                <div className="text-white text-right mr-40 max-w-[600px]">
                    <h3 className="text-4xl mb-4">Build Your NFT Squad.         
                    Own the Game.</h3>
                    <p className="text-2xl">
                    Buy player NFTs powered by Sui blockchain and assemble your ultimate team. Your collection, your strategy.
                    </p>
                </div>
            </div>

            <div className="bg-[url('/nft_processed.png')] 
            min-h-screen bg-black bg-no-repeat bg-center flex items-center justify-start"
            style={{ backgroundSize: 'cover' }}>
                <div className="text-white text-left ml-40 max-w-[600px]">                 
                <h3 className="text-4xl mb-4"> Watch. Rise. Trade.</h3>
                <p className=" text-2xl">Player NFT values rise with real-time match performance. Monitor stats, boost your portfolio, and trade anytime on the go!</p>
                </div>
            </div>
            {/* Footer */}
            <footer className="bg-red-950 text-white py-8 flex flex-col items-center space-y-4">
            <div className="flex space-x-6 text-2xl">
                <a href="https://github.com/yourprofile" target="_blank" rel="noopener noreferrer">
                    <Github className="hover:text-gray-400 size-10" />
                </a>
                <a href="https://youtube.com/yourchannel" target="_blank" rel="noopener noreferrer">
                    <Youtube className="hover:text-red-800 size-10" />
                </a>
                <a href="mailto:contact@futcric.com">
                    <Mail className="hover:text-gray-400 size-10" />
                </a>
            </div>
            <div className="text-sm text-center">
                <p>
                    Contact us at <a href="mailto:contact@futcric.com" className="underline hover:text-gray-300">contact@futcric.com</a>
                </p>
                <p>© 2025 Futcric. All rights reserved.</p>
            </div>
        </footer>
        </div>
    );
  
};

export default HowToPlay;