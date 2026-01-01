import DashboardPage from '@/components/dashboard/DashboardPage';
import { TeamProvider } from '@/contexts/TeamContext';

export default function Dashboard() {
  return (
    <TeamProvider>
      <DashboardPage />
    </TeamProvider>
  );
}
