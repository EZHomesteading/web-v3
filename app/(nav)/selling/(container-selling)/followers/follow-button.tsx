"use client";
//follow button component
import axios from "axios";
import { useRouter } from "next/navigation";
import { RiUserFollowLine } from "react-icons/ri";
import { RiUserUnfollowLine } from "react-icons/ri";
import { toast } from "sonner";
import { OutfitFont } from "@/components/fonts";
import Toast from "@/components/ui/toast";
import Link from "next/link";

interface FollowButtonProps {
  followUserId: string;
  following:
    | {
        id: string;
        userId: string;
        follows: string[];
      }
    | null
    | undefined;
}

const FollowButton = ({ followUserId, following }: FollowButtonProps) => {
  const router = useRouter();
  function checkStringMatch(str: string, arr: string[]) {
    if (typeof str !== "string" || !Array.isArray(arr)) {
      throw new Error(
        "Invalid input: str must be a string and arr must be an array"
      );
    }
    const lowercaseStr = str.toLowerCase();
    const matchFound = arr.some((item) => item.toLowerCase() === lowercaseStr);
    return matchFound;
  }

  if (
    following === null ||
    following === undefined ||
    checkStringMatch(followUserId, following.follows) === false
  ) {
    const handleFollow = async () => {
      console.log(following);
      if (following?.userId === null || following === undefined) {
        Toast({
          message: "Please sign in to add items to your basket",
          details: (
            <Link
              href={`/auth/login?callbackUrl=${window.location}`} // Fixed potential typo: listing?.Id -> listing?.id
              className={`text-sky-400 underline font-light`}
            >
              Sign in here
            </Link>
          ),
        });
        return;
      } else if (following?.userId === followUserId) {
        toast.error("Can't follow yourself.");
        return;
      }
      await axios.post(`/api/useractions/follow/`, {
        follows: followUserId,
      });
      router.refresh();
    };

    return (
      <div
        onClick={handleFollow}
        className={`${OutfitFont.className} bg-slate-300  text-xl 
            font-semibold  rounded-full flex py-2 px-2 ml-1 hover:cursor-pointer items-center w-fit`}
      >
        <RiUserFollowLine size={24} />
        <div
          className="pl-1 text-xl 
            font-semibold"
        >
          Follow
        </div>
      </div>
    );
  } else {
    const handleUnfollow = async () => {
      await axios.post(`/api/useractions/follow/unfollow`, {
        follows: followUserId,
      });
      router.refresh();
    };

    return (
      <div
        onClick={handleUnfollow}
        className={`${OutfitFont.className} bg-slate-300   text-xl 
            font-semibold  rounded-full flex py-2 px-2 ml-1 hover:cursor-pointer items-center w-fit`}
      >
        <RiUserUnfollowLine size={24} />
        <div
          className="pl-1 text-xl 
            font-semibold"
        >
          {" "}
          Following
        </div>
      </div>
    );
  }
};

export default FollowButton;
