"use client";

import { useState } from "react";
import Image from "next/image";

export interface Testimonial {
  quote?: string;
  text?: string; // Alternative to quote
  author: string;
  role: string;
  company: string;
  avatarSrc?: string;
  handle?: string;
}

interface SignInPageProps {
  onSubmit: (email: string, password: string) => Promise<void>;
  testimonials?: Testimonial[];
  logoUrl?: string;
  brandName?: string;
}

export function SignInPage({
  onSubmit,
  testimonials = [],
  logoUrl = "/logo.jpeg",
  brandName = "Main TMS",
}: SignInPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await onSubmit(email, password);
    } catch (err: any) {
      setError(err.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Sign In Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md space-y-8 animate-fade-in">
          {/* Logo and Brand */}
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <img
                src={logoUrl}
                alt={brandName}
                className="h-16 w-auto"
              />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 gradient-text">
              Welcome to {brandName}
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              AI-Powered Transportation Management System
            </p>
          </div>

          {/* Sign In Form */}
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm animate-fade-in">
                {error}
              </div>
            )}

            <div className="space-y-4">
              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  placeholder="Enter your email"
                />
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  placeholder="Enter your password"
                />
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="remember-me"
                  className="ml-2 block text-sm text-gray-700"
                >
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <a
                  href="#"
                  className="font-semibold text-green-600 hover:text-green-500 transition-colors"
                >
                  Forgot password?
                </a>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-lg text-base font-semibold text-white bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ripple-effect"
            >
              {loading ? (
                <>
                  <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                  Signing in...
                </>
              ) : (
                "Sign in"
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="text-center text-sm text-gray-600">
            Don't have an account?{" "}
            <a
              href="#"
              className="font-semibold text-green-600 hover:text-green-500 transition-colors"
            >
              Contact your administrator
            </a>
          </div>
        </div>
      </div>

      {/* Right Side - Testimonials/Features */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-green-600 via-green-500 to-emerald-600 p-12 items-center justify-center relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full translate-x-1/3 translate-y-1/3"></div>
        </div>

        <div className="relative z-10 max-w-lg space-y-8">
          {/* Main Message */}
          <div className="text-white space-y-4 animate-fade-in">
            <h2 className="text-4xl font-bold">
              The Future of Trucking Management
            </h2>
            <p className="text-lg text-green-50">
              Streamline your operations with AI-powered dispatch, real-time tracking, and intelligent automation.
            </p>
          </div>

          {/* Features */}
          <div className="space-y-4">
            {[
              {
                icon: "🚛",
                title: "Smart Dispatch",
                description: "Drag-and-drop load assignment with real-time updates",
              },
              {
                icon: "🗺️",
                title: "Commercial Routing",
                description: "Truck-optimized routes that avoid restricted roads",
              },
              {
                icon: "✅",
                title: "Fraud Prevention",
                description: "Live FMCSA broker verification integrated",
              },
              {
                icon: "💰",
                title: "Smart Invoicing",
                description: "Automated billing and payment tracking",
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="flex items-start space-x-4 bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-4 hover-lift"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <span className="text-3xl">{feature.icon}</span>
                <div>
                  <h3 className="text-white font-semibold">{feature.title}</h3>
                  <p className="text-green-50 text-sm">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Testimonials */}
          {testimonials.length > 0 && (
            <div className="mt-12 space-y-6">
              {testimonials.map((testimonial, index) => (
                <TestimonialCard key={index} {...testimonial} />
              ))}
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-white">95%</div>
              <div className="text-sm text-green-50">Complete</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white">25+</div>
              <div className="text-sm text-green-50">Features</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white">AI</div>
              <div className="text-sm text-green-50">Powered</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function TestimonialCard({ quote, text, author, role, company, avatarSrc, handle }: Testimonial) {
  const testimonialText = quote || text || "";
  
  return (
    <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6 border border-white border-opacity-20 animate-fade-in">
      <p className="text-white text-sm italic mb-4">"{testimonialText}"</p>
      <div className="flex items-center space-x-3">
        {avatarSrc ? (
          <img
            src={avatarSrc}
            alt={author}
            className="w-10 h-10 rounded-full object-cover border-2 border-white border-opacity-30"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-white bg-opacity-20 flex items-center justify-center text-white font-bold">
            {author.charAt(0)}
          </div>
        )}
        <div className="flex-1">
          <p className="text-white font-semibold text-sm">{author}</p>
          <p className="text-green-50 text-xs">
            {role} at {company}
          </p>
          {handle && (
            <p className="text-green-100 text-xs opacity-75 mt-0.5">{handle}</p>
          )}
        </div>
      </div>
    </div>
  );
}
