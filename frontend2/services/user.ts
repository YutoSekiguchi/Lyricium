const USER_API_URL = `${process.env.API_URL}/users`;

export type PostUserType = {
  email: string;
  name: string;
  display_name: string;
  image: string;
};

export type UserType = {
  id: number;
  email: string;
  name: string;
  display_name: string;
  image: string;
  created_at: string;
};

export const getAllUsers = async () => {
  const url = `${USER_API_URL}/get/all`;
  try {
  const res = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) {
    console.log(res);
    return null;
  }
  const data = await res.json();
  return data;
} catch (error) {
  console.error("There was an error!", error);
  return null;
}
}

export const getUserById = async (id: number) => {
  const url = `${USER_API_URL}/get/id/${id}`;
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (!res.ok) {
      console.log(res);
      return null;
    }
    const data = await res.json();
    return data;
  } catch (error) {
    console.error("There was an error!", error);
    return null;
  }
}

export const getUserByEmail = async (email: string) => {
  const url = `${USER_API_URL}/get/email/${email}`;
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (!res.ok) {
      console.log(res);
      return null;
    }
    const data = await res.json();
    return data;
  } catch (error) {
    console.error("There was an error!", error);
    return null;
  }
}

export const createUser = async (user: PostUserType) => {
  const url = `${USER_API_URL}/create`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(user),
    });
    if (!res.ok) {
      console.log(res);
      return null;
    }
    const data = await res.json();
    return data;
  } catch (error) {
    console.error("There was an error!", error);
    return null;
  }
}

