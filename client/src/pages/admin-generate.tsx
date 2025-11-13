import { TokenGenerator } from "@/components/TokenGenerator";

export default function AdminGenerate() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Generate Tokens</h1>
        <p className="text-muted-foreground mt-2">
          Create new access tokens for Wi-Fi network
        </p>
      </div>

      <div className="max-w-2xl">
        <TokenGenerator />
      </div>
    </div>
  );
}
