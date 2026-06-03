import { useAuth } from '../contexts/AuthContext';

export default function SimulationBanner() {
  const { simulationMode, simulationLoading } = useAuth();

  if (simulationLoading || !simulationMode) return null;

  return (
    <div className="bg-amber-500/20 border-b border-amber-500/40 px-4 py-2.5 text-center">
      <p className="text-amber-200 text-sm font-medium">
        ⚠️ Simulation mode active — standings and results shown are not real
      </p>
    </div>
  );
}
