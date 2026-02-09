import { ProfileList } from '../components/players/PlayerList.tsx';

export function PlayersPage() {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Players</h2>
      <ProfileList />
    </div>
  );
}
