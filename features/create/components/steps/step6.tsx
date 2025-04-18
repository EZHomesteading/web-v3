"use client";
import React from "react";
import Image from "next/image";
import { BsBucket } from "react-icons/bs";
import { Label } from "../../../../components/ui/label";
import { CiImageOn } from "react-icons/ci";
import { SimpleUploadButton } from "../../utils/image-upload-button";

interface StepSixProps {
  image: string[];
  setimage: (images: string[]) => void;
  imageStates: { isHovered: boolean; isFocused: boolean }[];
  handleMouseEnter: (index: number) => void;
  handleMouseLeave: (index: number) => void;
  handleClick: (index: number) => void;
}

const StepSix: React.FC<StepSixProps> = ({
  image,
  setimage,
  imageStates,
  handleMouseEnter,
  handleMouseLeave,
  handleClick,
}) => {
  const handleImageUpload = (url: string) => {
    const newimage = [...image];
    const emptyIndex = newimage.findIndex((src) => !src);
    if (emptyIndex !== -1) {
      newimage[emptyIndex] = url;
    } else {
      newimage.push(url);
    }
    setimage(newimage);
    console.log("Image uploaded:", url);
    console.log("Updated images:", newimage);
  };

  const handleImageDelete = (index: number) => {
    const newimage = image.filter((src, i) => i !== index && src !== "");
    while (newimage.length < 3) {
      newimage.push("");
    }
    setimage(newimage);
    console.log("Image deleted at index:", index);
    console.log("Updated images:", newimage);
  };

  console.log("Current images:", image);

  return (
    <div className="flex flex-col gap-4 min-h-screen fade-in pt-[10%]">
      <div className="flex flex-row justify-center items-start gap-2">
        <div className="w-full sm:max-w-[500px] px-4">
          <div className="flex flex-col">
            <Label className="text-xl w-full font-light m-0 !leading-0">
              Take or Add Photos of your Product
            </Label>
            <div className="text-xs font-extralight text-neutral-500 mb-2">
              Actual photos are preferred over images from the web. Click upload
              image to capture or add a photo.
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[0, 1, 2].map((index) => (
                <div
                  key={index}
                  className={`relative aspect-square shadow-sm transition-transform duration-300 rounded-xl ${
                    imageStates[index].isHovered ? "" : ""
                  } ${imageStates[index].isFocused ? "z-10" : "z-0"}`}
                  onMouseEnter={() => handleMouseEnter(index)}
                  onMouseLeave={() => handleMouseLeave(index)}
                  onClick={() => handleClick(index)}
                >
                  {image[index] ? (
                    <>
                      <Image
                        src={image[index]}
                        fill
                        alt={`Listing Image ${index + 1}`}
                        className="object-cover rounded-xl"
                      />
                      <button
                        className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleImageDelete(index);
                        }}
                      >
                        <BsBucket size={16} />
                      </button>
                    </>
                  ) : (
                    <div className="flex items-center justify-center rounded-xl border-dashed border-2 border-gray-300 h-full bg-gray-50">
                      <CiImageOn size={40} className="text-gray-400" />
                    </div>
                  )}
                </div>
              ))}
              <div className="flex items-center justify-center rounded-xl border-dashed border-2 border-gray-300 aspect-square bg-gray-50">
                <SimpleUploadButton onUploadComplete={handleImageUpload} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StepSix;
