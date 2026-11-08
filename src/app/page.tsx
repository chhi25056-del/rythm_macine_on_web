import RhythmMachine from "@/components/RhythmMachine";

export default function Home() {
  return (
    <main className="min-h-screen w-full bg-zinc-950 flex flex-col items-center p-2 sm:p-4 md:p-6 overflow-y-auto">
      <div className="w-full max-w-5xl my-auto flex items-center justify-center">
        <RhythmMachine />
      </div>
    </main>
  );
}
