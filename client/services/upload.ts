const UPLOAD_API_URL = `${process.env.API_URL}/upload/audio`;


export const uploadAudio = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(UPLOAD_API_URL, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    throw new Error("音声ファイルのアップロードに失敗しました");
  }

  const data = await res.json();
  return data.path as string;
};

export const uploadImage = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${process.env.API_URL}/upload/image`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    throw new Error("画像ファイルのアップロードに失敗しました");
  }

  const data = await res.json();
  const path = data.path as string;
  const url = `${process.env.API_URL}/${path}`;
  return url
};