import { create } from "zustand"
import { Client } from "@/types/client"

type ClientStore = {
  clients: Client[]
  activeClient: Client | null
  setActiveClient: (client: Client | null) => void
}

export const useClientStore = create<ClientStore>((set) => ({
  clients: [
    { id: "1", name: "Test Artifitwo", plan: "free", lastActivity: "2h ago" },
    { id: "2", name: "Reportly", plan: "pro", lastActivity: "1d ago" },
    { id: "3", name: "Whitematrix", plan: "free", lastActivity: "3d ago" },
  ],
  activeClient: null,
  setActiveClient: (client) => set({ activeClient: client }),
}))
