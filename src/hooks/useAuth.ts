// Hook exposing the AuthContext value; must be used inside AuthProvider.
import { useContext } from "react";
import { AuthContext, type AuthContextValue } from "@/context/AuthContext";

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
