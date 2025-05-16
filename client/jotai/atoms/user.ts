// import { PostUserType } from "@/services/user";
import { UserType } from "@/services/user";
import { atom } from "jotai";

export const userAtom = atom<UserType | null>(null);
