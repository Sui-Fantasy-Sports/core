import { BrowserRouter, Route, Routes } from "react-router";
import Layout from "./layouts";
import Home from "./pages/Home";

export default function () {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout.Default />}>
          <Route index element={<Home />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
