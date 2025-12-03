"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Download, Activity, BarChart3, FileJson, Binary } from "lucide-react";

interface TraceEvent {
  name: string;
  event_type: string;
  timestamp: number;
  duration: number;
  device_id?: number;
  stream_id?: number;
  thread_id?: number;
  grid_dim?: number[];
  block_dim?: number[];
  shared_mem?: number;
  mem_size?: number;
  metadata?: Record<string, any>;
}

interface TraceStats {
  total_events: number;
  event_types: Record<string, number>;
  total_duration_ns: number;
  device_count: number;
  stream_count: number;
}

export default function TracingPage() {
  const [events, setEvents] = useState<TraceEvent[]>([]);
  const [format, setFormat] = useState<"protobuf" | "json">("protobuf");
  const [stats, setStats] = useState<TraceStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Sample data generator
  const generateSampleData = () => {
    const sampleEvents: TraceEvent[] = [
      {
        name: "vectorAdd",
        event_type: "kernel",
        timestamp: 1000000,
        duration: 500000,
        device_id: 0,
        stream_id: 1,
        grid_dim: [256, 1, 1],
        block_dim: [256, 1, 1],
        shared_mem: 0,
        metadata: {
          operator: "aten::add",
          device: "cuda:0",
        },
      },
      {
        name: "memcpy_H2D",
        event_type: "memory",
        timestamp: 2000000,
        duration: 100000,
        device_id: 0,
        stream_id: 0,
        mem_size: 16384,
      },
      {
        name: "cudaMalloc",
        event_type: "memory",
        timestamp: 3000000,
        duration: 0,
        device_id: 0,
        stream_id: 0,
        mem_size: 1048576,
      },
      {
        name: "cudaStreamSynchronize",
        event_type: "sync",
        timestamp: 4000000,
        duration: 200000,
        device_id: 0,
        stream_id: 1,
      },
    ];

    setEvents(sampleEvents);
    setSuccess("Generated 4 sample GPU events");
  };

  // Analyze traces
  const analyzeTraces = async () => {
    if (events.length === 0) {
      setError("No events to analyze. Generate or load events first.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/v1/tracing/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(events),
      });

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.statusText}`);
      }

      const data = await response.json();
      setStats(data);
      setSuccess("Analysis complete!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setLoading(false);
    }
  };

  // Export traces
  const exportTraces = async () => {
    if (events.length === 0) {
      setError("No events to export. Generate or load events first.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/v1/tracing/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          events,
          format,
        }),
      });

      if (!response.ok) {
        throw new Error(`Export failed: ${response.statusText}`);
      }

      const data = await response.json();

      // Show success message with compression ratio
      let message = `Exported ${data.event_count} events (${data.file_size} bytes)`;
      if (data.compression_ratio) {
        message += ` - ${data.compression_ratio}x smaller than JSON!`;
      }
      setSuccess(message);

      // Download the file
      const downloadUrl = `/api/v1/tracing/download/${data.file_path
        .split("/")
        .pop()}`;
      window.open(downloadUrl, "_blank");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">GPU Performance Tracing</h1>
          <p className="text-muted-foreground">
            Export GPU traces in Perfetto format with 6.8x compression
          </p>
        </div>
        <Activity className="h-10 w-10 text-primary" />
      </div>

      {/* Actions Card */}
      <Card>
        <CardHeader>
          <CardTitle>Trace Actions</CardTitle>
          <CardDescription>
            Generate, analyze, or export GPU trace events
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button onClick={generateSampleData} variant="outline">
              <Activity className="mr-2 h-4 w-4" />
              Generate Sample Data
            </Button>

            <Button onClick={analyzeTraces} disabled={loading}>
              <BarChart3 className="mr-2 h-4 w-4" />
              Analyze Traces
            </Button>
          </div>

          <div className="flex items-end gap-4">
            <div className="flex-1 space-y-2">
              <label className="text-sm font-medium">Export Format</label>
              <Select value={format} onValueChange={(v) => setFormat(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="protobuf">
                    <div className="flex items-center">
                      <Binary className="mr-2 h-4 w-4" />
                      Protobuf (6.8x smaller)
                    </div>
                  </SelectItem>
                  <SelectItem value="json">
                    <div className="flex items-center">
                      <FileJson className="mr-2 h-4 w-4" />
                      JSON (Compatible)
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={exportTraces} disabled={loading}>
              <Download className="mr-2 h-4 w-4" />
              Export Traces
            </Button>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert>
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Statistics Card */}
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle>Trace Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total Events</p>
                <p className="text-2xl font-bold">{stats.total_events}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Devices</p>
                <p className="text-2xl font-bold">{stats.device_count}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Streams</p>
                <p className="text-2xl font-bold">{stats.stream_count}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Duration</p>
                <p className="text-2xl font-bold">
                  {(stats.total_duration_ns / 1000000).toFixed(2)}ms
                </p>
              </div>
            </div>

            <div className="mt-6">
              <h4 className="font-semibold mb-2">Event Types</h4>
              <div className="space-y-2">
                {Object.entries(stats.event_types).map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between">
                    <span className="text-sm capitalize">{type}</span>
                    <span className="text-sm font-mono">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Events List */}
      {events.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Trace Events ({events.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-auto">
              {events.map((event, idx) => (
                <div
                  key={idx}
                  className="p-3 border rounded-lg hover:bg-accent transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{event.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {(event.duration / 1000).toFixed(1)}µs
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {event.event_type} · Device {event.device_id} · Stream{" "}
                    {event.stream_id}
                  </div>
                  {event.grid_dim && (
                    <div className="text-xs text-muted-foreground mt-1">
                      Grid: [{event.grid_dim.join(", ")}] · Block: [
                      {event.block_dim?.join(", ")}]
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions Card */}
      <Card>
        <CardHeader>
          <CardTitle>How to Use</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <ol className="list-decimal list-inside space-y-2">
            <li>
              Click <strong>Generate Sample Data</strong> to create sample GPU
              events
            </li>
            <li>
              Click <strong>Analyze Traces</strong> to see statistics
            </li>
            <li>
              Select export format (Protobuf recommended for 6.8x compression)
            </li>
            <li>
              Click <strong>Export Traces</strong> to download the trace file
            </li>
            <li>
              Open the trace in{" "}
              <a
                href="https://ui.perfetto.dev"
                target="_blank"
                className="text-primary hover:underline"
              >
                Perfetto UI
              </a>
            </li>
          </ol>

          <div className="mt-4 p-3 bg-accent rounded-lg">
            <p className="font-semibold">Perfetto Protobuf Benefits:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>85% smaller file size (6.8x compression)</li>
              <li>5-7x faster encoding than JSON</li>
              <li>Industry-standard format</li>
              <li>SQL query support in Perfetto UI</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
