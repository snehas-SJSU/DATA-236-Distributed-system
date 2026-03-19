import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [owner, setOwner] = useState(null);
  const [role, setRole] = useState(localStorage.getItem("role") || null);
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedOwner = localStorage.getItem("owner");
    if (storedUser && token && role === "user") setUser(JSON.parse(storedUser));
    if (storedOwner && token && role === "owner") setOwner(JSON.parse(storedOwner));
    setLoading(false);
  }, [token, role]);

  const login = (principal, authToken, nextRole = "user") => {
    setToken(authToken);
    setRole(nextRole);
    localStorage.setItem("token", authToken);
    localStorage.setItem("role", nextRole);
    if (nextRole === "owner") {
      setOwner(principal);
      setUser(null);
      localStorage.setItem("owner", JSON.stringify(principal));
      localStorage.removeItem("user");
    } else {
      setUser(principal);
      setOwner(null);
      localStorage.setItem("user", JSON.stringify(principal));
      localStorage.removeItem("owner");
    }
  };

  const logout = () => {
    setUser(null);
    setOwner(null);
    setRole(null);
    setToken(null);
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("user");
    localStorage.removeItem("owner");
  };

  return (
    <AuthContext.Provider value={{ user, owner, role, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
