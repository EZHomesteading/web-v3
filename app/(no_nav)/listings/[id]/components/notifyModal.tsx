"use client";

import React, { useState } from "react";
import { Dialog } from "@headlessui/react";
import axios from "axios";
import Modal from "@/features/chat/components/modals/modal";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { PiBellRinging, PiEnvelopeSimple } from "react-icons/pi";

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

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-6">
        <div className="flex items-center justify-center mb-4">
          <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-full">
            <PiBellRinging className="w-6 h-6 text-green-600" />
          </div>
        </div>

        <Dialog.Title
          as="h3"
          className="text-xl font-semibold text-center text-gray-900 mb-2"
        >
          Get Notified When Back in Stock
        </Dialog.Title>

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

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 mt-6">
          <Button
            variant="outline"
            disabled={isLoading}
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2"
          >
            Cancel
          </Button>
          <Button
            disabled={isLoading || !text.trim()}
            onClick={onSubmit}
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
    </Modal>
  );
};

export default NotifyModal;
