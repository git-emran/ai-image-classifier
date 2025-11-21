import { useContext } from "react";
import { AuthContextType } from "@/types";

const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};

export default useAuth;
