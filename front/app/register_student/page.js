"use client";

import { useState } from "react";
import Link from "next/link";
import { registerStudentAction } from "./actions";

export default function RegisterPage() {
  const [passwordType, setPasswordType] = useState("password");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  const [fields, setFields] = useState({
    email: "",
    username: "",
    password: "",
    fullname: "",
    phone: "",
    university: "",
    faculty: "",
    major: "",
    study_year: "",
    profile_image: "",
    resume_url: "",
  });

  const handleTogglePassword = () => {
    setPasswordType(passwordType === "password" ? "text" : "password");
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFields((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    const result = await registerStudentAction(fields);

    setIsLoading(false);
    if (result.success) {
      setSuccess(result.message);
      // เคลียร์ฟอร์มเมื่อสำเร็จ
      setFields({ 
        email: "", username: "", password: "", fullname: "", phone: "", 
        university: "", faculty: "", major: "", study_year: "", 
        profile_image: "", resume_url: "" 
      });
    } else {
      setError(result.error);
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
            <span className="material-symbols-outlined text-white text-[32px]">work</span>
            <span className="text-white font-bold text-3xl">InternMatch</span>
          </Link>
        </div>
        
        <div className="relative z-10 w-full max-w-[448px]">
          <div className="backdrop-blur-md bg-white/10 rounded-xl p-xl border border-white/20 shadow-[0_8px_32px_0_rgba(31,38,135,0.37)]">
            <h2 className="text-white mb-md text-2xl font-bold">Start your internship journey.</h2>
            <p className="text-white/90 text-base">
              Create your profile today and find the perfect opportunity tailored to your academic background and professional interests.
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
              <span className="material-symbols-outlined text-primary text-[24px]">work</span>
              <span className="text-primary font-bold text-2xl">InternMatch</span>
            </Link>
          </div>

          <div className="text-center mb-xl">
            <h1 className="text-on-surface mb-sm text-3xl font-bold">Create Account</h1>
            <p className="text-on-surface-variant text-base">Sign up to apply for top internships.</p>
          </div>

          <div className="bg-surface rounded-xl p-lg md:p-xl shadow-[0_4px_6px_-1px_rgb(0_0_0/0.1),0_2px_4px_-2px_rgb(0_0_0/0.1)] border border-outline-variant/30">
            <form onSubmit={handleSubmit} className="space-y-lg">
              
              {/* Status Message */}
              {error && <div className="bg-red-50 text-red-600 border border-red-200 p-3 rounded-lg text-sm font-medium">{error}</div>}
              {success && <div className="bg-emerald-50 text-emerald-600 border border-emerald-200 p-3 rounded-lg text-sm font-medium">{success}</div>}

              {/* --- Section 1: Account Info --- */}
              <div className="border-b border-outline-variant/30 pb-6">
                <span className="text-xs font-bold text-primary uppercase tracking-wider block mb-4">Account Information</span>
                
                <div className="space-y-4">
                  {/* Email */}
                  <div>
                    <label className="block text-on-surface mb-sm text-sm font-semibold" htmlFor="email">Email</label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-sm"><span className="material-symbols-outlined text-outline">mail</span></div>
                      <input className="block w-full rounded-lg border border-outline-variant bg-white py-2.5 pl-[40px] pr-3 text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none text-sm" id="email" name="email" placeholder="you@example.com" required type="email" value={fields.email} onChange={handleChange} />
                    </div>
                  </div>

                  {/* Username (แก้ปัญหา Not-Null) */}
                  <div>
                    <label className="block text-on-surface mb-sm text-sm font-semibold" htmlFor="username">Username</label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-sm"><span className="material-symbols-outlined text-outline">person</span></div>
                      <input className="block w-full rounded-lg border border-outline-variant bg-white py-2.5 pl-[40px] pr-3 text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none text-sm" id="username" name="username" placeholder="hajimon01" required type="text" value={fields.username} onChange={handleChange} />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-on-surface mb-sm text-sm font-semibold" htmlFor="password">Password</label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-sm"><span className="material-symbols-outlined text-outline">lock</span></div>
                      <input className="block w-full rounded-lg border border-outline-variant bg-white py-2.5 pl-[40px] pr-[40px] text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none text-sm" id="password" name="password" placeholder="••••••••" required type={passwordType} value={fields.password} onChange={handleChange} />
                      <button className="absolute inset-y-0 right-0 flex items-center pr-sm text-outline hover:text-on-surface-variant focus:outline-none" type="button" onClick={handleTogglePassword}>
                        <span className="material-symbols-outlined">{passwordType === "password" ? "visibility" : "visibility_off"}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* --- Section 2: Student Profile --- */}
              <div className="border-b border-outline-variant/30 pb-6">
                <span className="text-xs font-bold text-primary uppercase tracking-wider block mb-4">Student Profile</span>
                
                <div className="space-y-4">
                  {/* Full Name */}
                  <div>
                    <label className="block text-on-surface mb-sm text-sm font-semibold" htmlFor="fullname">Full Name</label>
                    <input className="block w-full rounded-lg border border-outline-variant bg-white py-2.5 px-3 text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none text-sm" id="fullname" name="fullname" placeholder="John Doe" required type="text" value={fields.fullname} onChange={handleChange} />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-on-surface mb-sm text-sm font-semibold" htmlFor="phone">Phone Number</label>
                    <input className="block w-full rounded-lg border border-outline-variant bg-white py-2.5 px-3 text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none text-sm" id="phone" name="phone" placeholder="0812345678" type="tel" value={fields.phone} onChange={handleChange} />
                  </div>

                  {/* University */}
                  <div>
                    <label className="block text-on-surface mb-sm text-sm font-semibold" htmlFor="university">University</label>
                    <input className="block w-full rounded-lg border border-outline-variant bg-white py-2.5 px-3 text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none text-sm" id="university" name="university" placeholder="Chulalongkorn University" type="text" value={fields.university} onChange={handleChange} />
                  </div>

                  {/* Faculty & Major */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-on-surface mb-sm text-sm font-semibold" htmlFor="faculty">Faculty</label>
                      <input className="block w-full rounded-lg border border-outline-variant bg-white py-2.5 px-3 text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none text-sm" id="faculty" name="faculty" placeholder="Engineering" type="text" value={fields.faculty} onChange={handleChange} />
                    </div>
                    <div>
                      <label className="block text-on-surface mb-sm text-sm font-semibold" htmlFor="major">Major</label>
                      <input className="block w-full rounded-lg border border-outline-variant bg-white py-2.5 px-3 text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none text-sm" id="major" name="major" placeholder="Computer" type="text" value={fields.major} onChange={handleChange} />
                    </div>
                  </div>

                  {/* Study Year */}
                  <div>
                    <label className="block text-on-surface mb-sm text-sm font-semibold" htmlFor="study_year">Year of Study</label>
                    <select className="block w-full rounded-lg border border-outline-variant bg-white py-2.5 px-3 text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none text-sm" id="study_year" name="study_year" value={fields.study_year} onChange={handleChange}>
                      <option value="">Select Year</option>
                      <option value="1">1st Year (ปี 1)</option>
                      <option value="2">2nd Year (ปี 2)</option>
                      <option value="3">3rd Year (ปี 3)</option>
                      <option value="4">4th Year (ปี 4)</option>
                      <option value="5">Other / Graduated</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* --- Section 3: Media & Files (ฟิลด์ที่ขาด) --- */}
              <div>
                <span className="text-xs font-bold text-primary uppercase tracking-wider block mb-4">Media & Documents</span>
                
                <div className="space-y-4">
                  {/* Profile Image URL */}
                  <div>
                    <label className="block text-on-surface mb-sm text-sm font-semibold" htmlFor="profile_image">Profile Image URL</label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-sm"><span className="material-symbols-outlined text-outline">image</span></div>
                      <input className="block w-full rounded-lg border border-outline-variant bg-white py-2.5 pl-[40px] pr-3 text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none text-sm" id="profile_image" name="profile_image" placeholder="https://example.com/avatar.jpg" type="url" value={fields.profile_image} onChange={handleChange} />
                    </div>
                  </div>

                  {/* Resume URL */}
                  <div>
                    <label className="block text-on-surface mb-sm text-sm font-semibold" htmlFor="resume_url">Resume PDF URL</label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-sm"><span className="material-symbols-outlined text-outline">description</span></div>
                      <input className="block w-full rounded-lg border border-outline-variant bg-white py-2.5 pl-[40px] pr-3 text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none text-sm" id="resume_url" name="resume_url" placeholder="https://example.com/my-resume.pdf" type="url" value={fields.resume_url} onChange={handleChange} />
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
                  {isLoading ? "Processing..." : "Register Account"}
                </button>
              </div>
            </form>

            <div className="mt-lg text-center">
              <p className="text-on-surface-variant text-sm">
                Already have an account?{" "}
                <Link className="font-semibold text-primary hover:text-surface-tint transition-colors" href="/login">
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