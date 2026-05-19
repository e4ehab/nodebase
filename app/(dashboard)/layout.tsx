import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

const Layout = ({ children }: { children: React.ReactNode }) => {
    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset className="bg-accent/20">
                <header className="flex h-12 shrink-0 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur-sm transition-all duration-300 ease-in-out">
                    <SidebarTrigger className="-ml-1" />
                    <Separator orientation="vertical" className="h-4" />
                </header>
                <main className="flex flex-1 flex-col gap-4 p-4 transition-all duration-300 ease-in-out">
                    {children}
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
};

export default Layout;
