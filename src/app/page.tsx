import RhythmMachine from "@/components/RhythmMachine";

export default function Home() {
  return (
    <main className="h-screen w-screen overflow-hidden bg-zinc-950 flex flex-col items-center justify-center p-2 sm:p-4 md:p-6">
      <div className="w-full max-w-5xl flex items-center justify-center">
        <RhythmMachine />
      </div>
    </main>
  );
}
