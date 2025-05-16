import { useSession, signIn, signOut } from "next-auth/react";
import { Button } from "../ui/button";
import { GoogleLogo } from "../icons/google";
import { createUser } from "@/services/user";
import { useEffect } from "react";

function Login() {
  const { data: session, status } = useSession();

  const googleLogin = async () => {
    await signIn("google", {}, { prompt: "login" });
  };

  if (status === "loading") {
    return <div>Loading...</div>;
  }

  if (status !== "authenticated") {
    return (
      <div>
        <Button
          className="flex justify-center items-center"
          onClick={() => googleLogin()}
        >
          <GoogleLogo />
          <span className="ml-2">Googleでログイン</span>
        </Button>
      </div>
    );
  }
  return null;
}

function Logout() {
  const { data: session, status } = useSession();

  if (status === "authenticated") {
    return (
      <div>
        <Button
          className="flex justify-center items-center"
          onClick={() => signOut()}
        >
          ログアウト
        </Button>
      </div>
    );
  }
  return null;
}

interface Props {
  settingUserData: (token: string) => void;
}

const GoogleLoginButton = (props: Props) => {
  const { settingUserData } = props;
  const { data: session, status } = useSession();

  const postUser = async () => {
    const user = {
      name: session?.user?.name ?? "",
      display_name: session?.user?.name ?? "",
      email: session?.user?.email ?? "",
      image: session?.user?.image ?? "",
    };
    const res = await createUser(user);
    if (res) {
      document.cookie = `user_email=${res.email}`;
      document.cookie = `user_token=${res.name}`;
      document.cookie = `user_name=${res.display_name}`;
      document.cookie = `user_image=${res.image}`;
      settingUserData(res.token);
    }
  };

  useEffect(() => {
    if (session?.user?.email !== undefined && status === "authenticated") {
      postUser();
    }
  }, [session, status]);

  return (
    <div>
      {status === "authenticated" ? (
        <div className="flex items-center">
          {/* <p>{session.user?.name}</p>
          <img
            src={session.user?.image ?? ``}
            alt=""
            style={{
              borderRadius: "50px",
              width: "40px",
              height: "40px",
              marginLeft: "10px",
            }}
          /> */}
          {/* <div>
						<Logout />
					</div> */}
        </div>
      ) : (
        <Login />
      )}
    </div>
  );
};

export default GoogleLoginButton;
