"use client";

import { useState } from "react";
import { DataTable } from "@/components/table";
import { TableCell, TableRow } from "@/components/ui/table";

const CLIENTS_HEADER = ["Name", "Email", "Phone", "Company"];

const MOCK_CLIENTS = [
  { name: "Alice Smith", email: "alice@example.com", phone: "555-1234", company: "Acme Corp" },
  { name: "Bob Johnson", email: "bob@example.com", phone: "555-5678", company: "Beta LLC" },
  { name: "Carol Lee", email: "carol@example.com", phone: "555-8765", company: "Gamma Inc" },
  // ...add more as needed
];

export default function ClientsPage() {
  const [search, setSearch] = useState("");

  const filteredClients = MOCK_CLIENTS.filter(
    (client) =>
      client.name.toLowerCase().includes(search.toLowerCase()) ||
      client.email.toLowerCase().includes(search.toLowerCase()) ||
      client.phone.includes(search) ||
      client.company.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">All Clients</h1>
      <input
        type="text"
        placeholder="Search clients..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-4 px-3 py-2 border rounded w-full max-w-md"
      />
      <DataTable headers={CLIENTS_HEADER}>
        {filteredClients.map((client, idx) => (
          <TableRow key={idx}>
            <TableCell>{client.name}</TableCell>
            <TableCell>{client.email}</TableCell>
            <TableCell>{client.phone}</TableCell>
            <TableCell>{client.company}</TableCell>
          </TableRow>
        ))}
      </DataTable>
      {filteredClients.length === 0 && (
        <div className="text-center text-gray-500 py-8">No clients found.</div>
      )}
    </div>
  );
} 