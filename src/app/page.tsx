import RhythmMachine from "@/components/RhythmMachine";

export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4 sm:p-6 md:p-10">
      <div className="w-full max-w-3xl">
        <RhythmMachine />
      </div>
    </main>
  );
}
