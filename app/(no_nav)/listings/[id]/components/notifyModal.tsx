"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { PiBellRinging, PiEnvelopeSimple, PiX } from "react-icons/pi";

interface ConfirmModalProps {
  isOpen?: boolean;
  onClose: () => void;
  listingId: string;
  userEmail?: string;
}

const NotifyModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  listingId,
  userEmail,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [text, setText] = React.useState(userEmail || "");
  const [isFocused, setIsFocused] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Ensure we're mounted before rendering portal
  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent body scroll when modal is open and handle escape key
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";

      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          onClose();
        }
      };

      document.addEventListener("keydown", handleEscape);

      return () => {
        document.body.style.overflow = "unset";
        document.removeEventListener("keydown", handleEscape);
      };
    } else {
      document.body.style.overflow = "unset";
    }
  }, [isOpen, onClose]);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setText(e.target.value);
  };

  function isValidEmail(testText: string) {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(testText);
  }

  const onSubmit = async () => {
    if (text === "") {
      toast.error("Please enter your email address");
      return;
    }
    if (isValidEmail(text) === false) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsLoading(true);
    try {
      await axios.post("/api/listing/emailSub", {
        id: listingId,
        email: text,
      });
      toast.success("You'll be notified when this item is back in stock!");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Something went wrong");
    } finally {
      setIsLoading(false);
      onClose();
    }
  };

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
      style={{
        zIndex: 2147483647, // Maximum z-index value - same as quantity modal
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      }}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      onMouseDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
    >
      <div
        className="bg-white rounded-xl max-w-md w-full mx-4 max-h-[90vh] flex flex-col"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
      >
        {/* Header with X button */}
        <div className="flex justify-between items-start p-6 pb-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-full">
              <PiBellRinging className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">
                Get Notified When Back in Stock
              </h3>
            </div>
          </div>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClose();
            }}
            className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
          >
            <PiX size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-2 min-h-0">
          <p className="text-sm text-gray-600 text-center mb-6">
            We'll send you an email as soon as this item becomes available again
          </p>

          <div className="space-y-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <PiEnvelopeSimple className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="email"
                placeholder="Enter your email address"
                className={`w-full pl-10 pr-4 py-3 border-2 rounded-md text-sm transition-colors focus:outline-none ${
                  isFocused
                    ? "border-green-400 ring-2 ring-green-100"
                    : "border-gray-200 hover:border-gray-300"
                }`}
                value={text}
                onChange={handleTextChange}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                disabled={isLoading}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 p-6 pt-4 border-t border-gray-100 flex-shrink-0">
          <Button
            variant="outline"
            disabled={isLoading}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClose();
            }}
            className="w-full sm:w-auto px-6 py-2"
          >
            Cancel
          </Button>
          <Button
            disabled={isLoading || !text.trim()}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onSubmit();
            }}
            className="w-full sm:w-auto px-6 py-2 bg-green-400 hover:bg-green-500 text-white font-semibold shadow-sm transition-colors"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Subscribing...
              </div>
            ) : (
              "Notify Me"
            )}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default NotifyModal;
