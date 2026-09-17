import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import jwt from "jsonwebtoken";
import DashboardSidebar from "@/components/layout/DashboardSidebar";
import DashboardHeader from "@/components/layout/DashboardHeader";
import StudentDashboard from "@/components/dashboard/StudentDashboard";
import CompanyDashboard from "@/components/dashboard/CompanyDashboard";

interface DecodedToken {
  userId: string;
  email: string;
  username: string;
  fullname?: string;
  role?: string;
}

async function getUserData(): Promise<DecodedToken | null> {
  const cookieStore = await cookies(); 
  const token = cookieStore.get("auth_token")?.value || cookieStore.get("token")?.value;

  if (!token) {
    return null;
  }

  try {
    const decoded = jwt.verify(
      token, 
      process.env.JWT_SECRET || process.env.JWT_SECRET_KEY || "YOUR_SUPER_SECRET_KEY"
    ) as unknown as DecodedToken;
    return decoded;
  } catch {
    return null;
  }
}

export default async function DashboardPage() {
  const user = await getUserData();
  if (!user) {
    redirect("/auth/login");
  }
  const displayName = user?.fullname || user?.username || "Guest User";
  const role = user?.role || "student";

  return (
    <div className="bg-slate-50 text-slate-900 min-h-screen flex flex-col md:flex-row antialiased w-full">
      
      {/* Sidebar */}
      <DashboardSidebar />

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col md:ml-[260px] min-h-screen w-full">
        
        {/* Header */}
        <DashboardHeader title="Dashboard" />

        {/* Dashboard Canvas Content based on user role */}
        {role === "company" ? (
          <CompanyDashboard displayName={displayName} />
        ) : (
          <StudentDashboard displayName={displayName} />
        )}
      </div>
    </div>
  );
}

