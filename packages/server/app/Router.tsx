import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { SuiClientProvider, WalletProvider } from '@mysten/dapp-kit';
import { getFullnodeUrl } from '@mysten/sui/client';
import HeroSection from '../app/shared/components/herosection';
import ContestPage from '../app/shared/components/ContestPage';
import MatchPage from '../app/shared/components/MatchPage';

function App() {
  const networks = {
    testnet: { url: getFullnodeUrl('testnet') },
  };

  return (
    <SuiClientProvider networks={networks} defaultNetwork="testnet">
      <WalletProvider>
        <Router>
          <Routes>
            {/* Home page with "Participate" button */}
            <Route path="/" element={<HeroSection />} />

            {/* Contest page showing tournaments and contests */}
            <Route path="/contest" element={<ContestPage />} />

            {/* Players page for a specific contest */}
            <Route path="/players/:contestId" element={<MatchPage />} />
          </Routes>
        </Router>
      </WalletProvider>
    </SuiClientProvider>
  );
}

export default App;