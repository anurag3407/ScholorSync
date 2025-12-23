"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, User, GraduationCap, Home, FileText, CheckCircle } from "lucide-react";

const states = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
];

const categories = ["General", "OBC", "SC", "ST", "EWS"];

const educationLevels = [
  "Class 10", "Class 12", "Undergraduate", "Postgraduate", "PhD", "Diploma", "ITI"
];

const branches = [
  "Computer Science", "Electronics", "Mechanical", "Civil", "Electrical",
  "Chemical", "Biotechnology", "Information Technology", "Arts", "Commerce",
  "Science", "Medicine", "Law", "Management", "Agriculture", "Other"
];

const years = ["1st Year", "2nd Year", "3rd Year", "4th Year", "5th Year", "Completed"];

export default function ProfilePage() {
  const { user, loading: authLoading, isConfigured } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [profileComplete, setProfileComplete] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    dateOfBirth: "",
    gender: "",
    phone: "",
    email: "",
    aadhaarNumber: "",
    fatherName: "",
    motherName: "",
    state: "",
    district: "",
    address: "",
    pincode: "",
    category: "",
    religion: "",
    annualFamilyIncome: "",
    isBPL: false,
    educationLevel: "",
    currentCourse: "",
    branch: "",
    year: "",
    institutionName: "",
    institutionType: "",
    boardUniversity: "",
    percentageScore: "",
    backlogCount: "0",
    achievements: "",
    skills: "",
    extracurricular: ""
  });

  useEffect(() => {
    if (!authLoading && !user && isConfigured) {
      router.push("/auth/login");
    }
  }, [user, authLoading, router, isConfigured]);

  useEffect(() => {
    async function loadProfile() {
      if (!user) return;
      try {
        const response = await fetch(`/api/profile?uid=${user.uid}`);
        if (response.ok) {
          const data = await response.json();
          if (data.profile) {
            setFormData(prev => ({ ...prev, ...data.profile }));
            setProfileComplete(data.profile.isComplete || false);
          }
        }
      } catch (error) {
        console.error("Error loading profile:", error);
      } finally {
        setLoadingProfile(false);
      }
    }
    if (user) {
      loadProfile();
    } else if (!authLoading) {
      setLoadingProfile(false);
    }
  }, [user, authLoading]);

  const updateField = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const response = await fetch("/api/profile/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: user.uid,
          profile: { ...formData, isComplete: true }
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Profile saved successfully!");
        setProfileComplete(true);
        router.push("/dashboard");
      } else {
        const errorMessage = data.error || "Failed to save profile";
        toast.error(errorMessage);
        console.error("Profile update failed:", data);
      }
    } catch (error) {
      toast.error("Failed to save profile. Please check your connection and try again.");
      console.error("Profile update error:", error);
    } finally {
      setSaving(false);
    }
  };

  const nextStep = () => setStep(prev => Math.min(prev + 1, 4));
  const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

  if (authLoading || loadingProfile) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isConfigured) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Configuration Required</CardTitle>
            <CardDescription>
              Firebase is not configured. Please set up environment variables.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const steps = [
    { number: 1, title: "Personal", icon: User },
    { number: 2, title: "Family", icon: Home },
    { number: 3, title: "Education", icon: GraduationCap },
    { number: 4, title: "Additional", icon: FileText }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">
          {profileComplete ? "Edit Profile" : "Complete Your Profile"}
        </h1>
        <p className="text-muted-foreground mt-1">
          {profileComplete 
            ? "Update your information to get better scholarship matches"
            : "Fill in your details to get personalized scholarship recommendations"
          }
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between">
        {steps.map((s, index) => (
          <div key={s.number} className="flex items-center">
            <div
              className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
                step >= s.number
                  ? "bg-primary border-primary text-primary-foreground"
                  : "border-muted-foreground text-muted-foreground"
              }`}
            >
              {step > s.number ? (
                <CheckCircle className="h-5 w-5" />
              ) : (
                <s.icon className="h-5 w-5" />
              )}
            </div>
            <span className={`ml-2 text-sm font-medium ${
              step >= s.number ? "text-primary" : "text-muted-foreground"
            }`}>
              {s.title}
            </span>
            {index < steps.length - 1 && (
              <div className={`w-12 md:w-24 h-0.5 mx-2 ${
                step > s.number ? "bg-primary" : "bg-muted"
              }`} />
            )}
          </div>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {step === 1 && "Personal Information"}
            {step === 2 && "Family Details"}
            {step === 3 && "Educational Background"}
            {step === 4 && "Additional Information"}
          </CardTitle>
          <CardDescription>
            {step === 1 && "Basic personal details for identification"}
            {step === 2 && "Family and economic background information"}
            {step === 3 && "Your current education details"}
            {step === 4 && "Achievements and extra details"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Step 1: Personal Information */}
          {step === 1 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => updateField("fullName", e.target.value)}
                  placeholder="Enter your full name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => updateField("dateOfBirth", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender">Gender *</Label>
                <Select value={formData.gender} onValueChange={(v) => updateField("gender", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                  placeholder="10-digit mobile number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  placeholder="your@email.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="aadhaarNumber">Aadhaar Number</Label>
                <Input
                  id="aadhaarNumber"
                  value={formData.aadhaarNumber}
                  onChange={(e) => updateField("aadhaarNumber", e.target.value)}
                  placeholder="12-digit Aadhaar number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State *</Label>
                <Select value={formData.state} onValueChange={(v) => updateField("state", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    {states.map((state) => (
                      <SelectItem key={state} value={state}>{state}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="district">District *</Label>
                <Input
                  id="district"
                  value={formData.district}
                  onChange={(e) => updateField("district", e.target.value)}
                  placeholder="Enter your district"
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="address">Full Address</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => updateField("address", e.target.value)}
                  placeholder="Enter your complete address"
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pincode">PIN Code</Label>
                <Input
                  id="pincode"
                  value={formData.pincode}
                  onChange={(e) => updateField("pincode", e.target.value)}
                  placeholder="6-digit PIN code"
                />
              </div>
            </div>
          )}

          {/* Step 2: Family Details */}
          {step === 2 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fatherName">Father's Name *</Label>
                <Input
                  id="fatherName"
                  value={formData.fatherName}
                  onChange={(e) => updateField("fatherName", e.target.value)}
                  placeholder="Enter father's name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="motherName">Mother's Name *</Label>
                <Input
                  id="motherName"
                  value={formData.motherName}
                  onChange={(e) => updateField("motherName", e.target.value)}
                  placeholder="Enter mother's name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select value={formData.category} onValueChange={(v) => updateField("category", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="religion">Religion</Label>
                <Select value={formData.religion} onValueChange={(v) => updateField("religion", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select religion" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hindu">Hindu</SelectItem>
                    <SelectItem value="muslim">Muslim</SelectItem>
                    <SelectItem value="christian">Christian</SelectItem>
                    <SelectItem value="sikh">Sikh</SelectItem>
                    <SelectItem value="buddhist">Buddhist</SelectItem>
                    <SelectItem value="jain">Jain</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="annualFamilyIncome">Annual Family Income (INR) *</Label>
                <Select value={formData.annualFamilyIncome} onValueChange={(v) => updateField("annualFamilyIncome", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select income range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="below-1lakh">Below ₹1,00,000</SelectItem>
                    <SelectItem value="1-2.5lakh">₹1,00,000 - ₹2,50,000</SelectItem>
                    <SelectItem value="2.5-5lakh">₹2,50,000 - ₹5,00,000</SelectItem>
                    <SelectItem value="5-8lakh">₹5,00,000 - ₹8,00,000</SelectItem>
                    <SelectItem value="8-10lakh">₹8,00,000 - ₹10,00,000</SelectItem>
                    <SelectItem value="above-10lakh">Above ₹10,00,000</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="isBPL" className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    id="isBPL"
                    checked={formData.isBPL as boolean}
                    onChange={(e) => updateField("isBPL", e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  <span>BPL (Below Poverty Line) Card Holder</span>
                </Label>
              </div>
            </div>
          )}

          {/* Step 3: Education Details */}
          {step === 3 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="educationLevel">Current Education Level *</Label>
                <Select value={formData.educationLevel} onValueChange={(v) => updateField("educationLevel", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select education level" />
                  </SelectTrigger>
                  <SelectContent>
                    {educationLevels.map((level) => (
                      <SelectItem key={level} value={level}>{level}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="currentCourse">Course/Stream Name *</Label>
                <Input
                  id="currentCourse"
                  value={formData.currentCourse}
                  onChange={(e) => updateField("currentCourse", e.target.value)}
                  placeholder="e.g., B.Tech, BA, MBBS"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="branch">Branch/Specialization</Label>
                <Select value={formData.branch} onValueChange={(v) => updateField("branch", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select branch" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((branch) => (
                      <SelectItem key={branch} value={branch}>{branch}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="year">Current Year *</Label>
                <Select value={formData.year} onValueChange={(v) => updateField("year", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((year) => (
                      <SelectItem key={year} value={year}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="institutionName">Institution Name *</Label>
                <Input
                  id="institutionName"
                  value={formData.institutionName}
                  onChange={(e) => updateField("institutionName", e.target.value)}
                  placeholder="Enter your college/school name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="institutionType">Institution Type</Label>
                <Select value={formData.institutionType} onValueChange={(v) => updateField("institutionType", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="government">Government</SelectItem>
                    <SelectItem value="private">Private</SelectItem>
                    <SelectItem value="aided">Government Aided</SelectItem>
                    <SelectItem value="autonomous">Autonomous</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="boardUniversity">Board/University</Label>
                <Input
                  id="boardUniversity"
                  value={formData.boardUniversity}
                  onChange={(e) => updateField("boardUniversity", e.target.value)}
                  placeholder="e.g., CBSE, State Board, VTU"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="percentageScore">Percentage/CGPA *</Label>
                <Input
                  id="percentageScore"
                  value={formData.percentageScore}
                  onChange={(e) => updateField("percentageScore", e.target.value)}
                  placeholder="e.g., 85% or 8.5 CGPA"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="backlogCount">Active Backlogs</Label>
                <Input
                  id="backlogCount"
                  type="number"
                  min="0"
                  value={formData.backlogCount}
                  onChange={(e) => updateField("backlogCount", e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>
          )}

          {/* Step 4: Additional Information */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="achievements">Achievements & Awards</Label>
                <Textarea
                  id="achievements"
                  value={formData.achievements}
                  onChange={(e) => updateField("achievements", e.target.value)}
                  placeholder="List your academic achievements, awards, certifications, etc."
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="skills">Skills</Label>
                <Textarea
                  id="skills"
                  value={formData.skills}
                  onChange={(e) => updateField("skills", e.target.value)}
                  placeholder="Technical skills, languages known, software proficiency, etc."
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="extracurricular">Extracurricular Activities</Label>
                <Textarea
                  id="extracurricular"
                  value={formData.extracurricular}
                  onChange={(e) => updateField("extracurricular", e.target.value)}
                  placeholder="Sports, clubs, volunteering, leadership roles, etc."
                  rows={3}
                />
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-6">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={step === 1}
            >
              Previous
            </Button>
            {step < 4 ? (
              <Button onClick={nextStep}>
                Next
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Profile"
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
