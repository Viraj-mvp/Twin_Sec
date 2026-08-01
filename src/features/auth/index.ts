export {
  useOperatorSession,
  saveLocalSession,
  getLocalSession,
  removeLocalSession,
  usePreferences,
  getPreferences,
  savePreferences,
  type UserPreferences,
  type OperatorSession,
} from "@/lib/auth-store";

export {
  registerOperator,
  loginOperator,
  getOperatorSession,
  logoutOperator,
  deleteOperatorAccount,
  exportOperatorData,
} from "@/lib/api/auth.functions";

export { OperatorProvider, useOperator } from "@/contexts/OperatorContext";
export { SimulationAuthGate } from "@/components/SimulationAuthGate";
