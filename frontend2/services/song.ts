const SONG_API_URL = `${process.env.API_URL}/songs`;

export const createSong = async (song: {
  title: string;
  type: string;
  color: string;
  symbol: string;
  chemical_name: string;
  style: string;
  lyrics: string;
  image: string;
  url: string;
  user_id: number;
}) => {
  const res = await fetch(`${SONG_API_URL}/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(song),
  });

  if (!res.ok) {
    throw new Error("楽曲の登録に失敗しました");
  }

  return res.json();
};

export const getAllSongs = async () => {
  const res = await fetch(`${SONG_API_URL}/get/all`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    throw new Error("楽曲の取得に失敗しました");
  }

  return res.json();
};

export const getSongById = async (id: number) => {
  const res = await fetch(`${SONG_API_URL}/get/id/${id}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    throw new Error("楽曲の取得に失敗しました");
  }

  return res.json();
}

export const getSongByUserId = async (user_id: number) => {
  const res = await fetch(`${SONG_API_URL}/get/user/${user_id}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    return res.json();
  }

  return res.json();
}

export const getSongByChemicalName = async (chemical_name: string) => {
  const res = await fetch(`${SONG_API_URL}/get/chemical_name/${chemical_name}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    throw new Error("楽曲の取得に失敗しました");
  }

  return res.json();
}

export const getSongByStyle = async (style: string) => {
  const res = await fetch(`${SONG_API_URL}/get/style/${style}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    throw new Error("楽曲の取得に失敗しました");
  }

  return res.json();
}

export const getNextSongId = async () => {
  const res = await fetch(`${SONG_API_URL}/get/random`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    throw new Error("楽曲の取得に失敗しました");
  }

  return res.json();
}

export const getRecentSongs = async () => {
  const res = await fetch(`${SONG_API_URL}/get/recent`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    throw new Error("楽曲の取得に失敗しました");
  }

  return res.json();
}