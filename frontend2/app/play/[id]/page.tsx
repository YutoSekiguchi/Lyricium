import PlayMain from "@/components/app/play/main";

export default async function PlayPage({ params }: { params: { id: string }}) {
  const id = Number(params.id);
  return (
    <div>
      <PlayMain song_id={id} />
    </div>
  );
}