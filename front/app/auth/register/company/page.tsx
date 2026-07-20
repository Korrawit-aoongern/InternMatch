"use client";

import { useState } from "react";
import Link from "next/link";
import { Building2, Mail, User, Lock, Eye, EyeOff, Image } from "lucide-react";
import { useRouter } from "next/navigation";
import { registerCompanyAction } from "../../register_company/actions";

export default function RegisterCompanyPage() {
  const router = useRouter();
  const [passwordType, setPasswordType] = useState("password");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  const [fields, setFields] = useState({
    email: "",
    username: "",
    password: "",
    company_name: "",
    description: "",
    website: "",
    address: "",
    province: "",
    logo: "",
  });

  const handleTogglePassword = () => {
    setPasswordType(passwordType === "password" ? "text" : "password");
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFields((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    const result = await registerCompanyAction(fields);

    setIsLoading(false);
    if (result.success) {
      setSuccess(result.message + " Redirecting to login page...");
      setFields({ 
        email: "", username: "", password: "", company_name: "", 
        description: "", website: "", address: "", province: "", logo: "" 
      });
      setTimeout(() => {
        router.push("/auth/login");
      }, 1500);
    } else {
      setError(result.error || "An error occurred");
    }
  };

  return (
    <div className="flex h-full min-h-screen flex-col lg:flex-row bg-background text-on-background">
      
      {/* Branding Section (Left) - Hidden on Mobile */}
      <div className="relative hidden w-full lg:w-1/2 lg:flex lg:flex-col lg:justify-between bg-gradient-to-br from-primary to-primary-container p-3xl overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
        <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-black/20 to-transparent"></div>
        
        <div className="relative z-10">
          <Link className="inline-flex items-center gap-sm" href="/">
            <Building2 className="w-8 h-8 text-white" />
            <span className="text-white font-bold text-3xl">InternMatch</span>
          </Link>
        </div>
        
        <div className="relative z-10 w-full max-w-[448px]">
          <div className="backdrop-blur-md bg-white/10 rounded-xl p-xl border border-white/20 shadow-[0_8px_32px_0_rgba(31,38,135,0.37)]">
            <h2 className="text-white mb-md text-2xl font-bold">Recruit top talent with AI.</h2>
            <p className="text-white/90 text-base">
              Post internship positions and discover high-potential students matching your required technical skills and corporate culture perfectly.
            </p>
          </div>
        </div>
        
        <div className="absolute -bottom-[20%] -right-[10%] w-[80%] h-[80%] rounded-full bg-white/5 blur-3xl pointer-events-none"></div>
      </div>

      {/* Register Form Section (Right) */}
      <div className="flex flex-1 flex-col justify-center px-lg py-xl lg:px-3xl my-8">
        <div className="mx-auto w-full max-w-[448px]">
          
          {/* Mobile Logo */}
          <div className="mb-2xl flex justify-center lg:hidden">
            <Link className="inline-flex items-center gap-sm" href="/">
              <Building2 className="w-6 h-6 text-primary" />
              <span className="text-primary font-bold text-2xl">InternMatch</span>
            </Link>
          </div>

          <div className="text-center mb-xl">
            <h1 className="text-on-surface mb-sm text-3xl font-bold">Company Registration</h1>
            <p className="text-on-surface-variant text-base">Create an employer account to find interns.</p>
          </div>

          <div className="bg-surface rounded-xl p-lg md:p-xl shadow-[0_4px_6px_-1px_rgb(0_0_0/0.1),0_2px_4px_-2px_rgb(0_0_0/0.1)] border border-outline-variant/30">
            <form onSubmit={handleSubmit} className="space-y-lg">
              
              {/* Status Message */}
              {error && <div className="bg-red-50 text-red-600 border border-red-200 p-3 rounded-lg text-sm font-medium">{error}</div>}
              {success && <div className="bg-emerald-50 text-emerald-600 border border-emerald-200 p-3 rounded-lg text-sm font-medium">{success}</div>}

              {/* --- Section 1: Corporate Account Info --- */}
              <div className="border-b border-outline-variant/30 pb-6">
                <span className="text-xs font-bold text-primary uppercase tracking-wider block mb-4">Account Information</span>
                
                <div className="space-y-4">
                  {/* Email */}
                  <div>
                    <label className="block text-on-surface mb-sm text-sm font-semibold" htmlFor="email">Corporate Email</label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-sm"><Mail className="w-5 h-5 text-slate-400" /></div>
                      <input className="block w-full rounded-lg border border-outline-variant bg-white py-2.5 pl-[40px] pr-3 text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none text-sm" id="email" name="email" placeholder="hr@company.com" required type="email" value={fields.email} onChange={handleChange} />
                    </div>
                  </div>

                  {/* Username */}
                  <div>
                    <label className="block text-on-surface mb-sm text-sm font-semibold" htmlFor="username">Username</label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-sm"><User className="w-5 h-5 text-slate-400" /></div>
                      <input className="block w-full rounded-lg border border-outline-variant bg-white py-2.5 pl-[40px] pr-3 text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none text-sm" id="username" name="username" placeholder="company_hr" required type="text" value={fields.username} onChange={handleChange} />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-on-surface mb-sm text-sm font-semibold" htmlFor="password">Password</label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-sm"><Lock className="w-5 h-5 text-slate-400" /></div>
                      <input className="block w-full rounded-lg border border-outline-variant bg-white py-2.5 pl-[40px] pr-[40px] text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none text-sm" id="password" name="password" placeholder="••••••••" required type={passwordType} value={fields.password} onChange={handleChange} />
                      <button className="absolute inset-y-0 right-0 flex items-center pr-sm text-outline hover:text-on-surface-variant focus:outline-none" type="button" onClick={handleTogglePassword}>
                        {passwordType === "password" ? (
                          <EyeOff className="w-5 h-5 text-slate-400 hover:text-slate-600 transition-colors" />
                        ) : (
                          <Eye className="w-5 h-5 text-slate-400 hover:text-slate-600 transition-colors" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* --- Section 2: Company Profile (ตรงตาม SQL) --- */}
              <div className="border-b border-outline-variant/30 pb-6">
                <span className="text-xs font-bold text-primary uppercase tracking-wider block mb-4">Company Profile</span>
                
                <div className="space-y-4">
                  {/* Company Name */}
                  <div>
                    <label className="block text-on-surface mb-sm text-sm font-semibold" htmlFor="company_name">Company Name</label>
                    <input className="block w-full rounded-lg border border-outline-variant bg-white py-2.5 px-3 text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none text-sm" id="company_name" name="company_name" placeholder="Google Thailand" required type="text" value={fields.company_name} onChange={handleChange} />
                  </div>

                  {/* Website */}
                  <div>
                    <label className="block text-on-surface mb-sm text-sm font-semibold" htmlFor="website">Website URL</label>
                    <input className="block w-full rounded-lg border border-outline-variant bg-white py-2.5 px-3 text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none text-sm" id="website" name="website" placeholder="https://www.google.com" type="url" value={fields.website} onChange={handleChange} />
                  </div>

                  {/* Province */}
                  <div>
                    <label className="block text-on-surface mb-sm text-sm font-semibold" htmlFor="province">Province (จังหวัด)</label>
                    <input className="block w-full rounded-lg border border-outline-variant bg-white py-2.5 px-3 text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none text-sm" id="province" name="province" placeholder="Bangkok" type="text" value={fields.province} onChange={handleChange} />
                  </div>

                  {/* Address */}
                  <div>
                    <label className="block text-on-surface mb-sm text-sm font-semibold" htmlFor="address">Full Address</label>
                    <textarea className="block w-full rounded-lg border border-outline-variant bg-white py-2.5 px-3 text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none text-sm" id="address" name="address" rows={3} placeholder="123 Sukhumvit Rd..." value={fields.address} onChange={handleChange}></textarea>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-on-surface mb-sm text-sm font-semibold" htmlFor="description">About the Company</label>
                    <textarea className="block w-full rounded-lg border border-outline-variant bg-white py-2.5 px-3 text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none text-sm" id="description" name="description" rows={3} placeholder="Brief info about your business, culture, or projects..." value={fields.description} onChange={handleChange}></textarea>
                  </div>
                </div>
              </div>

              {/* --- Section 3: Media (Logo) --- */}
              <div>
                <span className="text-xs font-bold text-primary uppercase tracking-wider block mb-4">Media & Identity</span>
                
                <div className="space-y-4">
                  {/* Logo URL */}
                  <div>
                    <label className="block text-on-surface mb-sm text-sm font-semibold" htmlFor="logo">Company Logo URL</label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-sm"><Image className="w-5 h-5 text-slate-400" /></div>
                      <input className="block w-full rounded-lg border border-outline-variant bg-white py-2.5 pl-[40px] pr-3 text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none text-sm" id="logo" name="logo" placeholder="https://example.com/logo.png" type="url" value={fields.logo} onChange={handleChange} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div>
                <button 
                  disabled={isLoading}
                  className="flex w-full justify-center rounded-lg bg-primary-container py-3 text-on-primary shadow-sm hover:bg-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 text-sm font-semibold disabled:opacity-50" 
                  type="submit"
                >
                  {isLoading ? "Processing..." : "Register Company"}
                </button>
              </div>
            </form>

            <div className="mt-lg text-center">
              <p className="text-on-surface-variant text-sm">
                Already have an account?{" "}
                <Link className="text-blue-600 font-semibold hover:underline" href="/auth/login">
                  Sign In
                </Link>
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
