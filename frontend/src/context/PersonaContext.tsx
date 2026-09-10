import React, { createContext, useContext, useState, useEffect } from 'react';

type Persona = 'simple' | 'analyst';

interface PersonaContextType {
  persona: Persona;
  setPersona: (p: Persona) => void;
  togglePersona: () => void;
  isAnalyst: boolean;
}

const PersonaContext = createContext<PersonaContextType | undefined>(undefined);

export const PersonaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [persona, setPersona] = useState<Persona>(() => {
    const saved = localStorage.getItem('apix_persona');
    return saved === 'analyst' ? 'analyst' : 'simple';
  });

  useEffect(() => {
    localStorage.setItem('apix_persona', persona);
  }, [persona]);

  const togglePersona = () => {
    setPersona((prev) => (prev === 'simple' ? 'analyst' : 'simple'));
  };

  return (
    <PersonaContext.Provider
      value={{
        persona,
        setPersona,
        togglePersona,
        isAnalyst: persona === 'analyst',
      }}
    >
      {children}
    </PersonaContext.Provider>
  );
};

export const usePersona = (): PersonaContextType => {
  const context = useContext(PersonaContext);
  if (!context) {
    throw new Error('usePersona must be used within a PersonaProvider');
  }
  return context;
};
