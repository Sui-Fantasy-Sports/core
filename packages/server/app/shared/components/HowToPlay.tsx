import { Github, Youtube, Mail } from 'lucide-react';

const HowToPlay = () => {
    const renderImageCard = (imagePath: string) => (
  <div className="w-full bg-neutral-950 hover:shadow-[0_0_20px_4px_rgba(220,38,38,0.7)] max-w-[350px] sm:max-w-[400px] lg:max-w-[450px] xl:max-w-[500px] h-[200px] sm:h-[250px] md:h-[300px] lg:h-[350px] p-3 sm:p-4 rounded-2xl shadow-2xl overflow-hidden border border-neutral-800">
    <div
      className="w-full h-full bg-cover bg-center rounded-lg transition-transform duration-300 hover:scale-105"
      style={{ backgroundImage: `url('${imagePath}')` }}
    />
  </div>
);


    return (
        <div>
            <div className="min-h-screen flex flex-col w-full max-w-none bg-black text-white">
                <h2 className="text-2xl xs:text-3xl sm:text-4xl lg:text-5xl xl:text-6xl text-center pt-10 sm:pt-16 md:pt-20 mb-6 sm:mb-8 md:mb-10">
                    HOW TO PLAY
                </h2>

                {/* Section 1 */}
                <div className="flex flex-col md:flex-row items-center justify-center py-10 sm:py-16 md:py-20 
                px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 2xl:px-16 
                gap-8 sm:gap-10 md:gap-12 lg:gap-14 xl:gap-18 
                w-full mx-auto">
                    <div className="w-full max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl xl:max-w-3xl text-left px-4 sm:px-0">
                        <h3 className="text-xl xs:text-xl sm:text-2xl lg:text-3xl xl:text-4xl mb-3 sm:mb-4">
                            Pick a Match. Set the Stage.
                        </h3>
                        <p className="text-lg xs:text-xl sm:text-2xl lg:text-3xl xl:text-3xl text-gray-400">
                            Choose any live or upcoming cricket match to get in the game. The thrill begins with your selection!
                        </p>
                    </div>
                    {renderImageCard('/stadium_black_bg.png')}
                </div>

                {/* Section 2 */}
                <div className="flex flex-col md:flex-row-reverse items-center justify-center py-10 sm:py-16 md:py-20 px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 2xl:px-16 
                gap-8 sm:gap-10 md:gap-12 lg:gap-14 xl:gap-18 w-full mx-auto">
                    <div className="w-full max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl xl:max-w-3xl text-left md:text-right px-4 sm:px-0">
                        <h3 className="text-xl xs:text-xl sm:text-2xl lg:text-3xl xl:text-4xl mb-3 sm:mb-4">
                            Build Your NFT Squad. Own the Game.
                        </h3>
                        <p className="text-lg xs:text-xl sm:text-2xl lg:text-3xl xl:text-3xl text-gray-300">
                            Buy player NFTs powered by Sui blockchain and assemble your ultimate team. Your collection, your strategy.
                        </p>
                    </div>
                    {renderImageCard('/cricteam1.png')}
                </div>

                {/* Section 3 */}
                <div className="flex flex-col md:flex-row items-center justify-center py-10 sm:py-16 md:py-20 
                px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 2xl:px-16 
                gap-8 sm:gap-10 md:gap-12 lg:gap-14 xl:gap-18 
                w-full mx-auto">
                    <div className="w-full max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl xl:max-w-3xl text-left px-4 sm:px-0">
                        <h3 className="text-xl xs:text-xl sm:text-2xl lg:text-3xl xl:text-4xl mb-3 sm:mb-4">
                            Watch. Rise. Trade.
                        </h3>
                        <p className="text-lg xs:text-xl sm:text-2xl lg:text-3xl xl:text-3xl text-gray-400">
                            Player NFT values rise with real-time match performance. Monitor stats, boost your portfolio, and trade anytime on the go!
                        </p>
                    </div>
                    {renderImageCard('/nft_processed.png')}
                </div>
            </div>

            <footer className="w-full bg-red-950 text-white py-6 sm:py-8 px-4 flex flex-col items-center space-y-3 sm:space-y-4">
                <div className="flex space-x-4 sm:space-x-6">
                    <a href="https://github.com/yourprofile" target="_blank" rel="noopener noreferrer">
                        <Github className="hover:text-gray-400 size-8 sm:size-10" />
                    </a>
                    <a href="https://youtube.com/yourchannel" target="_blank" rel="noopener noreferrer">
                        <Youtube className="hover:text-red-800 size-8 sm:size-10" />
                    </a>
                    <a href="mailto:contact@futcric.com">
                        <Mail className="hover:text-gray-400 size-8 sm:size-10" />
                    </a>
                </div>
                <div className="text-xs sm:text-sm text-center">
                    {/* <p>
                        Contact us at{' '}
                        <a href="mailto:contact@futcric.com" className="underline hover:text-gray-300">
                            contact@futcric.com
                        </a>
                    </p> */}
                    <p>© 2025 TokenTurf. Built for Sui Overflow'25.</p>
                </div>
            </footer>
        </div>
    );
};

export default HowToPlay;