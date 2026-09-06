"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { Briefcase, Mail, User, Lock, Image, FileText, Upload, Trash2, Loader2, Eye, Camera } from "lucide-react";
import { useRouter } from "next/navigation";
import { registerUser, uploadResume, uploadProfileImage } from "@/lib/actions/auth";
import FormInput from "@/components/ui/FormInput";

export default function RegisterPage() {
  const router = useRouter();
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
    resume_path: "",
    resume_url: "",
  });

  const resumeInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingResume, setIsUploadingResume] = useState(false);
  const profileImageInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingProfileImage, setIsUploadingProfileImage] = useState(false);

  const handleResumeUploadClick = () => {
    resumeInputRef.current?.click();
  };

  const handleProfileImageUploadClick = () => {
    profileImageInputRef.current?.click();
  };

  const handleProfileImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setIsUploadingProfileImage(true);
    try {
      const res = await uploadProfileImage(formData);
      if (res.success && res.url) {
        setFields((prev) => ({
          ...prev,
          profile_image: res.url || "",
        }));
      } else {
        alert("Upload failed: " + res.error);
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("An error occurred during file upload.");
    } finally {
      setIsUploadingProfileImage(false);
    }
  };

  const handleDeleteProfileImage = () => {
    setFields((prev) => ({
      ...prev,
      profile_image: "",
    }));
  };

  const handleResumeFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert("ขนาดไฟล์ Resume เกินกำหนด (ไม่เกิน 10MB)");
      if (e.target) e.target.value = "";
      return;
    }

    if (!file.name.toLowerCase().endsWith(".pdf") && file.type !== "application/pdf") {
      alert("กรุณาอัปโหลดไฟล์ Resume ในรูปแบบ PDF เท่านั้น");
      if (e.target) e.target.value = "";
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setIsUploadingResume(true);
    try {
      const res = await uploadResume(formData);
      if (res.success && res.url) {
        setFields((prev) => ({
          ...prev,
          resume_path: res.path || "",
          resume_url: res.url || "",
        }));
      } else {
        alert("Upload failed: " + res.error);
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("An error occurred during file upload.");
    } finally {
      setIsUploadingResume(false);
    }
  };

  const handleDeleteResume = () => {
    if (confirm("Are you sure you want to delete your resume?")) {
      setFields((prev) => ({
        ...prev,
        resume_path: "",
        resume_url: "",
      }));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFields((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    const result = await registerUser(fields, "student");

    setIsLoading(false);
    if (result.success) {
      setSuccess(result.message + " Redirecting to login page...");
      // เคลียร์ฟอร์มเมื่อสำเร็จ
      setFields({ 
        email: "", username: "", password: "", fullname: "", phone: "", 
        university: "", faculty: "", major: "", study_year: "", 
        profile_image: "", resume_path: "", resume_url: "" 
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
            <Briefcase className="w-8 h-8 text-white" />
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
              <Briefcase className="w-6 h-6 text-primary" />
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
                  <FormInput
                    label="Email"
                    id="email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    required
                    value={fields.email}
                    onChange={handleChange}
                    icon={Mail}
                  />

                  <FormInput
                    label="Username"
                    id="username"
                    name="username"
                    type="text"
                    placeholder="hajimon01"
                    required
                    value={fields.username}
                    onChange={handleChange}
                    icon={User}
                  />

                  <FormInput
                    label="Password"
                    id="password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    required
                    value={fields.password}
                    onChange={handleChange}
                    icon={Lock}
                  />
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
                  <div>
                    <label className="block text-on-surface mb-sm text-sm font-semibold">Profile Image</label>
                    {fields.profile_image ? (
                      <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/60 flex items-center justify-between">
                        <div className="flex items-center gap-3 overflow-hidden mr-2">
                          <div className="w-12 h-12 rounded-full overflow-hidden border border-slate-200 bg-slate-100 flex-shrink-0">
                            <img
                              src={fields.profile_image}
                              alt="Profile Preview"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="truncate">
                            <p className="text-xs font-bold text-slate-800 truncate">
                              Image Uploaded
                            </p>
                            <p className="text-[10px] text-slate-400 truncate">
                              {fields.profile_image}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={handleDeleteProfileImage}
                            className="text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 text-xs font-bold p-1.5 rounded-lg transition-colors"
                            title="Delete Image"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div 
                        onClick={handleProfileImageUploadClick}
                        className="border-2 border-dashed border-slate-200 hover:border-blue-400 bg-slate-50 hover:bg-blue-50/20 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all text-center group animate-fade-in"
                      >
                        {isUploadingProfileImage ? (
                          <div className="flex flex-col items-center gap-2">
                            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                            <p className="text-xs font-bold text-slate-500">Uploading...</p>
                          </div>
                        ) : (
                          <>
                            <div className="bg-slate-100 group-hover:bg-blue-100 text-slate-400 group-hover:text-blue-600 p-2.5 rounded-full transition-colors mb-2">
                              <Camera className="w-5 h-5" />
                            </div>
                            <p className="text-xs font-bold text-slate-700">Click to upload image</p>
                            <p className="text-[10px] text-slate-400 mt-1">PNG, JPG, or GIF</p>
                          </>
                        )}
                      </div>
                    )}
                    <input
                      type="file"
                      ref={profileImageInputRef}
                      onChange={handleProfileImageChange}
                      accept="image/*"
                      className="hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-on-surface mb-sm text-sm font-semibold">Resume File</label>
                    {fields.resume_path ? (
                      <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/60 flex items-center justify-between">
                        <div className="flex items-center gap-3 overflow-hidden mr-2">
                          <div className="bg-red-100 text-red-600 p-2 rounded-lg flex-shrink-0">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div className="truncate">
                            <p className="text-xs font-bold text-slate-800 truncate">
                              {fields.resume_path.split("/").pop()}
                            </p>
                            <p className="text-[10px] text-slate-400 truncate">
                              {fields.resume_path}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <a
                            href={fields.resume_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 text-xs font-bold px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            View
                          </a>
                          <button
                            type="button"
                            onClick={handleDeleteResume}
                            className="text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 text-xs font-bold p-1.5 rounded-lg transition-colors"
                            title="Delete Resume"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div 
                        onClick={handleResumeUploadClick}
                        className="border-2 border-dashed border-slate-200 hover:border-blue-400 bg-slate-50 hover:bg-blue-50/20 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all text-center group"
                      >
                        {isUploadingResume ? (
                          <div className="flex flex-col items-center gap-2">
                            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                            <p className="text-xs font-bold text-slate-500">Uploading...</p>
                          </div>
                        ) : (
                          <>
                            <div className="bg-slate-100 group-hover:bg-blue-100 text-slate-400 group-hover:text-blue-600 p-2.5 rounded-full transition-colors mb-2">
                              <Upload className="w-5 h-5" />
                            </div>
                            <p className="text-xs font-bold text-slate-700">Click to upload resume</p>
                            <p className="text-[10px] text-slate-400 mt-1">PDF, Word, or images</p>
                          </>
                        )}
                      </div>
                    )}
                    <input
                      type="file"
                      ref={resumeInputRef}
                      onChange={handleResumeFileChange}
                      accept=".pdf,.doc,.docx,image/*"
                      className="hidden"
                    />
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
