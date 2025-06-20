"use client";
//set items as client only components
import { useState, useEffect } from "react";

interface ClientOnlyProps {
  children: React.ReactNode; // Child components to be rendered conditionally
}

const ClientOnly: React.FC<ClientOnlyProps> = ({ children }) => {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) return null;

  return <>{children}</>;
};

export default ClientOnly;
