import { AppShell } from "../components/AppShell";
import { AuthGate } from "../components/AuthGate";

export default function ChatsPage() {
  return (
    <AuthGate>
      <AppShell />
    </AuthGate>
  );
}
