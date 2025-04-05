import { Routes, Route } from "react-router-dom";
import Navbar from "./shared/components/Navbar";
import HeroSection from "./shared/components/herosection";
import ContestPage from "./shared/components/ContestPage"; // New page
import Cota from "./shared/components/Cota";
import Layout from "./layouts";

export default function Router() {
  return (
    <Routes>
      <Route path="/" element={<Layout.Default />}>
        <Route index element={<HeroSection />} />
        <Route path="/contest" element={<ContestPage />} />
        <Route path="/contests" element={<Cota />} />
      </Route>
    </Routes>
  );
}
