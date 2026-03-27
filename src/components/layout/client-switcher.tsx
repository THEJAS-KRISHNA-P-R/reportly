'use client';

import * as React from "react";
import { 
  ChevronsUpDown, 
  Check, 
  PlusCircle, 
  Settings 
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useClientStore } from "@/store/client-store";
import { Client } from "@/types/client";

import { useRouter } from "next/navigation";

export function ClientSwitcher() {
  const { clients, activeClient, setActiveClient } = useClientStore();
  const router = useRouter();

  const handleSelect = (client: Client) => {
    setActiveClient(client);
    router.push(`/client/${client.id}`);
  };
  React.useEffect(() => {
    if (!activeClient && clients.length > 0) {
      setActiveClient(clients[0]);
    }
  }, [activeClient, clients, setActiveClient]);

  if (!activeClient) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-surface-200 transition-colors text-sm focus:outline-none focus:ring-1 focus:ring-border">
          <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold">
            {activeClient.name.charAt(0).toUpperCase()}
          </div>
          <span className="text-sm font-medium text-foreground truncate max-w-[120px]">
            {activeClient.name}
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded border border-border text-foreground-muted uppercase font-bold tracking-tight">
            {activeClient.plan}
          </span>
          <ChevronsUpDown className="h-4 w-4 text-foreground-subtle" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64 p-1" align="start">
        <DropdownMenuLabel className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-widest text-foreground-muted">
          Switch client
        </DropdownMenuLabel>
        <div className="space-y-0.5">
          {clients.map((client) => (
            <DropdownMenuItem
              key={client.id}
              onClick={() => handleSelect(client)}
              className={cn(
                "flex items-center justify-between px-2 py-2 rounded-md cursor-pointer transition-colors",
                activeClient.id === client.id ? "bg-surface-200" : "hover:bg-surface-200/50"
              )}
            >
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold">
                  {client.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-foreground">{client.name}</span>
                  <span className="text-[10px] text-foreground-muted">{client.lastActivity}</span>
                </div>
              </div>
              {activeClient.id === client.id && (
                <Check className="h-4 w-4 text-primary" />
              )}
            </DropdownMenuItem>
          ))}
        </div>
        <DropdownMenuSeparator className="my-1 bg-border" />
        <DropdownMenuItem className="flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer hover:bg-surface-200">
          <PlusCircle className="h-4 w-4 text-foreground-muted" />
          <span className="text-sm font-medium text-foreground">Create new client</span>
        </DropdownMenuItem>
        <DropdownMenuItem className="flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer hover:bg-surface-200">
          <Settings className="h-4 w-4 text-foreground-muted" />
          <span className="text-sm font-medium text-foreground">Manage clients</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
