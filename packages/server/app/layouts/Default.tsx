import { Outlet } from "react-router";
import Navbar from "../shared/components/Navbar";
import { cn } from "../shared/utils/utils";
import { useEffect } from "react";
import { setAuthToken } from "../shared/utils/apiClient";
import { Toaster } from "sonner";

export default function () {
  // useEffect(() => {
  //   if (privy.ready && privy.authenticated) {
  //     privy.getAccessToken().then((token) => {
  //       token && setAuthToken(token);
  //     });
  //   }
  // }, [privy.ready, privy.authenticated]);

  return (
    <main className="h-screen flex flex-col relative">
      <Navbar />

      <div
        className={cn(
          "flex-1 overflow-y-scroll pb-[10vh] duration-300"
          // !privy.ready && "opacity-0 scale-50 saturate-0"
        )}
      >
        <Outlet />
      </div>

      <Toaster richColors mobileOffset={{ bottom: 64 }} />
    </main>
  );
}
