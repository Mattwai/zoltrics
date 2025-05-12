"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const ContactForm = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    company: "",
    email: "",
    phone: "",
    message: "",
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formStatus, setFormStatus] = useState<{
    success?: boolean;
    message?: string;
  }>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormStatus({});

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setFormStatus({
          success: true,
          message: data.message || "Thank you for your interest! Our sales team will contact you shortly.",
        });
        setFormData({
          firstName: "",
          lastName: "",
          company: "",
          email: "",
          phone: "",
          message: "",
        });
      } else {
        setFormStatus({
          success: false,
          message: data.message || "Something went wrong. Please try again.",
        });
      }
    } catch (error) {
      setFormStatus({
        success: false,
        message: "An error occurred. Please try again later.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="border-2 border-neutral-800 bg-neutral-900">
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle className="text-2xl text-white">Request More Information</CardTitle>
          <CardDescription className="text-neutral-400">
            Our team will create a custom solution tailored to your business needs.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {formStatus.message && (
            <div className={`p-4 rounded-md ${formStatus.success ? "bg-green-500/20 text-green-200" : "bg-red-500/20 text-red-200"}`}>
              {formStatus.message}
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label htmlFor="firstName" className="text-sm font-medium text-neutral-300">
                First Name <span className="text-red-500">*</span>
              </label>
              <input 
                id="firstName"
                name="firstName"
                type="text" 
                value={formData.firstName}
                onChange={handleChange}
                className="rounded-md bg-neutral-800 border border-neutral-700 px-4 py-2 text-white"
                placeholder="Enter your first name" 
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="lastName" className="text-sm font-medium text-neutral-300">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input 
                id="lastName"
                name="lastName"
                type="text" 
                value={formData.lastName}
                onChange={handleChange}
                className="rounded-md bg-neutral-800 border border-neutral-700 px-4 py-2 text-white"
                placeholder="Enter your last name" 
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="company" className="text-sm font-medium text-neutral-300">
              Company <span className="text-red-500">*</span>
            </label>
            <input 
              id="company"
              name="company"
              type="text" 
              value={formData.company}
              onChange={handleChange}
              className="rounded-md bg-neutral-800 border border-neutral-700 px-4 py-2 text-white"
              placeholder="Enter your company name" 
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="email" className="text-sm font-medium text-neutral-300">
              Email <span className="text-red-500">*</span>
            </label>
            <input 
              id="email"
              name="email"
              type="email" 
              value={formData.email}
              onChange={handleChange}
              className="rounded-md bg-neutral-800 border border-neutral-700 px-4 py-2 text-white"
              placeholder="Enter your email" 
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="phone" className="text-sm font-medium text-neutral-300">
              Phone <span className="text-neutral-500 text-xs">(optional)</span>
            </label>
            <input 
              id="phone"
              name="phone"
              type="tel" 
              value={formData.phone}
              onChange={handleChange}
              className="rounded-md bg-neutral-800 border border-neutral-700 px-4 py-2 text-white"
              placeholder="Enter your phone number" 
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="message" className="text-sm font-medium text-neutral-300">
              Tell us about your needs <span className="text-neutral-500 text-xs">(optional)</span>
            </label>
            <textarea 
              id="message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              className="rounded-md bg-neutral-800 border border-neutral-700 px-4 py-2 text-white min-h-[120px]"
              placeholder="Describe your business needs and how we can help" 
            />
          </div>
        </CardContent>
        <CardFooter>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 rounded-lg text-center font-medium transition-all duration-300 bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Submitting..." : "Submit Request"}
          </button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default ContactForm; 