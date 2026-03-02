import { Outlet } from "react-router-dom";
import AppSidebar from "./AppSidebar";

const AppLayout = () => {
  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <main className="flex-1 transition-all duration-300 ml-[72px] p-8 lg:p-12">
        <Outlet />
      </main>
    </div>
  );
};

export default AppLayout;
