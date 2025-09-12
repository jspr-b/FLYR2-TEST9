"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download, RefreshCw, Shield } from "lucide-react"

export default function ConsentAdminPage() {
  const [consents, setConsents] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [adminSecret, setAdminSecret] = useState("")
  const [stats, setStats] = useState({ total: 0, agreed: 0, declined: 0 })
  const [page, setPage] = useState(1)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  const fetchConsents = async () => {
    if (!adminSecret) return
    
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/consent-logs?page=${page}&limit=50`, {
        headers: {
          "Authorization": `Bearer ${adminSecret}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setConsents(data.data)
        setStats(data.statistics)
        setIsAuthenticated(true)
      } else if (response.status === 401) {
        alert("Invalid admin secret")
        setIsAuthenticated(false)
      }
    } catch (error) {
      console.error("Error fetching consents:", error)
    } finally {
      setLoading(false)
    }
  }

  const exportCSV = async () => {
    if (!adminSecret) return
    
    try {
      const response = await fetch("/api/admin/consent-logs", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${adminSecret}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date().toISOString()
        })
      })
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `consents-${new Date().toISOString()}.csv`
        a.click()
      }
    } catch (error) {
      console.error("Error exporting:", error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield className="h-8 w-8 text-blue-600" />
                <CardTitle className="text-2xl">Consent Management Admin</CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {!isAuthenticated ? (
              <div className="space-y-4">
                <p className="text-gray-600">Enter admin secret to access consent logs:</p>
                <div className="flex gap-4">
                  <Input
                    type="password"
                    placeholder="Admin Secret"
                    value={adminSecret}
                    onChange={(e) => setAdminSecret(e.target.value)}
                    className="max-w-md"
                  />
                  <Button onClick={fetchConsents} disabled={!adminSecret}>
                    Authenticate
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Statistics */}
                <div className="grid grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-6">
                      <div className="text-2xl font-bold">{stats.total}</div>
                      <p className="text-sm text-gray-500">Total Records</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6">
                      <div className="text-2xl font-bold text-green-600">{stats.agreed}</div>
                      <p className="text-sm text-gray-500">Agreements</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6">
                      <div className="text-2xl font-bold text-red-600">{stats.declined}</div>
                      <p className="text-sm text-gray-500">Declines</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Actions */}
                <div className="flex gap-4">
                  <Button onClick={fetchConsents} disabled={loading}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                  <Button onClick={exportCSV} variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                </div>

                {/* Table */}
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Session ID</TableHead>
                        <TableHead>IP Address</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Timestamp</TableHead>
                        <TableHead>Browser</TableHead>
                        <TableHead>OS</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {consents.map((consent) => (
                        <TableRow key={consent._id}>
                          <TableCell className="font-mono text-xs">
                            {consent.sessionId.substring(0, 12)}...
                          </TableCell>
                          <TableCell>{consent.ipAddress}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded text-xs ${
                              consent.action === 'agreed' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {consent.action}
                            </span>
                          </TableCell>
                          <TableCell>
                            {new Date(consent.timestamp).toLocaleString()}
                          </TableCell>
                          <TableCell>{consent.metadata?.browser || 'Unknown'}</TableCell>
                          <TableCell>{consent.metadata?.os || 'Unknown'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                <div className="flex justify-center gap-4">
                  <Button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    variant="outline"
                  >
                    Previous
                  </Button>
                  <span className="flex items-center px-4">Page {page}</span>
                  <Button
                    onClick={() => setPage(page + 1)}
                    disabled={consents.length < 50}
                    variant="outline"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}