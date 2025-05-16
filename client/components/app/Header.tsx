"use client";

import { useEffect } from "react";
import Link from "next/link";
import Cookies from "js-cookie";
import { UserIcon } from "../icons/user";
import { getUserByEmail } from "@/services/user";
import { useUser } from "@/jotai";
import GoogleLoginButton from "./GoogleLoginButton";

const Header = () => {
  const { user, initializeUser, clearUser } = useUser();

  const settingUserData = async (email: string) => {
    const user = await getUserByEmail(email);
    if (user) {
      initializeUser(user);
    } else {
      clearUser();
    }
  };

  useEffect(() => {
    const userEmail = Cookies.get("user_email");
    if (userEmail) {
      settingUserData(userEmail);
    }
  }, []);

  return (
    <>
      <header className="border-b w-full h-14 bg-black z-50">
        <div className="container mx-auto flex max-w-screen-lg items-center justify-between px-2 py-3">
          <Link
            href="/"
            className="cursor-pointer text-xl font-bold text-white"
          >
            Lyricium
          </Link>

          <div className="flex items-center space-x-6 relative text-white">
            {user ? (
              <div className="flex justify-center items-center space-x-2 text-white">
                {user.image ? (
                  <img
                    src={user.image ?? ``}
                    alt=""
                    style={{
                      borderRadius: "50px",
                      width: "20px",
                      height: "20px",
                      marginLeft: "10px",
                    }}
                  />
                ) : (
                  <UserIcon className="w-8 h-8" />
                )}
                <p className="text-xs text-white">{user.display_name}</p>
              </div>
            ) : (
              <GoogleLoginButton settingUserData={settingUserData} />
            )}
          </div>
        </div>
      </header>
    </>
  );
};

export default Header;
